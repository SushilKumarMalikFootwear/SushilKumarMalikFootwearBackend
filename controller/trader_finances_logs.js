const { SUCCESS, SERVER_CRASH, NOT_FOUND } = require('../utils/config').STATUS_CODES;
const messageBundle = require('../locales/en');
const TraderFinancesLogsOperations = require("../db/services/trader_finances_logs");

const traderFinancesLogsController = {

  /**
   * 🧾 Get all pending bills (where pending_amount > 0)
   */
  async getPendingBills(request, response) {
    try {
      const result = await TraderFinancesLogsOperations.getPendingBills();

      if (result && result.length > 0) {
        response.status(SUCCESS).json(result);
      } else {
        response.status(NOT_FOUND).json({ message: messageBundle['unsuccessful'] });
      }

    } catch (error) {
      console.error("❌ Error in getPendingBills controller:", error);
      response.status(SERVER_CRASH).json({
        message: messageBundle['server.crash'],
        error: error.message,
      });
    }
  },


  /**
   * 💾 Save trader finance log (PURCHASE / PAYMENT entry)
   */
  async saveTraderFinanceLog(request, response) {
    try {
      const payload = request.body;
      const savedLog = await TraderFinancesLogsOperations.saveTraderFinanceLog(payload);

      if (savedLog) {
        response.status(SUCCESS).json(savedLog);
      } else {
        response.status(NOT_FOUND).json({ message: messageBundle['unsuccessful'] });
      }

    } catch (error) {
      console.error("❌ Error in saveTraderFinanceLog controller:", error);
      response.status(SERVER_CRASH).json({
        message: messageBundle['server.crash'],
        error: error.message,
      });
    }
  },


  /**
   * 📉 Decrease pending amount by log ID
   */
  async decreasePendingAmountById(request, response) {
    try {
      const { id, amount } = request.body;
      const updatedDoc = await TraderFinancesLogsOperations.decreasePendingAmountById(id, amount);

      if (updatedDoc) {
        response.status(SUCCESS).json(updatedDoc);
      } else {
        response.status(NOT_FOUND).json({ message: messageBundle['unsuccessful'] });
      }

    } catch (error) {
      console.error("❌ Error in decreasePendingAmountById controller:", error);
      response.status(SERVER_CRASH).json({
        message: messageBundle['server.crash'],
        error: error.message,
      });
    }
  },


  /**
   * 🔁 Get last running pending payment for a trader
   */
  async getLastRunningPendingPayment(request, response) {
    try {
      const { trader_name } = request.query;
      const result = await TraderFinancesLogsOperations.getLastRunningPendingPayment(trader_name);

      if (result) {
        response.status(SUCCESS).json(result);
      } else {
        response.status(NOT_FOUND).json({ message: messageBundle['unsuccessful'] });
      }

    } catch (error) {
      console.error("❌ Error in getLastRunningPendingPayment controller:", error);
      response.status(SERVER_CRASH).json({
        message: messageBundle['server.crash'],
        error: error.message,
      });
    }
  },


  /**
   * 📅 Get filtered trader finance logs (filter by trader, type, date range)
   */
  async getFilteredTraderFinanceLogs(request, response) {
    try {
      const filterMap = request.body;
      const logs = await TraderFinancesLogsOperations.getFilteredTraderFinanceLogs(filterMap);

      if (logs && logs.length > 0) {
        response.status(SUCCESS).json(logs);
      } else {
        response.status(NOT_FOUND).json({ message: messageBundle['unsuccessful'] });
      }

    } catch (error) {
      console.error("❌ Error in getFilteredTraderFinanceLogs controller:", error);
      response.status(SERVER_CRASH).json({
        message: messageBundle['server.crash'],
        error: error.message,
      });
    }
  },


  /**
   * 💰 Get trader-wise pending payments
   */
  async getTraderWisePendingPayments(request, response) {
    try {
      const result = await TraderFinancesLogsOperations.getTraderWisePendingPayments();

      if (result && Object.keys(result).length > 0) {
        response.status(SUCCESS).json(result);
      } else {
        response.status(NOT_FOUND).json({ message: messageBundle['unsuccessful'] });
      }

    } catch (error) {
      console.error("❌ Error in getTraderWisePendingPayments controller:", error);
      response.status(SERVER_CRASH).json({
        message: messageBundle['server.crash'],
        error: error.message,
      });
    }
  },
};

module.exports = traderFinancesLogsController;
