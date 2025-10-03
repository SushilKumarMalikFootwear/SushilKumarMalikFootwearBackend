const InvoiceModel = require("../models/invoice");
const productOperations = require("./product_crud");
const traderFinancesOperation = require("./trader_finances");
module.exports = {
  async save_invoice(invoice) {
    invoice.invoice_no = await this.getNextInvoiceNumber(invoice.invoice_date);
    if (invoice.product_id) {
      let product = await productOperations.view_by_product_id(invoice.product_id);
      product = product[0];
      let sold_at = invoice.sold_at;
      console.log(product);
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
      console.log("updating quantity");
      await productOperations.update_product(invoice.product_id, product);
    }
    if (invoice.add_in_total_cost == true) {
      console.log("updating total cost");
      invoice.add_in_total_cost == true;
      await traderFinancesOperation.updateTotalCostPrice(
        invoice.vendor,
        invoice.cost_price
      );
    }
    await traderFinancesOperation.updateCostPriceOfSold(
      invoice.vendor,
      invoice.cost_price
    );
    await traderFinancesOperation.updateSellingPriceOfSold(
      invoice.vendor,
      invoice.selling_price
    );

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
  compareDates(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);

    // Check if the dates are valid
    if (isNaN(d1) || isNaN(d2)) {
      return 0;
    }

    // Extract day, month, and year
    const day1 = d1.getDate();
    const month1 = d1.getMonth(); // Months are zero-based in JavaScript
    const year1 = d1.getFullYear();

    const day2 = d2.getDate();
    const month2 = d2.getMonth();
    const year2 = d2.getFullYear();

    // Compare day, month, and year
    if (day1 === day2 && month1 === month2 && year1 === year2) {
      return 0;
    } else {
      return 1;
    }
  },
  async fetchInvoices(filters) {
    const filterMap = filters || {};

    const article = filterMap.article || "";
    const size = filterMap.size || "";
    const color = filterMap.color || "";
    const date = filterMap.date || "";
    const soldAt = filterMap.soldAt || "";
    const paymentPending = filterMap.paymentPending === 'true';
    const returnedInvoice = filterMap.returnedInvoice === 'true';

    // normalize date range inputs
    const selectedDateRangeStartDate = filterMap.selectedDateRangeStartDate
      ? new Date(filterMap.selectedDateRangeStartDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // default: 30 days ago

    const selectedDateRangeEndDate = filterMap.selectedDateRangeEndDate
      ? new Date(filterMap.selectedDateRangeEndDate)
      : new Date(Date.now() + 24 * 60 * 60 * 1000); // default: tomorrow

    // parse single date filter if provided
    let dateFilter = null;
    if (date) {
      try {
        dateFilter = new Date(date);
      } catch (err) {
        dateFilter = null;
      }
    }

    // Build pipeline
    const pipeline = [];

    if (dateFilter) {
      pipeline.push({
        $match: {
          invoice_date: {
            $gte: dateFilter,
            $lt: new Date(dateFilter.getTime() + 24 * 60 * 60 * 1000), // next day
          },
        },
      });
    } else {
      pipeline.push({
        $match: {
          invoice_date: {
            $gte: selectedDateRangeStartDate,
            $lt: selectedDateRangeEndDate,
          },
        },
      });
    }

    if (article) {
      pipeline.push({
        $match: { article: { $regex: article, $options: "i" } },
      });
    }

    if (color) {
      pipeline.push({
        $match: { color: { $regex: color, $options: "i" } },
      });
    }

    if (size) {
      pipeline.push({
        $match: { size: parseInt(size) },
      });
    }

    if (soldAt) {
      pipeline.push({
        $match: { sold_at: soldAt },
      });
    }

    if (paymentPending) {
      pipeline.push({
        $match: { payment_status: "PENDING" },
      });
    }
    if (returnedInvoice) {
      pipeline.push({
        $match: { invoice_status: "RETURNED" },
      });
    }

    pipeline.push({ $sort: { invoice_date: -1 } });

    // Run aggregation
    const invoices = await InvoiceModel.aggregate(pipeline);
    return invoices;
  },

  async updateInvoice(invoice) {
    let oldInvoice = await InvoiceModel.findOne({
      invoice_no: invoice.invoice_no,
    });
    console.log("old invoice - ", oldInvoice);
    console.log("received invoice - ", invoice);
    let product = await productOperations.view_by_product_id(invoice.product_id);
    product = product[0];
    if (oldInvoice.add_in_total_cost && !invoice.add_in_total_cost) {
      await traderFinancesOperation.updateTotalCostPrice(
        invoice.vendor,
        -invoice.cost_price
      );
    }
    if (!oldInvoice.add_in_total_cost && invoice.add_in_total_cost) {
      await traderFinancesOperation.updateTotalCostPrice(
        invoice.vendor,
        invoice.cost_price
      );
    }
    if (this.compareDates(invoice.invoice_date, oldInvoice.invoice_date) != 0) {
      invoice.invoice_no = await this.getNextInvoiceNumber(
        invoice.invoice_date
      );
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
            oldInvoice.color +
            " : " +
            oldInvoice.size
          );
        }
        if (pair.available_at == invoice.sold_at && pair.size == invoice.size) {
          pair.quantity--;
          console.log(
            "edit : reducing quantity of " +
            invoice.article +
            " : " +
            invoice.color +
            " : " +
            invoice.size
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
      await traderFinancesOperation.updateCostPriceOfSold(
        invoice.vendor,
        invoice.cost_price - oldInvoice.cost_price
      );
      await traderFinancesOperation.updateSellingPriceOfSold(
        invoice.vendor,
        invoice.selling_price - oldInvoice.selling_price
      );
    }
    if (
      invoice.invoice_status == "RETURNED" &&
      oldInvoice.invoice_status == "COMPLETED"
    ) {
      await traderFinancesOperation.updateCostPriceOfSold(
        invoice.vendor,
        -invoice.cost_price
      );
      await traderFinancesOperation.updateSellingPriceOfSold(
        invoice.vendor,
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
            invoice.color +
            " : " +
            invoice.size
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
      await traderFinancesOperation.updateCostPriceOfSold(
        invoice.vendor,
        invoice.cost_price
      );
      await traderFinancesOperation.updateSellingPriceOfSold(
        invoice.vendor,
        invoice.selling_price
      );
      for (let i = 0; i < product["pairs_in_stock"].length; i++) {
        let pair = product["pairs_in_stock"][i];
        if (pair.available_at == invoice.sold_at && pair.size == invoice.size) {
          pair.quantity++;
          console.log(
            "return - completed again : reducing quantity of " +
            invoice.article +
            " : " +
            invoice.color +
            " : " +
            invoice.size
          );
        }
      }
      console.log(
        "invoice no - ",
        invoice.invoice_no,
        " was returned and is completed again"
      );
      console.log("saving invoice - ", invoice);
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
          sold_at: invoice.sold_at,
          vendor: invoice.vendor,
          add_in_total_cost: invoice.add_in_total_cost,
          pending_amount: invoice.pending_amount
        },
      }
    );
    return invoice;
  },
  async getMonthlySalesReport() {
    let salesData = await InvoiceModel.aggregate([
      {
        $match: {
          invoice_status: "COMPLETED",
        },
      },
      {
        $group: {
          _id: {
            month: {
              $dateToString: { format: "%Y-%m", date: "$invoice_date" },
            },
            place: "$sold_at",
            day: {
              $dateToString: { format: "%Y-%m-%d", date: "$invoice_date" },
            }, // Extract unique day
          },
          totalSP: { $sum: "$selling_price" },
          totalProfit: { $sum: "$profit" },
          totalInvoices: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: { month: "$_id.month", place: "$_id.place" },
          totalSP: { $sum: "$totalSP" },
          totalProfit: { $sum: "$totalProfit" },
          totalInvoices: { $sum: "$totalInvoices" },
          uniqueDays: { $addToSet: "$_id.day" }, // Collect unique days in a set
        },
      },
      {
        $addFields: {
          numDays: { $size: "$uniqueDays" }, // Count unique days
          dailyAvgSales: {
            $round: [
              {
                $cond: {
                  if: { $gt: [{ $size: "$uniqueDays" }, 0] },
                  then: { $divide: ["$totalSP", { $size: "$uniqueDays" }] },
                  else: 0,
                },
              },
              0, // Round to nearest integer
            ],
          },
          dailyAvgInvoices: {
            $round: [
              {
                $cond: {
                  if: { $gt: [{ $size: "$uniqueDays" }, 0] },
                  then: {
                    $divide: ["$totalInvoices", { $size: "$uniqueDays" }],
                  },
                  else: 0,
                },
              },
              0, // Round to nearest integer
            ],
          },
        },
      },
      {
        $group: {
          _id: "$_id.month",
          sales: {
            $push: {
              place: "$_id.place",
              totalSP: "$totalSP",
              totalProfit: "$totalProfit",
              totalInvoices: "$totalInvoices",
              numDays: "$numDays",
              dailyAvgSales: "$dailyAvgSales",
              dailyAvgInvoices: "$dailyAvgInvoices",
            },
          },
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month
      },
    ]);

    console.log(salesData);
    return salesData;
  },
};
