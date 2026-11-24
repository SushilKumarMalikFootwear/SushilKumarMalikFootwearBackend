const { Schema, SchemaTypes } = require("../connect");
const mongoose = require("../connect");
const { ORDER_STATUSES } = require("../../utils/website_config");

// An order placed on the customer website. Placing an order does NOT change
// stock; stock only changes when the owner creates the invoice in the app.
const orderItemSchema = new Schema(
  {
    footwear_id: { type: SchemaTypes.String, required: true },
    group_id: { type: SchemaTypes.String },
    name: { type: SchemaTypes.String },
    color: { type: SchemaTypes.String },
    size: { type: SchemaTypes.String, required: true },
    quantity: { type: SchemaTypes.Number, required: true, min: 1 },
    price: { type: SchemaTypes.Number, required: true }, // per pair, at order time
    mrp: { type: SchemaTypes.Number },
    image: { type: SchemaTypes.String },
  },
  { _id: false }
);

const statusChangeSchema = new Schema(
  {
    status: { type: SchemaTypes.String, enum: ORDER_STATUSES },
    at: { type: SchemaTypes.Date, default: Date.now },
    by: { type: SchemaTypes.String }, // admin email
    note: { type: SchemaTypes.String },
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    order_no: { type: SchemaTypes.String, required: true, unique: true },
    status: { type: SchemaTypes.String, enum: ORDER_STATUSES, default: "NEW" },
    customer: {
      name: { type: SchemaTypes.String, required: true },
      phone: { type: SchemaTypes.String, required: true },
      email: { type: SchemaTypes.String },
    },
    address: {
      line1: { type: SchemaTypes.String, required: true },
      line2: { type: SchemaTypes.String },
      landmark: { type: SchemaTypes.String },
      city: { type: SchemaTypes.String, required: true },
      pincode: { type: SchemaTypes.String, required: true },
    },
    note: { type: SchemaTypes.String },
    items: { type: [orderItemSchema], required: true },
    total: { type: SchemaTypes.Number, required: true },
    // Set when a logged-in customer places the order.
    user_id: { type: SchemaTypes.ObjectId, ref: "website_user" },
    status_history: { type: [statusChangeSchema], default: [] },
  },
  { timestamps: true }
);
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ user_id: 1, createdAt: -1 });
orderSchema.index({ "customer.phone": 1 });

module.exports = mongoose.model("website_order", orderSchema);
