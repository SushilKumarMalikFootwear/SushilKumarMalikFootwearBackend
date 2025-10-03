const express = require('express');
const router = express.Router();
const {add,apply_changes,delete_product, update_product} = require('../../controller/product');
const {addFootwear,applyChanges,UPDATE_PRODUCT,DELETE_PRODUCT} = require('../../utils/config').ROUTES.PRODUCT;
router.post(addFootwear,add);
router.get(applyChanges,apply_changes);
router.post(UPDATE_PRODUCT,update_product);
router.get(DELETE_PRODUCT,delete_product);
module.exports = router;