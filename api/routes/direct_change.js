const express = require('express');
const router = express.Router();
const {direct_change} = require('../../controller/product');
const {DIRECT_CHANGE} = require('../../utils/config').ROUTES;
router.get(DIRECT_CHANGE,direct_change);
module.exports = router;