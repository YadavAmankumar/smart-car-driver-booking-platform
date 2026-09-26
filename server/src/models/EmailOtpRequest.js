const mongoose = require("mongoose");

const emailOtpRequestSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },

    purpose: {
      type: String,
      enum: ["registration", "password_reset"],
      required: true,
    },

    requestedAt: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically remove request records after 1 hour.
emailOtpRequestSchema.index(
  { requestedAt: 1 },
  { expireAfterSeconds: 3600 }
);

module.exports = mongoose.model("EmailOtpRequest", emailOtpRequestSchema);
