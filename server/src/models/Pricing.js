const mongoose = require("mongoose");

const vehiclePricingSchema = new mongoose.Schema(
  {
    baseFare: {
      type: Number,
      required: true,
      min: 0,
    },
    ratePerKm: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumKm: {
      type: Number,
      required: true,
      min: 1,
    },
    extraKmCharge: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const vehicleCategoryPricingSchema = new mongoose.Schema(
  {
    ac: {
      type: vehiclePricingSchema,
      required: true,
    },
    nonAc: {
      type: vehiclePricingSchema,
      required: true,
    },
  },
  { _id: false }
);

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
    driverOnly: {
      baseFare: {
        type: Number,
        required: true,
        min: 0,
        default: 300,
      },
      hourlyRate: {
        type: Number,
        required: true,
        min: 0,
        default: 150,
      },
      extraHourlyRate: {
        type: Number,
        required: true,
        min: 0,
        default: 120,
      },
      minimumHours: {
        type: Number,
        required: true,
        min: 1,
        default: 4,
      },
    },

    // ==============================
    // Car + Driver
    // ==============================
    carWithDriver: {
      local: {
        mini: {
          type: vehicleCategoryPricingSchema,
          required: true,
        },
        sedan: {
          type: vehicleCategoryPricingSchema,
          required: true,
        },
        xl7Seater: {
          type: vehicleCategoryPricingSchema,
          required: true,
        },
        forceTraveller: {
          type: vehicleCategoryPricingSchema,
          required: true,
        },
      },

      outstation: {
        mini: {
          type: vehicleCategoryPricingSchema,
          required: true,
        },
        sedan: {
          type: vehicleCategoryPricingSchema,
          required: true,
        },
        xl7Seater: {
          type: vehicleCategoryPricingSchema,
          required: true,
        },
        forceTraveller: {
          type: vehicleCategoryPricingSchema,
          required: true,
        },
      },
    },

    // ==============================
    // Outstation Charges
    // ==============================
    outstationCharges: {
      driverAllowance: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
      nightStay: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
      },
    },

    // ==============================
    // Common Charges
    // ==============================
    common: {
      waitingChargePerMinute: {
        type: Number,
        required: true,
        min: 0,
        default: 2,
      },
      waitingGraceTimeMinutes: {
        type: Number,
        required: true,
        min: 0,
        default: 15,
      },
      gstPercent: {
        type: Number,
        required: true,
        min: 0,
        default: 5,
      },
      nightChargePercent: {
        type: Number,
        required: true,
        min: 0,
        default: 10,
      },
      weekendChargePercent: {
        type: Number,
        required: true,
        min: 0,
        default: 5,
      },
      minimumFare: {
        type: Number,
        required: true,
        min: 0,
        default: 300,
      },
      nightChargeWindow: {
        startHour: {
          type: Number,
          min: 0,
          max: 23,
          default: 22,
        },
        endHour: {
          type: Number,
          min: 0,
          max: 23,
          default: 5,
        },
      },
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Enforce at MongoDB level that only one active pricing document exists.
pricingSchema.index(
  { isActive: 1 },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
    name: "single_active_pricing",
  }
);

module.exports = mongoose.model("Pricing", pricingSchema);
