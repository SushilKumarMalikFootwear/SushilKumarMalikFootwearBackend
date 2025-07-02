const { Schema, SchemaTypes } = require("../connect");
const { TRADER_FINANCES_LOGS } = require("../../utils/config").SCHEMAS;
const mongoose = require("../connect");

const traderFinancesLogsSchema = new Schema({
    id:    { type: SchemaTypes.String },
    description:    { type: SchemaTypes.String },
    date: { type: SchemaTypes.Date },
    type:{ type: SchemaTypes.String }, //PURCHASE, PAYMENT, CLAIM
  trader_name: { type: SchemaTypes.String },
  bill_ids : { type: SchemaTypes.Array }, //in case of PAYMENT
  payment_mode : {type: SchemaTypes.String}, //in case of PAYMENT
  running_pending_payment: {type : SchemaTypes.Number}, 
  pending_amount: { type: SchemaTypes.Number },
  amount: { type: SchemaTypes.Number },
});
const TraderFinancesLogsModel = mongoose.model(TRADER_FINANCES_LOGS, traderFinancesLogsSchema);
module.exports = TraderFinancesLogsModel;