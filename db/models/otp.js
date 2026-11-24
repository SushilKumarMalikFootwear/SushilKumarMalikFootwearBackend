const { Schema, SchemaTypes } = require("../connect");
const mongoose = require("../connect");

// One-time codes sent by email. Only a hash of the code is stored.
// MongoDB deletes each document automatically once `expires_at` passes.
const otpSchema = new Schema(
  {
    email: { type: SchemaTypes.String, required: true, lowercase: true, trim: true },
    purpose: { type: SchemaTypes.String, enum: ["VERIFY_EMAIL", "RESET_PASSWORD", "ADMIN_LOGIN"], required: true },
    code_hash: { type: SchemaTypes.String, required: true },
    attempts: { type: SchemaTypes.Number, default: 0 },
    expires_at: { type: SchemaTypes.Date, required: true },
  },
  { timestamps: true }
);
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("website_otp", otpSchema);
