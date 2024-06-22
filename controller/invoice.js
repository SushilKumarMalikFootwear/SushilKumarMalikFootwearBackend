const { SUCCESS, SERVER_CRASH, NOT_FOUND } =
  require("../utils/config").STATUS_CODES;
const messageBundle = require("../locales/en");
const invoiceOperations = require("../db/services/invoice_crud");
const invoiceController = {
  add(request, response) {
    let isOldInvoice = request.query.isOldInvoice;
    let addInTotalCost = request.query.addInTotalCost;
    let invoiceObject = request.body;
    let promise = invoiceOperations.save_invoice(
      invoiceObject,
      isOldInvoice,
      addInTotalCost
    );
    promise
      .then((doc) => {
        response
          .status(SUCCESS)
          .json({ message: messageBundle["successful"], doc: doc });
      })
      .catch((err) => {
        response.status(SERVER_CRASH).json({
          message: messageBundle["unsuccessful"],
          ERROR: err.toString(),
        });
      });
  },
  fetchInvoices(request, response) {
    let promise = invoiceOperations.fetchInvoices();
    promise
      .then((doc) => {
        response
          .status(SUCCESS)
          .json({ message: messageBundle["successful"], doc: doc });
      })
      .catch((err) => {
        response.status(SERVER_CRASH).json({
          message: messageBundle["unsuccessful"],
          ERROR: err.toString(),
        });
      });
  },
};
module.exports = invoiceController;
