const { Schema, SchemaTypes } = require("../connect");
const { TRADER_FINANCES_LOGS } = require("../../utils/config").SCHEMAS;
const mongoose = require("../connect");

const allocationSchema = new Schema(
  {
    bill_id: { type: SchemaTypes.String },
    amount: { type: SchemaTypes.Number },
  },
  { _id: false }
);

const traderFinancesLogsSchema = new Schema({
  id: { type: SchemaTypes.String },
  description: { type: SchemaTypes.String },
  date: { type: SchemaTypes.Date },
  type: { type: SchemaTypes.String }, //PURCHASE, PAYMENT, CLAIM
  trader_name: { type: SchemaTypes.String },
  bill_ids: { type: SchemaTypes.Array }, //legacy, only on locked PAYMENT entries
  allocations: { type: [allocationSchema], default: undefined }, //PAYMENT: bills paid, oldest first
  payment_mode: { type: SchemaTypes.String }, //in case of PAYMENT
  running_pending_payment: { type: SchemaTypes.Number },
  pending_amount: { type: SchemaTypes.Number },
  amount: { type: SchemaTypes.Number },
  locked: { type: SchemaTypes.Boolean }, //entries from before the ledger cutoff, read-only except description
  opening_pending: { type: SchemaTypes.Number }, //locked PURCHASE: amount still unpaid at the cutoff
});
const TraderFinancesLogsModel = mongoose.model(TRADER_FINANCES_LOGS, traderFinancesLogsSchema);
module.exports = TraderFinancesLogsModel;
