const mongoose = require("mongoose");

const carSchema = new mongoose.Schema(
  {
    carName: {
      type: String,
      required: [true, "Car name is required"],
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    carNumber: {
      type: String,
      required: [true, "Car number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [/^[A-Z0-9 -]{4,20}$/, "Please enter a valid car number"],
    },
    carType: {
      type: String,
      required: [true, "Fuel type is required"],
      enum: ["Petrol", "Diesel", "CNG", "EV"],
    },
    isAC: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

carSchema.index({ isAvailable: 1, createdAt: -1 });

module.exports = mongoose.model("Car", carSchema);
