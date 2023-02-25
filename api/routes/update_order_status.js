const express = require('express');
const router = express.Router();
const {update_order_status} = require('../../controller/orders');
const {UPDATE_ORDER_STATUS} = require('../../utils/config').ROUTES.ORDERS;
router.post(UPDATE_ORDER_STATUS,update_order_status);
module.exports = router;