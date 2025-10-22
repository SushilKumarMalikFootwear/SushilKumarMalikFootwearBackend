const TraderFinanesLogs = require("../models/trader_finances_logs");
module.exports = {
    async getPendingBills() {
        let bills = await TraderFinanesLogs.find({
            "type": "PURCHASE",
            "pending_amount": { "$ne": 0 }
        });
        return bills;
    },
    async saveTraderFinanceLog(doc) {
        let res = await TraderFinanesLogs.create(doc);
        return res
    },
    async decreasePendingAmountById(id, newPendingAmount) {
        let update = await TraderFinanesLogs.updateOne({ id: id }, {
            $set: {
                "pending_amount": newPendingAmount,

            }
        });
        console.log(update)
        return update;
    },
    async getLastRunningPendingPayment(traderName) {
        let doc = await TraderFinanesLogs.find({
            trader_name: traderName,
            "type": { "$in": ["PURCHASE", "PAYMENT"] },
        }).sort({ date: -1 }).limit(1);
        return doc[0].running_pending_payment;
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

                const toUtcDate = (dateStr) => {
                    const [datePart, timePart] = dateStr.split(' ');
                    return new Date(`${datePart}T${timePart}`);
                };

                if (fromDate) {
                    filter.date.$gte = new Date(fromDate);
                }
                if (toDate) {
                    filter.date.$lte = new Date(toDate);
                }
            }

            const logs = await TraderFinanesLogs.find(filter)
                .sort({ date: -1 });
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