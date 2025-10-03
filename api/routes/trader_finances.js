const express = require("express");
const router = express.Router();
const { getTraderFinances,updateTotalCostPrice } = require("../../controller/trader_finances");
const { GET_TRADER_FINANCES, UPDATE_TOTAL_COST_PRICE } = require("../../utils/config").ROUTES.TRADER_FINANCES;
router.get(GET_TRADER_FINANCES, getTraderFinances);
router.post(UPDATE_TOTAL_COST_PRICE, updateTotalCostPrice);
module.exports = router;
