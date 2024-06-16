const express = require("express");
const router = express.Router();
const { add, fetchInvoices } = require("../../controller/invoice");
const {FETCH_INVOICES, SAVE_INVOICE} =
  require("../../utils/config").ROUTES.INVOICE;
router.post(SAVE_INVOICE, add);
router.post(FETCH_INVOICES, fetchInvoices);
module.exports = router;
