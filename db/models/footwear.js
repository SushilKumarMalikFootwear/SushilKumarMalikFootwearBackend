const { Schema, SchemaTypes } = require("../connect");
const { FOOTWEAR } = require("../../utils/config").SCHEMAS;
const mongoose = require("../connect");
const footwear_pair_schema = new Schema({
  size: { type: SchemaTypes.String },
  available_at: { type: SchemaTypes.String },
  quantity: { type: SchemaTypes.Number },
});
// One photo or video shown on the customer website.
const website_media_schema = new Schema(
  {
    type: { type: SchemaTypes.String, enum: ["image", "video"], default: "image" },
    url: { type: SchemaTypes.String, required: true },
  },
  { _id: false }
);
const footwearSchema = new Schema(
  {
    out_of_stock: { type: SchemaTypes.Boolean },
    footwear_id: { type: SchemaTypes.String },
    brand: { type: SchemaTypes.String },
    article: { type: SchemaTypes.String },
    mrp: { type: SchemaTypes.Number },
    selling_price: { type: SchemaTypes.Number },
    cost_price: { type: SchemaTypes.Number },
    category: { type: SchemaTypes.String },
    label: { type: SchemaTypes.Array },
    rating: { type: SchemaTypes.Number },
    color: { type: SchemaTypes.String },
    pairs_in_stock: { type: [footwear_pair_schema] },
    size_range: { type: SchemaTypes.String },
    description: { type: SchemaTypes.String },
    vendor: { type: SchemaTypes.String },
    images: { type: SchemaTypes.Array },
    newImages: { type: SchemaTypes.Array },
    updated: { type: SchemaTypes.Boolean },
    size_description: { type: SchemaTypes.String },

    // ---- Customer website ----
    // Only products with this switched on are visible on the website.
    show_on_website: { type: SchemaTypes.Boolean, default: false },
    // Products sharing a group key appear as ONE product on the website
    // (different colours become colour options, different size ranges of
    // the same colour are merged into one size list).
    group_key: { type: SchemaTypes.String, trim: true },
    // Price on the website. When empty, selling_price is used.
    website_price: { type: SchemaTypes.Number },
    // Photos (and later videos) for the website, separate from internal images.
    website_media: { type: [website_media_schema], default: undefined },
    // Customer-facing tags, e.g. "Super soft". Separate from internal `label`.
    tags: { type: [SchemaTypes.String], default: undefined },
    // Set by the server the first time show_on_website is switched on, and
    // never changed afterwards. Drives the "New arrival" tag.
    website_first_shown_at: { type: SchemaTypes.Date },
    // Age group for the website's age guide when the size range can't tell it
    // (e.g. a baby booty in size 1): an id from AGE_GROUPS in
    // utils/website_config.js, or "none" for no age. Empty = worked out from sizes.
    age_group: { type: SchemaTypes.String, trim: true },
  },
  {
    timestamps: true, //this will add time in data object when the  is created in database
  }
);
footwearSchema.index({ show_on_website: 1 });
footwearSchema.index({ group_key: 1 });
const FootwearModel = mongoose.model(FOOTWEAR, footwearSchema);
module.exports = FootwearModel;
