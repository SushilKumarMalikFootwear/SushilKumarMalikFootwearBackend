const express = require("express");
const router = express.Router();
const { add, fetchInvoices, update } = require("../../controller/invoice");
const { FETCH_INVOICES, SAVE_INVOICE, UPDATE_INVOICE } =
  require("../../utils/config").ROUTES.INVOICE;
router.post(SAVE_INVOICE, add);
router.post(UPDATE_INVOICE, update);
router.post(FETCH_INVOICES, fetchInvoices);
module.exports = router;
