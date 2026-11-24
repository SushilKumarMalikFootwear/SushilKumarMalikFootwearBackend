const { Schema, SchemaTypes } = require("../connect");
const mongoose = require("../connect");

// Customer and admin accounts for the website. Admins are accounts whose
// email is listed in the ADMIN_EMAILS environment variable.
const addressSchema = new Schema(
  {
    line1: { type: SchemaTypes.String },
    line2: { type: SchemaTypes.String },
    landmark: { type: SchemaTypes.String },
    city: { type: SchemaTypes.String },
    pincode: { type: SchemaTypes.String },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    email: { type: SchemaTypes.String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: SchemaTypes.String, required: true },
    name: { type: SchemaTypes.String, trim: true },
    phone: { type: SchemaTypes.String, trim: true },
    address: { type: addressSchema },
    email_verified: { type: SchemaTypes.Boolean, default: false },
    // Bumped on password reset so old login tokens stop working.
    token_version: { type: SchemaTypes.Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("website_user", userSchema);
