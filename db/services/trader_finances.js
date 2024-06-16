const TraderFinances = require("../models/tarder_finances");
module.exports = {
  async updateFinancesByTraderName(traderName, costPrice, sellingPrice) {
    let update = TraderFinances.updateOne({ trader_name: traderName }, {
        $inc:{
            cost_price_of_sold : costPrice,
            selling_price_of_sold : sellingPrice
        }
    });
    return update;
  },
};
