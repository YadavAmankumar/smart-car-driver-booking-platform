const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: [true, "Booking ID is required"],
    },

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Customer ID is required"],
    },

    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: false,
      default: null,
    },


    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: 0,
    },

    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["Cash", "UPI"],
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Verification Pending", "Paid", "Rejected", "Cancelled", "Refunded"],
      default: "Pending",
    },

    transactionId: {
      type: String,
      trim: true,
      default: "",
    },

    verificationStatus: {
      type: String,
      enum: ["Not Required", "Pending", "Approved", "Rejected"],
      default: "Not Required",
    },
    paidAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },

    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "verifiedByModel",
      default: null,
    },

    verifiedByModel: {
      type: String,
      enum: ["Driver", "User", ""],
      default: "",
    },

    verifiedType: {
      type: String,
      enum: ["Cash Collection", "UPI Manual Verification", ""],
      default: "",
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Remarks cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

paymentSchema.index({ bookingId: 1 }, { unique: true });
paymentSchema.index(
  { transactionId: 1 },
  { unique: true, sparse: true, partialFilterExpression: { transactionId: { $type: "string", $gt: "" } } }
);

module.exports = mongoose.model("Payment", paymentSchema);
