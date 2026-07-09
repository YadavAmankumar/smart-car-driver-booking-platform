const mongoose = require("mongoose");

const pricingSchema = new mongoose.Schema(
  {
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    // ==============================
    // Driver Only
    // ==============================
    driverBaseFare: { type: Number, required: true, min: 0, default: 300 },
    driverHourlyRate: { type: Number, required: true, min: 0, default: 150 },
    driverExtraHourlyRate: {
      type: Number,
      required: true,
      min: 0,
      default: 120,
    },
    driverMinimumHours: {
      type: Number,
      required: true,
      min: 1,
      default: 4,
    },

    // ==============================
    // Car + Driver
    // ==============================
    carDriverBaseFare: { type: Number, required: true, min: 0, default: 250 },
    acRatePerKm: { type: Number, required: true, min: 0, default: 21 },
    nonAcRatePerKm: { type: Number, required: true, min: 0, default: 18 },

    // ==============================
    // Common
    // ==============================
    waitingChargePerMinute: { type: Number, required: true, min: 0, default: 2 },
    waitingGraceTimeMinutes: { type: Number, required: true, min: 0, default: 15 },

    airportCharge: { type: Number, required: true, min: 0, default: 200 },
    gstPercent: { type: Number, required: true, min: 0, default: 5 },
    nightChargePercent: { type: Number, required: true, min: 0, default: 10 },
    weekendChargePercent: { type: Number, required: true, min: 0, default: 5 },

    minimumFare: { type: Number, required: true, min: 0, default: 300 },

    // For future extensibility
    nightChargeWindow: {
      startHour: { type: Number, min: 0, max: 23, default: 22 },
      endHour: { type: Number, min: 0, max: 23, default: 5 },
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Enforce at MongoDB level (best-effort) that there is only one active document.
// If your MongoDB version doesn't support partial indexes, service-layer validation still enforces.
pricingSchema.index(
  { isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: "single_active_pricing",
  }
);

module.exports = mongoose.model("Pricing", pricingSchema);

