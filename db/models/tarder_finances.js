const { Schema, SchemaTypes } = require("../connect");
const { TRADER_FINANCES } = require("../../utils/config").SCHEMAS;
const mongoose = require("../connect");

const traderSchema = new Schema({
  trader_name: { type: SchemaTypes.String },
  total_cost_price: { type: SchemaTypes.Number },
  cost_price_of_sold: { type: SchemaTypes.Number },
  selling_price_of_sold: { type: SchemaTypes.Number },
  opening_balance: { type: SchemaTypes.Number }, //running pending payment at the ledger cutoff
  ledger_cutoff: { type: SchemaTypes.Date }, //date of the last locked log; new logs can't be dated before it
});
const TraderFinancesModel = mongoose.model(TRADER_FINANCES, traderSchema);
module.exports = TraderFinancesModel;
