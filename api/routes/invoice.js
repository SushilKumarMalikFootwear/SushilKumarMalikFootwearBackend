const express = require('express');
const router = express.Router();
const {add} = require('../../controller/invoice');
const {saveInvoice} = require('../../utils/config').ROUTES.INVOICE;
router.post(saveInvoice,add);
module.exports = router;