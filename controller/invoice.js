const { SUCCESS, SERVER_CRASH, NOT_FOUND } =
  require("../utils/config").STATUS_CODES;
const messageBundle = require("../locales/en");
const invoiceOperations = require("../db/services/invoice_crud");
const invoiceController = {
  add(request, response) {
    let isOldInvoice = request.query.isOldInvoice.toString();
    let invoiceObject = request.body;
    let promise = invoiceOperations.save_invoice(
      invoiceObject,
      isOldInvoice
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
    let promise = invoiceOperations.fetchInvoices(request.body);
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
  update(request, response) {
    let invoiceObject = request.body;
    let promise = invoiceOperations.updateInvoice(
      invoiceObject
    );
    promise
      .then((doc) => {
        response
          .status(SUCCESS)
          .json({ message: messageBundle['update.successful'], doc: doc });
      })
      .catch((err) => {
        response.status(SERVER_CRASH).json({
          message: messageBundle["update.unsuccessful"],
          ERROR: err.toString(),
        });
      });
  },
  monthlySalesReport(request, response){
    let promise = invoiceOperations.getMonthlySalesReport();
    promise
      .then((doc) => {
        response
          .status(SUCCESS)
          .json({ message: messageBundle['successful'], doc: doc });
      })
      .catch((err) => {
        response.status(SERVER_CRASH).json({
          message: messageBundle["unsuccessful"],
          ERROR: err.toString(),
        });
      });
  }
};
module.exports = invoiceController;
