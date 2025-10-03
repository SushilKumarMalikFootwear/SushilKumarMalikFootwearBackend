const { SUCCESS, SERVER_CRASH, NOT_FOUND } = require('../utils/config').STATUS_CODES;
const messageBundle = require('../locales/en');
const TraderFinancesOperations = require("../db/services/trader_finances");
const configListsController = {
    async getTraderFinances(request, response) {
        let traderFinances = await TraderFinancesOperations.getTraderFinances();
        if (traderFinances) {
            response.status(SUCCESS).json(traderFinances);
        }
        else {
            response.status(NOT_FOUND).json({ message: messageBundle['unsuccessful'] });
        }
    },
    async updateTotalCostPrice(request, response) {
        let traderName = request.body.traderName;
        let costPrice = request.body.costPrice;
        let update = await TraderFinancesOperations.updateTotalCostPrice(traderName, costPrice);
        if (update.modifiedCount == 1) {
            response.status(SUCCESS).json({ 'status': true });
        }
        else {
            response.status(NOT_FOUND).json({ message: messageBundle['unsuccessful'] });
        }
    },
}
module.exports = configListsController;