const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    // A driver profile must be explicitly linked to the account that can sign
    // in as that driver. `sparse` keeps existing, unlinked legacy profiles
    // usable by the admin fleet screen until an account is provisioned.
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      unique: true,
      sparse: true,
      default: null,
    },
    driverName: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"],
    },
    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: 0,
      max: 80,
    },
    status: {
      type: String,
      enum: ["Available", "Busy"],
      default: "Available",
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

driverSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Driver", driverSchema);
