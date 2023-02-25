const express = require('express');
const router = express.Router();
const {order_product,view_one_order,view_orders,change_order_status} = require('../../controller/orders');
const {ORDER_PRODUCT,VIEW_ONE_ORDER,VIEW_ORDERS,CHANGE_ORDER_STATUS} = require('../../utils/config').ROUTES.ORDERS;
router.post(ORDER_PRODUCT,order_product);
router.post(VIEW_ONE_ORDER,view_one_order);
router.post(VIEW_ORDERS,view_orders);
router.post(CHANGE_ORDER_STATUS,change_order_status);
module.exports = router;