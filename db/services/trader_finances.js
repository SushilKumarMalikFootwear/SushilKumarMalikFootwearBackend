const TraderFinances = require("../models/tarder_finances");
module.exports = {
  async updateFinancesByTraderName(traderName, costPrice, sellingPrice) {
    let update = TraderFinances.updateOne(
      { trader_name: traderName },
      {
        $inc: {
          cost_price_of_sold: costPrice,
          selling_price_of_sold: sellingPrice,
        },
      }
    );
    return update;
  },
  async updateFinancesByTraderName2(traderName, costPrice, sellingPrice) {
    let update = TraderFinances.updateOne(
      { trader_name: traderName },
      {
        $inc: {
          total_cost_price: costPrice,
          cost_price_of_sold: costPrice,
          selling_price_of_sold: sellingPrice,
        },
      }
    );
    return update;
  },
};
