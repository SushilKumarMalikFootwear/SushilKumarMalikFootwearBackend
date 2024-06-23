const InvoiceModel = require("../models/invoice");
const productOperations = require("./product_crud");
const traderFinancesOperation = require("./trader_finances");
module.exports = {
  async save_invoice(invoice, isOldInvoice, addInTotalCost) {
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
      if (isOldInvoice != "true") {
        console.log("updating quantity");
        await productOperations.update_product(invoice.product_id, product);
      }
      await traderFinancesOperation.updateFinancesByTraderName(
        product.vendor,
        invoice.cost_price,
        invoice.selling_price
      );
    }
    if (!invoice.product_id || addInTotalCost) {
      await traderFinancesOperation.updateFinancesByTraderName2(
        invoice.vendor,
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
  async updateInvoice(invoice) {
    let oldInvoice = await InvoiceModel.findOne({
      invoice_no: invoice.invoice_no,
    });
    console.log("old invoice - ", oldInvoice);
    console.log("new invoice - ", invoice);
    let product = await productOperations.view_by_id(invoice.product_id);
    if (invoice.invoice_date != oldInvoice.invoice_date) {
      invoice.invoice_no = getNextInvoiceNumber(invoice.invoice_date);
      console.log(
        "updating invoice no, old invoice no - ",
        oldInvoice.invoice_no,
        " new invoice no - ",
        invoice.invoice_no
      );
    }
    if (
      (invoice.size != oldInvoice.size ||
        invoice.sold_at != oldInvoice.sold_at) &&
      invoice.product_id
    ) {
      for (let i = 0; i < product["pairs_in_stock"].length; i++) {
        let pair = product["pairs_in_stock"][i];
        if (
          pair.available_at == oldInvoice.sold_at &&
          pair.size == oldInvoice.size
        ) {
          pair.quantity++;
          console.log(
            "edit : increasing quantity of " +
              oldInvoice.article +
              " : " +
              oldInvoice.color
          );
        }
        if (pair.available_at == invoice.sold_at && pair.size == invoice.size) {
          pair.quantity--;
          console.log(
            "edit : reducing quantity of " +
              invoice.article +
              " : " +
              invoice.color
          );
        }
      }
      await productOperations.update_product(invoice.product_id, product);
    }
    if (
      invoice.cost_price != oldInvoice.cost_price ||
      invoice.selling_price != oldInvoice.selling_price
    ) {
      console.log(
        "updating old invoice cost price - ",
        oldInvoice.cost_price,
        " new cost price - ",
        invoice.cost_price,
        " old selling price - ",
        oldInvoice.selling_price,
        " new selling price - ",
        invoice.selling_price,
        " old profit - ",
        oldInvoice.profit,
        " new profit - ",
        invoice.profit
      );
      await traderFinancesOperation.updateFinancesByTraderName(
        invoice.vendor,
        invoice.cost_price - oldInvoice.cost_price,
        invoice.selling_price - oldInvoice.selling_price
      );
    }
    if (
      invoice.invoice_status == "RETURNED" &&
      oldInvoice.invoice_status == "COMPLETED"
    ) {
      await traderFinancesOperation.updateFinancesByTraderName(
        invoice.vendor,
        -invoice.cost_price,
        -invoice.selling_price
      );
      for (let i = 0; i < product["pairs_in_stock"].length; i++) {
        let pair = product["pairs_in_stock"][i];
        if (pair.available_at == invoice.sold_at && pair.size == invoice.size) {
          pair.quantity++;
          console.log(
            "return : increasing quantity of " +
              invoice.article +
              " : " +
              invoice.color
          );
        }
      }
      console.log("invoice no - ", invoice.invoice_no, " is returned");
      await productOperations.update_product(invoice.product_id, product);
    }
    if (
      invoice.invoice_status == "COMPLETED" &&
      oldInvoice.invoice_status == "RETURNED"
    ) {
      await traderFinancesOperation.updateFinancesByTraderName(
        invoice.vendor,
        invoice.cost_price,
        invoice.selling_price
      );
      for (let i = 0; i < product["pairs_in_stock"].length; i++) {
        let pair = product["pairs_in_stock"][i];
        if (pair.available_at == invoice.sold_at && pair.size == invoice.size) {
          pair.quantity++;
          console.log(
            "return - completed again : increasing quantity of " +
              invoice.article +
              " : " +
              invoice.color
          );
        }
      }
      console.log(
        "invoice no - ",
        invoice.invoice_no,
        " was returned and is completed again"
      );

      await productOperations.update_product(invoice.product_id, product);
    }
    await InvoiceModel.updateOne(
      { invoice_no: oldInvoice.invoice_no },
      {
        $set: {
          article: invoice.article,
          color: invoice.color,
          cost_price: invoice.cost_price,
          description: invoice.description,
          invoice_date: invoice.invoice_date,
          invoice_no: invoice.invoice_no,
          invoice_status: invoice.invoice_status,
          mrp: invoice.mrp,
          payment_mode: invoice.payment_mode,
          payment_status: invoice.payment_status,
          product_id: invoice.product_id,
          profit: invoice.profit,
          selling_price: invoice.selling_price,
          size: invoice.size,
          sold_at: invoice.solt_at,
          vendor: invoice.vendor,
        },
      }
    );
  },
};
