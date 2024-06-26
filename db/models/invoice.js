const { Schema, SchemaTypes } = require("../connect");
const { INVOICE } = require("../../utils/config").SCHEMAS;
const mongoose = require("../connect");

const invoiceSchema = new Schema(
  {
    invoice_no: { type: SchemaTypes.String },
    invoice_date: { type: SchemaTypes.Date },
    product_id: { type: SchemaTypes.String },
    vendor: { type: SchemaTypes.String },
    article: { type: SchemaTypes.String },
    cost_price: { type: SchemaTypes.Number },
    mrp: { type: SchemaTypes.Number },
    selling_price: { type: SchemaTypes.Number },
    profit: { type: SchemaTypes.Number },
    description: { type: SchemaTypes.String },
    size: { type: SchemaTypes.Number },
    color: { type: SchemaTypes.String },
    add_in_total_cost: { type: SchemaTypes.Boolean },
    sold_at: { type: SchemaTypes.String }, //HOME or SHOP
    payment_mode: { type: SchemaTypes.String }, // CASH/UPI
    payment_status: { type: SchemaTypes.String }, //PENDING/PAID
    invoice_status: { type: SchemaTypes.String }, //completed / returned
  },
  {
    timestamps: true,
  }
);
const InvoiceModel = mongoose.model(INVOICE, invoiceSchema);
module.exports = InvoiceModel;
