const mongoose = require("../connect");
const TraderFinanesLogs = require("../models/trader_finances_logs");
const TraderFinances = require("../models/tarder_finances");

const TYPES = ["PURCHASE", "PAYMENT", "CLAIM"];
const PAYMENT_MODES = ["UPI", "CASH"];
const LEDGER_TYPES = ["PURCHASE", "PAYMENT"];

class LedgerError extends Error {}

const round = (value) => Math.round(value * 100) / 100;

// App sends local wall-clock time without an offset; it is stored as-is (read as UTC), same as before.
function parseDate(value) {
    if (typeof value !== "string" || value.trim() === "") return null;
    const hasOffset = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value.trim());
    const date = new Date(hasOffset ? value : `${value}Z`);
    return isNaN(date.getTime()) ? null : date;
}

function formatDay(date) {
    return date.toISOString().slice(0, 10);
}

/**
 * Pure ledger calculation for one trader.
 * openingBills: locked purchases still unpaid at the cutoff, oldest first: [{ id, pending }]
 * entries: unlocked PURCHASE/PAYMENT logs sorted by date then _id: [{ _id, id, type, amount }]
 * Payments pay the oldest unpaid bills first; any extra is kept as credit for later purchases.
 */
function computeLedger(openingBalance, openingBills, entries) {
    let balance = round(openingBalance || 0);
    let credit = balance < 0 ? -balance : 0;
    const queue = openingBills.map((bill) => ({ id: bill.id, left: round(bill.pending) }));
    const results = new Map();

    for (const entry of entries) {
        const amount = round(entry.amount);
        if (entry.type === "PURCHASE") {
            balance = round(balance + amount);
            const used = Math.min(credit, amount);
            credit = round(credit - used);
            queue.push({ id: entry.id, left: round(amount - used) });
            results.set(String(entry._id), { running_pending_payment: balance });
        } else {
            balance = round(balance - amount);
            let toAllocate = amount;
            const allocations = [];
            for (const bill of queue) {
                if (toAllocate <= 0) break;
                if (bill.left <= 0) continue;
                const paid = Math.min(bill.left, toAllocate);
                bill.left = round(bill.left - paid);
                toAllocate = round(toAllocate - paid);
                allocations.push({ bill_id: bill.id, amount: paid });
            }
            credit = round(credit + toAllocate);
            results.set(String(entry._id), { running_pending_payment: balance, allocations });
        }
    }

    const pendingByBill = new Map(queue.map((bill) => [bill.id, bill.left]));
    return { balance, results, pendingByBill };
}

async function recomputeTrader(traderName, session) {
    const trader = await TraderFinances.findOne({ trader_name: traderName }).session(session);
    const openingBills = await TraderFinanesLogs.find({
        trader_name: traderName,
        locked: true,
        type: "PURCHASE",
        opening_pending: { $gt: 0 },
    }).sort({ date: 1, _id: 1 }).session(session).lean();
    const entries = await TraderFinanesLogs.find({
        trader_name: traderName,
        locked: { $ne: true },
        type: { $in: LEDGER_TYPES },
    }).sort({ date: 1, _id: 1 }).session(session).lean();

    const { results, pendingByBill } = computeLedger(
        trader?.opening_balance || 0,
        openingBills.map((bill) => ({ id: bill.id, pending: bill.opening_pending })),
        entries
    );

    const ops = openingBills.map((bill) => ({
        updateOne: { filter: { _id: bill._id }, update: { $set: { pending_amount: pendingByBill.get(bill.id) } } },
    }));
    for (const entry of entries) {
        const set = { ...results.get(String(entry._id)) };
        if (entry.type === "PURCHASE") set.pending_amount = pendingByBill.get(entry.id);
        ops.push({ updateOne: { filter: { _id: entry._id }, update: { $set: set } } });
    }
    if (ops.length) await TraderFinanesLogs.bulkWrite(ops, { session });
}

async function getTrader(traderName, session) {
    const trader = await TraderFinances.findOne({ trader_name: traderName }).session(session);
    if (!trader) throw new LedgerError(`Unknown trader: ${traderName}`);
    // Traders with history need an opening balance (set by the ledger migration) before recalculating
    if (typeof trader.opening_balance !== "number") {
        const hasLogs = await TraderFinanesLogs.exists({ trader_name: traderName }).session(session);
        if (hasLogs) throw new LedgerError(`Ledger for ${traderName} isn't set up yet`);
    }
    return trader;
}

function validateInput(input) {
    const type = input.type;
    if (!TYPES.includes(type)) throw new LedgerError("Type must be PURCHASE, PAYMENT or CLAIM");
    const amount = Number(input.amount);
    if (!Number.isFinite(amount) || amount <= 0) throw new LedgerError("Enter an amount greater than 0");
    const date = parseDate(input.date);
    if (!date) throw new LedgerError("Enter a valid date");
    if (typeof input.trader_name !== "string" || input.trader_name.trim() === "") {
        throw new LedgerError("Select a trader");
    }
    const fields = {
        type,
        amount: round(amount),
        date,
        trader_name: input.trader_name.trim(),
        description: (input.description || "").trim(),
    };
    if (type === "PAYMENT") {
        if (!PAYMENT_MODES.includes(input.payment_mode)) throw new LedgerError("Select a payment mode");
        fields.payment_mode = input.payment_mode;
    }
    return fields;
}

function checkCutoff(trader, fields) {
    if (!LEDGER_TYPES.includes(fields.type) || !trader.ledger_cutoff) return;
    if (fields.date < trader.ledger_cutoff) {
        throw new LedgerError(
            `Date can't be before ${formatDay(trader.ledger_cutoff)} for ${trader.trader_name}: older entries are locked`
        );
    }
}

function costContribution(log) {
    return log && log.type === "PURCHASE" ? log.amount : 0;
}

async function addTotalCost(traderName, amount, session) {
    if (!amount) return;
    await TraderFinances.updateOne({ trader_name: traderName }, { $inc: { total_cost_price: amount } }, { session });
}

function logId(timestamp, traderName, type) {
    return `${timestamp}_${traderName}_${type}`;
}

async function inTransaction(work) {
    const session = await mongoose.startSession();
    try {
        let result;
        await session.withTransaction(async () => {
            result = await work(session);
        });
        return result;
    } finally {
        await session.endSession();
    }
}

module.exports = {
    LedgerError,
    computeLedger,
    parseDate,

    /**
     * Create a log. A PURCHASE with mark_as_paid also creates its PAYMENT.
     */
    async createLog(input) {
        const fields = validateInput(input);
        return inTransaction(async (session) => {
            const trader = await getTrader(fields.trader_name, session);
            checkCutoff(trader, fields);
            const timestamp = Date.now();
            const docs = [{ ...fields, id: logId(timestamp, fields.trader_name, fields.type) }];
            if (fields.type === "PURCHASE" && input.mark_as_paid) {
                if (!PAYMENT_MODES.includes(input.payment_mode)) throw new LedgerError("Select a payment mode");
                docs.push({
                    type: "PAYMENT",
                    amount: fields.amount,
                    date: fields.date,
                    trader_name: fields.trader_name,
                    description: "",
                    payment_mode: input.payment_mode,
                    id: logId(timestamp + 1, fields.trader_name, "PAYMENT"),
                });
            }
            const created = [];
            for (const doc of docs) {
                const [saved] = await TraderFinanesLogs.create([doc], { session });
                created.push(saved);
            }
            await addTotalCost(fields.trader_name, costContribution(fields), session);
            await recomputeTrader(fields.trader_name, session);
            return TraderFinanesLogs.find({ _id: { $in: created.map((doc) => doc._id) } }).session(session).lean();
        });
    },

    /**
     * Update a log. Locked logs only allow the description to change.
     */
    async updateLog(input) {
        return inTransaction(async (session) => {
            const old = await TraderFinanesLogs.findById(input._id).session(session);
            if (!old) throw new LedgerError("Entry not found");

            if (old.locked) {
                await TraderFinanesLogs.updateOne(
                    { _id: old._id },
                    { $set: { description: (input.description || "").trim() } },
                    { session }
                );
                return TraderFinanesLogs.findById(old._id).session(session).lean();
            }

            const fields = validateInput(input);
            const trader = await getTrader(fields.trader_name, session);
            checkCutoff(trader, fields);

            const set = { ...fields };
            if (fields.type !== old.type || fields.trader_name !== old.trader_name) {
                set.id = logId(old.id.split("_")[0], fields.trader_name, fields.type);
            }
            const unset = {};
            if (fields.type !== "PAYMENT") Object.assign(unset, { payment_mode: "", allocations: "" });
            if (fields.type !== "PURCHASE") unset.pending_amount = "";
            if (fields.type === "CLAIM") unset.running_pending_payment = "";
            const update = Object.keys(unset).length ? { $set: set, $unset: unset } : { $set: set };
            await TraderFinanesLogs.updateOne({ _id: old._id }, update, { session });

            await addTotalCost(old.trader_name, -costContribution(old), session);
            await addTotalCost(fields.trader_name, costContribution(fields), session);
            await recomputeTrader(fields.trader_name, session);
            if (old.trader_name !== fields.trader_name) await recomputeTrader(old.trader_name, session);
            return TraderFinanesLogs.findById(old._id).session(session).lean();
        });
    },

    async deleteLog(id) {
        return inTransaction(async (session) => {
            const old = await TraderFinanesLogs.findById(id).session(session);
            if (!old) throw new LedgerError("Entry not found");
            if (old.locked) throw new LedgerError("This entry is locked and can't be deleted");
            await TraderFinanesLogs.deleteOne({ _id: old._id }, { session });
            await addTotalCost(old.trader_name, -costContribution(old), session);
            await recomputeTrader(old.trader_name, session);
            return { deleted: true };
        });
    },

    async getFilteredTraderFinanceLogs(filterMap) {
        try {
            const filter = {};
            const { trader_name, type, fromDate, toDate } = filterMap;

            if (trader_name && trader_name.trim() !== "") {
                filter.trader_name = trader_name;
            }

            if (type && type.trim() !== "") {
                filter.type = type;
            }

            if (fromDate || toDate) {
                filter.date = {};

                if (fromDate) {
                    filter.date.$gte = new Date(fromDate);
                }
                if (toDate) {
                    filter.date.$lte = new Date(toDate);
                }
            }

            const logs = await TraderFinanesLogs.find(filter)
                .sort({ date: -1, _id: -1 });
            return logs;
        } catch (error) {
            console.error("Error fetching trader finance logs:", error);
            throw error;
        }
    },
    async getTraderWisePendingPayments() {
        try {
            const result = await TraderFinanesLogs.aggregate([
                {
                    $match: {
                        type: "PURCHASE",
                        pending_amount: { $gt: 0 },
                    },
                },
                {
                    $group: {
                        _id: "$trader_name",
                        totalPending: { $sum: "$pending_amount" },
                    },
                },
            ]);

            const traderPendingMap = {};
            result.forEach((doc) => {
                traderPendingMap[doc._id] = Math.round(doc.totalPending);
            });

            return traderPendingMap;
        } catch (error) {
            console.error("Error fetching trader-wise pending payments:", error);
            throw error;
        }
    }
};
