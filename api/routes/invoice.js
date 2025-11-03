const express = require("express");
const router = express.Router();
const { add, fetchInvoices, update, monthlySalesReport, getInvoicesForSizesSalesReport } = require("../../controller/invoice");
const { FETCH_INVOICES, SAVE_INVOICE, UPDATE_INVOICE, MONTHLY_SALES_REPORT, FETCH_SIZES_SALES_REPORT } =
  require("../../utils/config").ROUTES.INVOICE;
router.post(SAVE_INVOICE, add);
router.post(UPDATE_INVOICE, update);
router.post(FETCH_INVOICES, fetchInvoices);
router.get(MONTHLY_SALES_REPORT, monthlySalesReport);
router.post(FETCH_SIZES_SALES_REPORT, getInvoicesForSizesSalesReport);
module.exports = router;
