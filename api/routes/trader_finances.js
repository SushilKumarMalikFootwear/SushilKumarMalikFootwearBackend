const express = require("express");
const router = express.Router();
const { getTraderFinances } = require("../../controller/trader_finances");
const { GET_TRADER_FINANCES } = require("../../utils/config").ROUTES.TRADER_FINANCES;
router.get(GET_TRADER_FINANCES, getTraderFinances);
module.exports = router;
