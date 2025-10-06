// const TraderFinanesLogs = require("../models/trader_finances_logs");
// module.exports = {
//   async getTraderFinances(){
//     let traderFinances = await TraderFinances.find();
//     return traderFinances;
//   },
//   async updateCostPriceOfSold(traderName, costPrice) {
//     let update = TraderFinances.updateOne(
//       { trader_name: traderName },
//       {
//         $inc: {
//           cost_price_of_sold: costPrice,
//         },
//       }
//     );
//     return update;
//   },
//   async updateSellingPriceOfSold(traderName, sellingPrice) {
//     let update = TraderFinances.updateOne(
//       { trader_name: traderName },
//       {
//         $inc: {
//           selling_price_of_sold: sellingPrice,
//         },
//       }
//     );
//     return update;
//   },
//   async updateTotalCostPrice(traderName, costPrice) {
//     let update = TraderFinances.updateOne(
//       { trader_name: traderName },
//       {
//         $inc: {
//           total_cost_price: costPrice,
//         },
//       }
//     );
//     return update;
//   },
// };