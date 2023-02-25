const express = require('express');
const router = express.Router();
const {payements} = require('../../controller/payments');
const {PAY} = require('../../utils/config').ROUTES.PAYMENTS;
router.get(PAY,payements);
module.exports = router;