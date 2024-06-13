const express = require('express');
const router = express.Router();
const {view_all_products, filter_footwears,view_by_product_id} = require('../../controller/product');
const {VIEW_ALL_FOOTWEARS,FILTER_FOOTWEARS,VIEW_BY_FOOTWEAR_ID,} = require('../../utils/config').ROUTES.PRODUCT;
router.post(FILTER_FOOTWEARS,filter_footwears)
router.get(VIEW_ALL_FOOTWEARS,view_all_products);
router.get(VIEW_BY_FOOTWEAR_ID,view_by_product_id);
module.exports = router;