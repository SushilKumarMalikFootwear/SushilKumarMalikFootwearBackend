const { SUCCESS, SERVER_CRASH, NOT_FOUND, BAD_REQUEST } = require('../utils/config').STATUS_CODES;
const messageBundle = require('../locales/en');
const TraderFinancesLogsOperations = require("../db/services/trader_finances_logs");

function sendError(response, name, error) {
  if (error instanceof TraderFinancesLogsOperations.LedgerError) {
    response.status(BAD_REQUEST).json({ message: error.message });
    return;
  }
  console.error(`❌ Error in ${name} controller:`, error);
  response.status(SERVER_CRASH).json({
    message: messageBundle['server.crash'],
    error: error.message,
  });
}

const traderFinancesLogsController = {

  /**
   * 💾 Create a log (PURCHASE / PAYMENT / CLAIM). Balances are recalculated on the server.
   */
  async createLog(request, response) {
    try {
      const logs = await TraderFinancesLogsOperations.createLog(request.body);
      response.status(SUCCESS).json({ success: true, logs });
    } catch (error) {
      sendError(response, 'createLog', error);
    }
  },


  /**
   * ✏️ Update a log
   */
  async updateLog(request, response) {
    try {
      const log = await TraderFinancesLogsOperations.updateLog(request.body);
      response.status(SUCCESS).json({ success: true, log });
    } catch (error) {
      sendError(response, 'updateLog', error);
    }
  },


  /**
   * 🗑️ Delete a log
   */
  async deleteLog(request, response) {
    try {
      await TraderFinancesLogsOperations.deleteLog(request.body._id);
      response.status(SUCCESS).json({ success: true });
    } catch (error) {
      sendError(response, 'deleteLog', error);
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
      sendError(response, 'getFilteredTraderFinanceLogs', error);
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
      sendError(response, 'getTraderWisePendingPayments', error);
    }
  },
};

module.exports = traderFinancesLogsController;
