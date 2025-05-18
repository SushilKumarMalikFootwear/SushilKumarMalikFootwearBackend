const { Schema, SchemaTypes } = require("../connect");
const { TRADER_FINANCES_LOGS } = require("../../utils/config").SCHEMAS;
const mongoose = require("../connect");

const traderFinancesLogsSchema = new Schema({
    id:    { type: SchemaTypes.String },
    date: { type: SchemaTypes.Date },
    type:{ type: SchemaTypes.String }, //PURCHASE, PAYMENT, CLAIM
  trader_name: { type: SchemaTypes.String },
  pending_amount: { type: SchemaTypes.Number },
  amount: { type: SchemaTypes.Number },
  selling_price_of_sold: { type: SchemaTypes.Number },
});
const TraderFinancesLogsModel = mongoose.model(TRADER_FINANCES_LOGS, traderFinancesLogsSchema);
module.exports = TraderFinancesLogsModel;