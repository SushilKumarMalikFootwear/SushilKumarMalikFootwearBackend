const express = require("express");
const router = express.Router();
const {
    createLog,
    updateLog,
    deleteLog,
    getFilteredTraderFinanceLogs,
    getTraderWisePendingPayments,
} = require("../../controller/trader_finances_logs");

const {
    CREATE_LOG,
    UPDATE_LOG,
    DELETE_LOG,
    GET_FILTERED_TRADER_FINANCE_LOGS,
    GET_TRADER_WISE_PENDING_PAYMENTS,
} = require("../../utils/config").ROUTES.TRADER_FINANCES_LOGS;
router.post(CREATE_LOG, createLog);
router.post(UPDATE_LOG, updateLog);
router.post(DELETE_LOG, deleteLog);
router.post(GET_FILTERED_TRADER_FINANCE_LOGS, getFilteredTraderFinanceLogs);
router.get(GET_TRADER_WISE_PENDING_PAYMENTS, getTraderWisePendingPayments);

module.exports = router;
