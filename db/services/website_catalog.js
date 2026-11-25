// Builds the customer-facing catalog from footwear documents.
//
// Rules (agreed with the owner):
// - Only products with show_on_website = true are visible.
// - Products sharing a group_key form one group (one article). Each colour of a
//   group is its own card in the list; the product page shows the group's other
//   colours as options. Different size ranges of the same colour are merged
//   into one size list (each size keeps its own product's price).
// - Price = website_price, or selling_price when website_price is empty.
// - Stock is combined across both stores. Quantities are never exposed.
// - Out-of-stock products are still listed, but always after in-stock ones.
// - "New arrival": groups first shown in the last 30 days; if fewer than 10,
//   the 10 most recently shown groups. A new colour re-triggers the group.
// - "Top selling": top 10 groups by pairs sold in the last 30 days.
//
// Cost price, vendor, internal labels, descriptions and invoices never leave
// this file.

const FootwearModel = require("../models/footwear");
const InvoiceModel = require("../models/invoice");
const cfg = require("../../utils/website_config");

const DAY_MS = 24 * 60 * 60 * 1000;
// Card id = "<group id>--<colour>". slugify never makes "--", so it splits cleanly.
const COLOUR_SEP = "--";

// Fields read from the database. Anything not listed here can't leak.
const SAFE_PROJECTION = {
  _id: 0,
  footwear_id: 1,
  brand: 1,
  article: 1,
  category: 1,
  color: 1,
  mrp: 1,
  selling_price: 1,
  website_price: 1,
  pairs_in_stock: 1,
  size_range: 1,
  size_description: 1,
  group_key: 1,
  website_media: 1,
  tags: 1,
  website_first_shown_at: 1,
  createdAt: 1,
  updatedAt: 1,
};

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function groupIdOf(product) {
  return slugify(product.group_key) || slugify(product.footwear_id);
}

function priceOf(product) {
  const wp = Number(product.website_price);
  if (Number.isFinite(wp) && wp > 0) return wp;
  return Number(product.selling_price) || 0;
}

function timeOf(value) {
  const t = value ? new Date(value).getTime() : NaN;
  return Number.isFinite(t) ? t : 0;
}

// The owner marks each size range S, M or L (small, medium, large). Kids and
// adult ranges can share numbers (kids 8-10 vs adult 7-10), so this mark sets
// the order, not the numbers.
const SIZE_TIER = { S: 0, M: 1, L: 2 };
function sizeTier(product) {
  const tier = SIZE_TIER[String(product.size_description || "").trim().toUpperCase()];
  return tier === undefined ? 1 : tier;
}

function firstSizeNumber(product) {
  const first = (product.pairs_in_stock || [])[0];
  const n = first ? parseFloat(first.size) : NaN;
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER;
}

function titleCase(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function buildColour(colourProducts) {
  // Order size ranges S, M, L; within the same mark, by first size (6-7 before 8-10).
  const products = [...colourProducts].sort(
    (a, b) => sizeTier(a) - sizeTier(b) || firstSizeNumber(a) - firstSizeNumber(b)
  );
  const sizes = new Map(); // size -> entry, in display order

  for (const product of products) {
    const price = priceOf(product);
    const mrp = Number(product.mrp) || null;
    // Combine both stores: a size is in stock if any store has it.
    const perSize = new Map();
    for (const pair of product.pairs_in_stock || []) {
      const size = String(pair.size).trim();
      if (!size) continue;
      const qty = Number(pair.quantity) || 0;
      perSize.set(size, (perSize.get(size) || 0) + Math.max(qty, 0));
    }
    for (const [size, qty] of perSize) {
      const candidate = { size, in_stock: qty > 0, price, mrp, sku: product.footwear_id };
      const existing = sizes.get(size);
      // Two size ranges overlap on a size: prefer the one in stock, then the cheaper one.
      if (
        !existing ||
        (candidate.in_stock && !existing.in_stock) ||
        (candidate.in_stock === existing.in_stock && candidate.price < existing.price)
      ) {
        sizes.set(size, candidate);
      }
    }
  }

  const sizeList = [...sizes.values()];
  const inStockSizes = sizeList.filter((s) => s.in_stock);
  const priced = inStockSizes.length ? inStockSizes : sizeList;
  const prices = priced.map((s) => s.price).filter((p) => p > 0);
  const mrps = priced.map((s) => s.mrp).filter((m) => m > 0);

  const media = [];
  const seen = new Set();
  for (const product of products) {
    for (const item of product.website_media || []) {
      if (!item || !item.url || seen.has(item.url)) continue;
      seen.add(item.url);
      media.push({ type: item.type === "video" ? "video" : "image", url: item.url });
    }
  }

  const shownTimes = products.map((p) => timeOf(p.website_first_shown_at) || timeOf(p.createdAt)).filter(Boolean);

  return {
    color: titleCase(products[0].color) || "Default",
    media,
    sizes: sizeList,
    in_stock: inStockSizes.length > 0,
    price_min: prices.length ? Math.min(...prices) : null,
    price_max: prices.length ? Math.max(...prices) : null,
    mrp_max: mrps.length ? Math.max(...mrps) : null,
    // A colour counts as "shown" from when its first product went live.
    _first_shown: shownTimes.length ? Math.min(...shownTimes) : 0,
    _created: Math.max(0, ...products.map((p) => timeOf(p.createdAt))),
  };
}

/**
 * Pure function: turns product documents into website groups.
 * `salesByProductId` maps footwear_id -> pairs sold in the top-selling window.
 */
function buildCatalog(products, salesByProductId = {}, now = Date.now()) {
  const byGroup = new Map();
  for (const product of products) {
    const id = groupIdOf(product);
    if (!id) continue;
    if (!byGroup.has(id)) byGroup.set(id, []);
    byGroup.get(id).push(product);
  }

  const groups = [];
  for (const [id, groupProducts] of byGroup) {
    const byColour = new Map();
    for (const p of groupProducts) {
      const key = String(p.color || "").trim().toLowerCase() || "default";
      if (!byColour.has(key)) byColour.set(key, []);
      byColour.get(key).push(p);
    }
    const colours = [...byColour.values()].map(buildColour);
    for (const c of colours) c.id = `${id}${COLOUR_SEP}${slugify(c.color) || "default"}`;
    // In-stock colours first, then the order they were added.
    colours.sort((a, b) => Number(b.in_stock) - Number(a.in_stock) || a._first_shown - b._first_shown);

    // Name and category come from the most recently edited product.
    const latest = [...groupProducts].sort((a, b) => timeOf(b.updatedAt) - timeOf(a.updatedAt))[0];

    const tagSeen = new Set();
    const tags = [];
    for (const p of groupProducts) {
      for (const tag of p.tags || []) {
        const k = String(tag).toLowerCase();
        if (!tagSeen.has(k)) {
          tagSeen.add(k);
          tags.push(tag);
        }
      }
    }

    const live = colours.filter((c) => c.in_stock);
    const priced = live.length ? live : colours;
    const mins = priced.map((c) => c.price_min).filter((v) => v != null);
    const maxs = priced.map((c) => c.price_max).filter((v) => v != null);
    const mrps = priced.map((c) => c.mrp_max).filter((v) => v != null);

    groups.push({
      id,
      name: [latest.brand, latest.article].filter(Boolean).join(" ").trim() || "Footwear",
      brand: latest.brand || "",
      article: latest.article || "",
      category: latest.category || "",
      tags,
      in_stock: live.length > 0,
      price_min: mins.length ? Math.min(...mins) : null,
      price_max: maxs.length ? Math.max(...maxs) : null,
      mrp_max: mrps.length ? Math.max(...mrps) : null,
      colors: colours,
      // Latest time a colour of this group went live (a new colour counts as new).
      _shown_at: Math.max(0, ...colours.map((c) => c._first_shown)),
      _created: Math.max(0, ...colours.map((c) => c._created)),
      _sold: groupProducts.reduce((n, p) => n + (salesByProductId[p.footwear_id] || 0), 0),
    });
  }

  applyAutoTags(groups, now);
  return groups;
}

function applyAutoTags(groups, now) {
  const { NEW_ARRIVAL, TOP_SELLING } = cfg.AUTO_TAGS;

  // New arrival: last 30 days, but never fewer than 10 (most recent first).
  const byNewest = [...groups].sort((a, b) => b._shown_at - a._shown_at || b._created - a._created);
  const cutoff = now - cfg.NEW_ARRIVAL_DAYS * DAY_MS;
  let newArrivals = byNewest.filter((g) => g._shown_at >= cutoff);
  if (newArrivals.length < cfg.NEW_ARRIVAL_MIN_COUNT) {
    newArrivals = byNewest.slice(0, cfg.NEW_ARRIVAL_MIN_COUNT);
  }
  const newIds = new Set(newArrivals.map((g) => g.id));

  // Top selling: top 10 groups that actually sold in the window.
  const topIds = new Set(
    groups
      .filter((g) => g._sold > 0)
      .sort((a, b) => b._sold - a._sold || b._shown_at - a._shown_at)
      .slice(0, cfg.TOP_SELLING_COUNT)
      .map((g) => g.id)
  );

  for (const g of groups) {
    // Manual tags must not duplicate the automatic ones.
    g.tags = g.tags.filter((t) => ![NEW_ARRIVAL, TOP_SELLING].some((a) => a.toLowerCase() === String(t).toLowerCase()));
    const auto = [];
    if (newIds.has(g.id)) auto.push(NEW_ARRIVAL);
    if (topIds.has(g.id)) auto.push(TOP_SELLING);
    g.tags = [...auto, ...g.tags];
    g.is_new_arrival = newIds.has(g.id);
    g.is_top_selling = topIds.has(g.id);
  }
}

const SORTS = {
  // Default: newest on the website first.
  featured: (a, b) => b._shown_at - a._shown_at || b._created - a._created,
  newest: (a, b) => b._shown_at - a._shown_at || b._created - a._created,
  price_asc: (a, b) => (a.price_min ?? Infinity) - (b.price_min ?? Infinity),
  price_desc: (a, b) => (b.price_max ?? -Infinity) - (a.price_max ?? -Infinity),
  top_selling: (a, b) => b._sold - a._sold || b._shown_at - a._shown_at,
};

/** Filters, sorts and paginates groups. Out-of-stock groups always go last. */
function queryCatalog(groups, query = {}) {
  let list = groups;
  const eq = (a, b) => String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();

  if (query.category) list = list.filter((g) => eq(g.category, query.category));
  if (query.tag) list = list.filter((g) => g.tags.some((t) => eq(t, query.tag)));
  if (query.size) {
    list = list.filter((g) => g.colors.some((c) => c.sizes.some((s) => s.in_stock && eq(s.size, query.size))));
  }
  if (query.q) {
    const words = String(query.q).toLowerCase().split(/\s+/).filter(Boolean).slice(0, 6);
    list = list.filter((g) => {
      const hay = [g.name, g.category, ...g.tags, ...g.colors.map((c) => c.color)].join(" ").toLowerCase();
      return words.every((w) => hay.includes(w));
    });
  }
  if (query.min_price) list = list.filter((g) => g.price_max == null || g.price_max >= Number(query.min_price));
  if (query.max_price) list = list.filter((g) => g.price_min == null || g.price_min <= Number(query.max_price));

  const sorter = SORTS[query.sort] || SORTS.featured;
  list = [...list].sort((a, b) => Number(b.in_stock) - Number(a.in_stock) || sorter(a, b));

  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 24, 1), 60);
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const total = list.length;
  const items = list.slice((page - 1) * limit, page * limit);
  return { total, page, limit, pages: Math.max(Math.ceil(total / limit), 1), items };
}

/**
 * One list entry per colour of each group. Each entry has the shape of a group
 * whose `colors` holds only that colour, so filters and sorting work per colour.
 * A colour that went live recently sorts as new on its own.
 */
function colourCards(groups) {
  const cards = [];
  for (const g of groups) {
    for (const c of g.colors) {
      cards.push({
        ...g,
        id: c.id,
        group_id: g.id,
        in_stock: c.in_stock,
        price_min: c.price_min,
        price_max: c.price_max,
        mrp_max: c.mrp_max,
        colors: [c],
        _group: g,
        _shown_at: c._first_shown,
        _created: c._created,
      });
    }
  }
  return cards;
}

/** Finds the group for a card id ("group--colour") or a plain group id. */
function findProduct(groups, rawId) {
  const id = String(rawId || "").toLowerCase();
  const groupId = id.split(COLOUR_SEP)[0];
  const group = groups.find((g) => g.id === groupId);
  if (!group) return null;
  const colour = group.colors.find((c) => c.id === id) || group.colors[0];
  return { group, selected_color: colour.id };
}

// Public shapes: strip internal fields.
function publicColour({ _first_shown, _created, ...c }) {
  return c;
}
function toDetail(group) {
  const { _shown_at, _created, _sold, _group, ...pub } = group;
  return { ...pub, colors: pub.colors.map(publicColour) };
}
function toCard(card) {
  const { _shown_at, _created, _sold, _group, ...pub } = card;
  const selected = card.colors[0];
  const all = _group ? _group.colors : card.colors;
  const swatch = (c) => ({
    id: c.id,
    color: c.color,
    image: (c.media.find((m) => m.type === "image") || {}).url || null,
    in_stock: c.in_stock,
  });
  // This card's colour first, then the group's other colours.
  return { ...pub, colors: [selected, ...all.filter((c) => c.id !== selected.id)].map(swatch) };
}

// ---- Loading (with a short in-memory cache) ----
const CACHE_MS = 60 * 1000;
let cache = { at: 0, groups: null, cards: null };

async function loadSalesByProductId(productIds, now) {
  if (!productIds.length) return {};
  const since = new Date(now - cfg.TOP_SELLING_DAYS * DAY_MS);
  const rows = await InvoiceModel.aggregate([
    {
      $match: {
        invoice_date: { $gte: since },
        invoice_status: { $ne: "RETURNED" },
        product_id: { $in: productIds },
      },
    },
    { $group: { _id: "$product_id", pairs: { $sum: 1 } } },
  ]);
  const map = {};
  for (const r of rows) map[r._id] = r.pairs;
  return map;
}

async function getCatalog({ fresh = false } = {}) {
  const now = Date.now();
  if (!fresh && cache.groups && now - cache.at < CACHE_MS) return cache.groups;
  const products = await FootwearModel.find({ show_on_website: true }, SAFE_PROJECTION).lean();
  const sales = await loadSalesByProductId(products.map((p) => p.footwear_id).filter(Boolean), now);
  const groups = buildCatalog(products, sales, now);
  cache = { at: now, groups, cards: colourCards(groups) };
  return groups;
}

/** Cached list entries, one per colour. */
async function getCards(options) {
  await getCatalog(options);
  return cache.cards;
}

function clearCatalogCache() {
  cache = { at: 0, groups: null, cards: null };
}

function filtersFrom(groups) {
  const categories = new Map();
  const tags = new Map();
  const sizes = new Map();
  for (const g of groups) {
    if (g.category) categories.set(g.category.toLowerCase(), g.category);
    for (const t of g.tags) tags.set(t.toLowerCase(), t);
    for (const c of g.colors) for (const s of c.sizes) if (s.in_stock) sizes.set(s.size, s.size);
  }
  const byText = (a, b) => a.localeCompare(b);
  const bySize = (a, b) => (parseFloat(a) || 0) - (parseFloat(b) || 0) || a.localeCompare(b);
  const prices = groups.flatMap((g) => [g.price_min, g.price_max]).filter((p) => p != null);
  return {
    categories: [...categories.values()].sort(byText),
    tags: [...tags.values()].sort(byText),
    sizes: [...sizes.values()].sort(bySize),
    price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null,
  };
}

module.exports = {
  buildCatalog,
  queryCatalog,
  toCard,
  toDetail,
  getCatalog,
  getCards,
  colourCards,
  findProduct,
  clearCatalogCache,
  filtersFrom,
  slugify,
  priceOf,
  SAFE_PROJECTION,
};
