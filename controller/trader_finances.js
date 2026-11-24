const { SUCCESS, NOT_FOUND } = require('../utils/config').STATUS_CODES;
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
}
module.exports = configListsController;