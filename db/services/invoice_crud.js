const InvoiceModel = require("../models/invoice");
const productOperations = require("./product_crud");
const traderFinancesOperation = require("./trader_finances");
module.exports = {
  async save_invoice(invoice, isOldInvoice) {
    invoice.invoice_no = await this.getNextInvoiceNumber(invoice.invoice_date);
    if (invoice.product_id) {
      let product = await productOperations.view_by_id(invoice.product_id);
      let sold_at = invoice.sold_at;
      let size = invoice.size;
      for (let i = 0; i < product["pairs_in_stock"].length; i++) {
        let pair = product["pairs_in_stock"][i];
        if (pair.available_at == sold_at && pair.size == size) {
          pair.quantity--;
          console.log(
            "reducing quantity of " + invoice.article + " : " + invoice.color
          );
        }
      }
      if (isOldInvoice!="true") {
        console.log("updating quantity");
        await productOperations.update_product(invoice.product_id, product);
      }
      await traderFinancesOperation.updateFinancesByTraderName(
        product.vendor,
        invoice.cost_price,
        invoice.selling_price
      );
    } else {
      await traderFinancesOperation.updateFinancesByTraderName2(
        product.vendor,
        invoice.cost_price,
        invoice.selling_price
      );
    }
    let promise = InvoiceModel.create(invoice);
    promise.then((val) => {
      console.log("invoice created " + invoice.invoice_no);
    });
    return promise;
  },
  async getNextInvoiceNumber(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const count = await InvoiceModel.countDocuments({
      invoice_date: { $gte: startOfDay, $lte: endOfDay },
    });
    const datePart =
      String(startOfDay.getDate()).padStart(2, "0") +
      String(startOfDay.getMonth() + 1).padStart(2, "0") +
      startOfDay.getFullYear();
    const countPart = String(count + 1).padStart(3, "0");
    const invoiceNumber = `${datePart}${countPart}`;
    return invoiceNumber;
  },
  fetchInvoices() {
    let promise = InvoiceModel.find();
    return promise;
  },
};
