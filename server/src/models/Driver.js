const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    driverName: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, "Experience is required"],
      min: 0,
    },
    status: {
      type: String,
      enum: ["Available", "Busy"],
      default: "Available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Driver", driverSchema);