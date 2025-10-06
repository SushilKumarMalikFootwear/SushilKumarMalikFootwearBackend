const express = require("express");
const router = express.Router();
const {
    getPendingBills,
    saveTraderFinanceLog,
    decreasePendingAmountById,
    getLastRunningPendingPayment,
    getFilteredTraderFinanceLogs,
    getTraderWisePendingPayments,
} = require("../../controller/trader_finances_logs");

const {
    GET_PENDING_BILLS,
    SAVE_TRADER_FINANCE_LOG,
    DECREASE_PENDING_AMOUNT,
    GET_LAST_RUNNING_PENDING_PAYMENT,
    GET_FILTERED_TRADER_FINANCE_LOGS,
    GET_TRADER_WISE_PENDING_PAYMENTS,
} = require("../../utils/config").ROUTES.TRADER_FINANCES_LOGS;
router.get(GET_PENDING_BILLS, getPendingBills);
router.post(SAVE_TRADER_FINANCE_LOG, saveTraderFinanceLog);
router.post(DECREASE_PENDING_AMOUNT, decreasePendingAmountById);
router.get(GET_LAST_RUNNING_PENDING_PAYMENT, getLastRunningPendingPayment);
router.post(GET_FILTERED_TRADER_FINANCE_LOGS, getFilteredTraderFinanceLogs);
router.get(GET_TRADER_WISE_PENDING_PAYMENTS, getTraderWisePendingPayments);

module.exports = router;
