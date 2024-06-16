const { Schema, SchemaTypes } = require("../connect");
const { TRADER_FINANCES } = require("../../utils/config").SCHEMAS;
const mongoose = require("../connect");

const traderSchema = new Schema({
  trader_name: { type: SchemaTypes.String },
  total_cost_price: { type: SchemaTypes.Number },
  cost_price_of_sold: { type: SchemaTypes.Number },
  selling_price_of_sold: { type: SchemaTypes.Number },
});
const TraderFinancesModel = mongoose.model(TRADER_FINANCES, traderSchema);
module.exports = TraderFinancesModel;