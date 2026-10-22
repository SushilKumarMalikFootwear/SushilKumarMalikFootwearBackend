const { SUCCESS, SERVER_CRASH, NOT_FOUND } =
  require("../utils/config").STATUS_CODES;
const messageBundle = require("../locales/en");
const invoiceOperations = require("../db/services/invoice_crud");
const salesInsights = require("../db/services/sales_insights");
const BAD_REQUEST = 400;
const invoiceController = {
  add(request, response) {
    let invoiceObject = request.body;
    let promise = invoiceOperations.save_invoice(
      invoiceObject
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
  monthlySalesReport(request, response) {
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
  },
  async getInvoicesForSizesSalesReport(req, res) {
    try {
      const article = req.body.article;
      const startDate = req.body.startDate;
      const endDate = req.body.endDate;
      const label = req.body.label;
      const data = await invoiceOperations.getInvoicesForSizesSalesReport(article, startDate, endDate, label);
      if (Object.keys(data).length > 0) {
        res.status(SUCCESS).json(data);
      } else {
        res.status(NOT_FOUND).json({ message: messageBundle["unsuccessful"] });
      }
    } catch (error) {
      console.error("Error in getInvoicesForSizesSalesReport controller:", error);
      res.status(SERVER_CRASH).json({
        message: messageBundle["server.crash"],
        error: error.message,
      });
    }
  },
  async getRolling12MonthComparison(req, res) {
    try {
      const result =
        await invoiceOperations.getRolling12MonthComparison();

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        message: "Server crash",
        error: error.message,
      });
    }
  },
    async getCurrentMonthMTDComparison(req, res) {
    try {
      const result =
        await invoiceOperations.getCurrentMonthMTDComparison();

      if (result) {
        return res.status(SUCCESS).json(result);
      }

      return res
        .status(NOT_FOUND)
        .json({ message: messageBundle["unsuccessful"] });

    } catch (error) {
      console.error("Controller error:", error);
      return res.status(SERVER_CRASH).json({
        message: messageBundle["server.crash"],
        error: error.message,
      });
    }
  },
  async getSalesInsights(req, res) {
    try {
      const { startDate, endDate, soldAt = "ALL", growthPct, forceGrowth, adjustByPace, limit } = req.body;
      const ymd = /^\d{4}-\d{2}-\d{2}$/;
      if (!ymd.test(startDate || "") || !ymd.test(endDate || "") || startDate > endDate) {
        return res.status(BAD_REQUEST).json({ message: "startDate and endDate must be YYYY-MM-DD and startDate <= endDate" });
      }
      if (!["ALL", "SHOP", "HOME"].includes(soldAt)) {
        return res.status(BAD_REQUEST).json({ message: "soldAt must be ALL, SHOP or HOME" });
      }
      const result = await salesInsights.getSalesInsights({
        startDate,
        endDate,
        soldAt,
        growthPct,
        forceGrowth: forceGrowth === true,
        adjustByPace: adjustByPace === true,
        limit: Number(limit) > 0 ? Number(limit) : 10,
      });
      return res.status(SUCCESS).json(result);
    } catch (error) {
      console.error("Error in getSalesInsights controller:", error);
      return res.status(SERVER_CRASH).json({
        message: messageBundle["unsuccessful"],
        error: error.message,
      });
    }
  },

};
module.exports = invoiceController;
