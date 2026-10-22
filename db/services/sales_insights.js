const InvoiceModel = require("../models/invoice");
const FootwearModel = require("../models/footwear");

// Tunable thresholds for recommendations
const DEFAULT_GROWTH_PCT = 10; // used when an item has only one year of history
const GROWTH_CLAMP = 0.5; // computed growth is limited to -50%..+50%
const OK_TOLERANCE_PCT = 0.1; // |need| within 10% of expected => OK
const OK_TOLERANCE_PAIRS = 2; // ...or within 2 pairs
const PACE_RISING = 1.3;
const PACE_FALLING = 0.7;
const PACE_MIN_BASE = 3; // need at least this many pairs last year to-date for a pace flag
const PACE_ADJUST_CLAMP = [0.5, 1.5];

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const NO_CATEGORY = "(no category)";
const NO_LABEL = "(no label)";

// 'YYYY-MM-DD' -> Date at IST midnight of that day
function istDate(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
}

// Shift a 'YYYY-MM-DD' by whole years, 29 Feb -> 28 Feb
function shiftYmd(ymd, years) {
  let [y, m, d] = ymd.split("-").map(Number);
  y += years;
  if (m === 2 && d === 29 && new Date(Date.UTC(y, 1, 29)).getUTCMonth() !== 1) d = 28;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addDaysYmd(ymd, days) {
  const t = new Date(Date.parse(ymd + "T00:00:00Z") + days * DAY_MS);
  return t.toISOString().slice(0, 10);
}

function todayIstYmd() {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// Weighted average where values[0] is the most recent (weight 1, then 0.5, 0.25 ...)
function recencyWeightedAvg(values) {
  let sum = 0, wSum = 0;
  values.forEach((v, i) => {
    const w = Math.pow(0.5, i);
    sum += v * w;
    wSum += w;
  });
  return wSum ? sum / wSum : 0;
}

function groupStage() {
  return {
    $group: {
      _id: { b: "$bucket", k: "$key" },
      pairs: { $sum: 1 },
      revenue: { $sum: { $ifNull: ["$selling_price", 0] } },
      profit: { $sum: { $ifNull: ["$profit", 0] } },
      lyToDate: { $sum: { $cond: ["$lyTD", 1, 0] } },
    },
  };
}

// Turn facet rows into { key: { CUR:{pairs,revenue,profit}, Y1:{...}, ..., lyToDate } }
function toKeyMap(rows) {
  const map = {};
  for (const r of rows) {
    const key = r._id.k;
    map[key] ??= { lyToDate: 0 };
    map[key][r._id.b] = { pairs: r.pairs, revenue: r.revenue, profit: r.profit };
    map[key].lyToDate += r.lyToDate;
  }
  return map;
}

function buildRow(key, sales, stock, ctx) {
  const { years, startYear, growthPct, forceGrowth, adjustByPace, started, elapsedFraction } = ctx;
  const cur = sales?.CUR || { pairs: 0, revenue: 0, profit: 0 };
  const S = cur.pairs;
  const K = stock || 0;
  const lyToDate = sales?.lyToDate || 0;

  // history[0] = last year, history[1] = 2 years ago ...
  const historyArr = [];
  const history = {};
  for (let k = 1; k <= years; k++) {
    const n = sales?.["Y" + k]?.pairs || 0;
    historyArr.push(n);
    history[startYear - k] = n;
  }
  const hasHistory = historyArr.some((n) => n > 0);

  // LY: last year, or weighted older years if last year had nothing
  let LY = historyArr[0] || 0;
  let lyBasis = "LAST_YEAR";
  if (LY === 0 && historyArr.slice(1).some((n) => n > 0)) {
    LY = recencyWeightedAvg(historyArr.slice(1));
    lyBasis = "OLDER_YEARS";
  }

  // g: recency-weighted year-over-year growth, or default
  const growths = [];
  for (let i = 0; i + 1 < historyArr.length; i++) {
    if (historyArr[i + 1] > 0) growths.push(historyArr[i] / historyArr[i + 1] - 1);
  }
  let g, growthBasis;
  if (forceGrowth || growths.length === 0) {
    g = growthPct / 100;
    growthBasis = forceGrowth ? "USER" : "DEFAULT";
  } else {
    g = Math.max(-GROWTH_CLAMP, Math.min(GROWTH_CLAMP, recencyWeightedAvg(growths)));
    growthBasis = "HISTORY";
  }

  let E = LY * (1 + g);
  let expectedBasis = "HISTORY";
  if (!hasHistory && S > 0 && started && elapsedFraction > 0) {
    // New item with no past season: project current run rate over the full range
    E = S / elapsedFraction;
    expectedBasis = "RUN_RATE";
  }

  const pace = started && lyToDate > 0 ? S / lyToDate : null;
  let paceFlag = null;
  if (pace !== null && lyToDate >= PACE_MIN_BASE) {
    if (pace >= PACE_RISING) paceFlag = "RISING";
    else if (pace <= PACE_FALLING) paceFlag = "FALLING";
  }
  if (adjustByPace && pace !== null && expectedBasis === "HISTORY") {
    const p = Math.max(PACE_ADJUST_CLAMP[0], Math.min(PACE_ADJUST_CLAMP[1], pace));
    E = Math.max(E * p, S);
    expectedBasis = "HISTORY_PACE";
  }

  const need = Math.round(E - S - K);
  let action, qty, reason;
  const gTxt = `${g >= 0 ? "+" : ""}${Math.round(g * 100)}%`;
  if (!hasHistory && S === 0) {
    if (K > 0) {
      action = "DEAD";
      qty = K;
      reason = `No sales in this period in any past year and none so far; ${K} in stock → clear ${K}.`;
    } else {
      action = "OK";
      qty = 0;
      reason = "No sales history and no stock.";
    }
  } else {
    const tolerance = Math.max(OK_TOLERANCE_PAIRS, E * OK_TOLERANCE_PCT);
    const base =
      expectedBasis === "RUN_RATE"
        ? `No past season; current pace projects ${Math.round(E)}.`
        : `${lyBasis === "LAST_YEAR" ? "Last year" : "Earlier years avg"} ${round1(LY)} → expected ${Math.round(E)} (${gTxt}${expectedBasis === "HISTORY_PACE" ? ", pace adjusted" : ""}).`;
    const tail = `Sold ${S}, in stock ${K}`;
    if (Math.abs(need) <= tolerance) {
      action = "OK";
      qty = 0;
      reason = `${base} ${tail} → stock is about right (${need >= 0 ? "+" : ""}${need}).`;
    } else if (need > 0) {
      action = "STOCK_UP";
      qty = need;
      reason = `${base} ${tail} → stock up ${need}.`;
    } else {
      action = "REDUCE";
      qty = -need;
      reason = `${base} ${tail} → ${-need} extra, reduce/clear.`;
    }
  }

  return {
    key,
    S,
    revenue: cur.revenue,
    profit: Math.round(cur.profit),
    LY: round1(LY),
    lyBasis,
    LY_toDate: lyToDate,
    history,
    g: round1(g * 100),
    growthBasis,
    E: Math.round(E),
    expectedBasis,
    K,
    need,
    action,
    qty,
    pace: pace === null ? null : round1(pace),
    paceFlag,
    reason,
  };
}

function rankLists(rows, placeholder, limit, started) {
  const metric = started ? "S" : "LY";
  const ranked = rows.filter((r) => r.key !== placeholder && r[metric] > 0);
  const top = [...ranked].sort((a, b) => b[metric] - a[metric] || b.revenue - a.revenue).slice(0, limit);
  const bottom = [...ranked].sort((a, b) => a[metric] - b[metric] || a.revenue - b.revenue).slice(0, limit);
  const zeroSales = rows.filter((r) => r.key !== placeholder && r.S === 0).map((r) => r.key).sort();
  const actionOrder = { STOCK_UP: 0, REDUCE: 1, DEAD: 2, OK: 3 };
  const all = [...rows].sort(
    (a, b) => actionOrder[a.action] - actionOrder[b.action] || b.qty - a.qty || b.S - a.S
  );
  return { rankedBy: metric, top, bottom, zeroSales, rows: all };
}

module.exports = {
  /**
   * @param {object} p
   * @param {string} p.startDate 'YYYY-MM-DD' (inclusive, IST)
   * @param {string} p.endDate 'YYYY-MM-DD' (inclusive, IST)
   * @param {'ALL'|'SHOP'|'HOME'} p.soldAt
   * @param {number} [p.growthPct] default growth % when no history to compute it
   * @param {boolean} [p.forceGrowth] use growthPct for every item
   * @param {boolean} [p.adjustByPace]
   * @param {number} [p.limit]
   */
  async getSalesInsights({ startDate, endDate, soldAt = "ALL", growthPct, forceGrowth = false, adjustByPace = false, limit = 10 }) {
    growthPct = Number.isFinite(Number(growthPct)) && growthPct !== null && growthPct !== "" ? Number(growthPct) : DEFAULT_GROWTH_PCT;
    const soldAtMatch = soldAt && soldAt !== "ALL" ? { sold_at: soldAt } : {};

    const start = istDate(startDate);
    const endExcl = istDate(addDaysYmd(endDate, 1));
    const now = new Date();
    const started = now >= start;
    const ended = now >= endExcl;
    const daysTotal = Math.round((endExcl - start) / DAY_MS);
    const daysElapsed = started ? Math.min(daysTotal, Math.ceil((Math.min(now, endExcl) - start) / DAY_MS)) : 0;
    const elapsedFraction = daysTotal ? daysElapsed / daysTotal : 0;
    const startYear = Number(startDate.slice(0, 4));

    // How many past years of data exist
    const first = await InvoiceModel.findOne({ invoice_date: { $ne: null } }, { invoice_date: 1 }).sort({ invoice_date: 1 }).lean();
    const firstYear = first ? new Date(first.invoice_date.getTime() + IST_OFFSET_MS).getUTCFullYear() : startYear;
    const years = Math.max(0, startYear - firstYear);

    const windows = [{ b: "CUR", from: start, to: endExcl }];
    for (let k = 1; k <= years; k++) {
      windows.push({
        b: "Y" + k,
        from: istDate(shiftYmd(startDate, -k)),
        to: istDate(addDaysYmd(shiftYmd(endDate, -k), 1)),
      });
    }
    // Last year's same dates up to today's equivalent (for the pace check)
    const todayYmd = todayIstYmd();
    const cutoffYmd = ended ? addDaysYmd(endDate, 1) : addDaysYmd(todayYmd, 1);
    const lyTdFrom = istDate(shiftYmd(startDate, -1));
    const lyTdTo = istDate(shiftYmd(cutoffYmd, -1));

    const inWindow = (w) => ({ $and: [{ $gte: ["$invoice_date", w.from] }, { $lt: ["$invoice_date", w.to] }] });

    const [agg] = await InvoiceModel.aggregate([
      {
        $match: {
          invoice_status: { $ne: "RETURNED" },
          ...soldAtMatch,
          $or: windows.map((w) => ({ invoice_date: { $gte: w.from, $lt: w.to } })),
        },
      },
      {
        $lookup: {
          from: FootwearModel.collection.name,
          localField: "product_id",
          foreignField: "footwear_id",
          as: "p",
        },
      },
      {
        $addFields: {
          p: { $first: "$p" },
          bucket: { $switch: { branches: windows.map((w) => ({ case: inWindow(w), then: w.b })), default: null } },
          lyTD: started ? { $and: [{ $gte: ["$invoice_date", lyTdFrom] }, { $lt: ["$invoice_date", lyTdTo] }] } : false,
        },
      },
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: "$bucket",
                pairs: { $sum: 1 },
                revenue: { $sum: { $ifNull: ["$selling_price", 0] } },
                profit: { $sum: { $ifNull: ["$profit", 0] } },
                lyToDate: { $sum: { $cond: ["$lyTD", 1, 0] } },
                unmatched: { $sum: { $cond: [{ $ifNull: ["$p", false] }, 0, 1] } },
              },
            },
          ],
          byCategory: [
            { $addFields: { key: { $ifNull: ["$p.category", NO_CATEGORY] } } },
            groupStage(),
          ],
          byLabel: [
            {
              $addFields: {
                key: {
                  $cond: [
                    { $gt: [{ $size: { $ifNull: ["$p.label", []] } }, 0] },
                    { $setUnion: ["$p.label", []] },
                    [NO_LABEL],
                  ],
                },
              },
            },
            { $unwind: "$key" },
            groupStage(),
          ],
        },
      },
    ]);

    // Stock per category / label, at the selected place
    const [stockAgg] = await FootwearModel.aggregate([
      {
        $project: {
          category: { $ifNull: ["$category", NO_CATEGORY] },
          label: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ["$label", []] } }, 0] },
              { $setUnion: ["$label", []] },
              [NO_LABEL],
            ],
          },
          qty: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: { $ifNull: ["$pairs_in_stock", []] },
                    as: "s",
                    cond: soldAtMatch.sold_at ? { $eq: ["$$s.available_at", soldAtMatch.sold_at] } : true,
                  },
                },
                as: "s",
                in: { $ifNull: ["$$s.quantity", 0] },
              },
            },
          },
        },
      },
      {
        $facet: {
          byCategory: [{ $group: { _id: "$category", qty: { $sum: "$qty" } } }],
          byLabel: [{ $unwind: "$label" }, { $group: { _id: "$label", qty: { $sum: "$qty" } } }],
        },
      },
    ]);

    const ctx = { years, startYear, growthPct, forceGrowth, adjustByPace, started, elapsedFraction };
    const build = (salesRows, stockRows, placeholder) => {
      const sales = toKeyMap(salesRows);
      const stock = Object.fromEntries(stockRows.map((r) => [String(r._id), r.qty]));
      const keys = new Set([...Object.keys(sales), ...Object.keys(stock)]);
      const rows = [...keys].map((k) => buildRow(k, sales[k], stock[k], ctx));
      return rankLists(rows, placeholder, limit, started);
    };

    const totalsBy = Object.fromEntries(agg.totals.map((t) => [t._id, t]));
    const cur = totalsBy.CUR || { pairs: 0, revenue: 0, profit: 0, unmatched: 0 };
    const ly = totalsBy.Y1 || { pairs: 0, revenue: 0, profit: 0 };
    const lyToDate = agg.totals.reduce((a, t) => a + t.lyToDate, 0);

    return {
      period: { startDate, endDate, soldAt, started, ended, daysElapsed, daysTotal, today: todayYmd },
      totals: {
        S: cur.pairs,
        revenue: cur.revenue,
        profit: Math.round(cur.profit),
        LY: ly.pairs,
        LY_revenue: ly.revenue,
        LY_toDate: lyToDate,
        pace: started && lyToDate > 0 ? round1(cur.pairs / lyToDate) : null,
      },
      categories: build(agg.byCategory, stockAgg.byCategory, NO_CATEGORY),
      labels: build(agg.byLabel, stockAgg.byLabel, NO_LABEL),
      meta: { yearsOfHistory: years, unmatchedPairs: cur.unmatched || 0, defaultGrowthPct: growthPct, forceGrowth, adjustByPace },
    };
  },
};
