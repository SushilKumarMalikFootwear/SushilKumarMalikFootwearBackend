const { Schema, SchemaTypes } = require("../connect");
const { FOOTWEAR } = require("../../utils/config").SCHEMAS;
const mongoose = require("../connect");
const footwear_pair_schema = new Schema({
  size: { type: SchemaTypes.String },
  available_at: { type: SchemaTypes.String },
  quantity: { type: SchemaTypes.Number },
});
const footwearSchema = new Schema(
  {
    out_of_stock: {type: SchemaTypes.Boolean},
    footwear_id: { type: SchemaTypes.String },
    brand: { type: SchemaTypes.String },
    sub_brand: { type: SchemaTypes.String },
    article: { type: SchemaTypes.String },
    mrp: { type: SchemaTypes.Number },
    selling_price: { type: SchemaTypes.Number },
    cost_price: { type: SchemaTypes.Number },
    category: { type: SchemaTypes.String },
    color: { type: SchemaTypes.String },
    pairs_in_stock: {type:[footwear_pair_schema]},
    size_range: { type: SchemaTypes.String },
    description:{type:SchemaTypes.String},
    vendor: { type: SchemaTypes.String },
    images:{type:SchemaTypes.Array}
  },
  {
    timestamps: true, //this will add time in data object when the  is created in database
  }
);
const FootwearModel = mongoose.model(FOOTWEAR, footwearSchema);
module.exports = FootwearModel;
