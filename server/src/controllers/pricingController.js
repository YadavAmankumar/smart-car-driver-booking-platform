const Pricing = require("../models/Pricing");
const asyncHandler = require("../utils/asyncHandler");
const {
  validatePricingConfig,
  calculateFare,
} = require("../services/pricingService");

const buildPricingResponse = (pricing) => {
  if (!pricing) return null;

  return {
    id: pricing._id,
    isActive: pricing.isActive,

    driverOnly: pricing.driverOnly,
    carWithDriver: pricing.carWithDriver,
    outstationCharges: pricing.outstationCharges,
    common: pricing.common,
  };
};

// Admin: GET /api/v1/pricing
exports.getPricing = asyncHandler(async (req, res) => {
  const pricing = await Pricing.findOne({ isActive: true }).sort({
    createdAt: -1,
  });

  if (!pricing) {
    return res.status(404).json({
      success: false,
      message: "No active pricing configuration found.",
    });
  }

  return res.status(200).json({
    success: true,
    data: buildPricingResponse(pricing),
  });
});

// Admin: PUT /api/v1/pricing
exports.updatePricing = asyncHandler(async (req, res) => {
  const payload = req.body || {};

  console.log("[pricing] PUT req.body", payload);

  const active = await Pricing.findOne({ isActive: true }).sort({
    createdAt: -1,
  });

  if (!active) {
    return res.status(404).json({
      success: false,
      message: "No active pricing configuration found.",
    });
  }

  const [pricingDocumentCount, activePricingCount] =
    await Promise.all([
      Pricing.countDocuments(),
      Pricing.countDocuments({ isActive: true }),
    ]);

  if (pricingDocumentCount !== 1 || activePricingCount !== 1) {
    return res.status(409).json({
      success: false,
      message:
        "Pricing collection integrity error: exactly one active pricing document is required.",
    });
  }

  const candidate = {
    driverOnly: payload.driverOnly ?? active.driverOnly,
    carWithDriver: payload.carWithDriver ?? active.carWithDriver,
    outstationCharges:
      payload.outstationCharges ?? active.outstationCharges,
    common: payload.common ?? active.common,
    isActive: true,
  };

  validatePricingConfig(candidate);

  const activeId = active._id;

  active.set(candidate);

  const saved = await active.save();

  if (!saved._id.equals(activeId)) {
    throw new Error(
      "Pricing update changed the active document identity"
    );
  }

  const [savedDocumentCount, savedActiveCount] =
    await Promise.all([
      Pricing.countDocuments(),
      Pricing.countDocuments({ isActive: true }),
    ]);

  if (savedDocumentCount !== 1 || savedActiveCount !== 1) {
    throw new Error(
      "Pricing collection integrity changed during update"
    );
  }

  const persisted = await Pricing.findById(activeId);

  if (!persisted) {
    return res.status(500).json({
      success: false,
      message:
        "Pricing update could not be verified in MongoDB.",
    });
  }

  const persistedObject = persisted.toObject();

  const expected = {
    driverOnly: candidate.driverOnly,
    carWithDriver: candidate.carWithDriver,
    outstationCharges: candidate.outstationCharges,
    common: candidate.common,
    isActive: true,
  };

  const mismatchedFields = Object.entries(expected)
    .filter(([field, value]) => {
      return (
        JSON.stringify(persistedObject[field]) !==
        JSON.stringify(value)
      );
    })
    .map(([field]) => field);

  if (mismatchedFields.length > 0) {
    console.error(
      "[pricing] MongoDB verification mismatch",
      mismatchedFields
    );

    return res.status(500).json({
      success: false,
      message: "Pricing update was not persisted to MongoDB.",
      errors: mismatchedFields,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Pricing updated successfully.",
    data: buildPricingResponse(persisted),
  });
});

// Customer: POST /api/v1/pricing/estimate
exports.estimateFare = asyncHandler(async (req, res) => {
  const {
    serviceType,
    tripType,
    vehicleCategory,
    vehicleAc,
    pickupLocation,
    dropLocation,
    estimatedKm,
    estimatedHours,
    bookingDate,
    pickupTime,
  } = req.body || {};

  if (
    !serviceType ||
    !["Driver Only", "Car with Driver"].includes(serviceType)
  ) {
    return res.status(400).json({
      success: false,
      message:
        "serviceType must be 'Driver Only' or 'Car with Driver'",
      errors: [
        {
          field: "serviceType",
          message: "Invalid serviceType",
        },
      ],
    });
  }

  if (!pickupLocation || typeof pickupLocation !== "string") {
    return res.status(400).json({
      success: false,
      message: "pickupLocation is required",
      errors: [
        {
          field: "pickupLocation",
          message: "pickupLocation is required",
        },
      ],
    });
  }

  if (!dropLocation || typeof dropLocation !== "string") {
    return res.status(400).json({
      success: false,
      message: "dropLocation is required",
      errors: [
        {
          field: "dropLocation",
          message: "dropLocation is required",
        },
      ],
    });
  }

  if (!bookingDate || typeof bookingDate !== "string") {
    return res.status(400).json({
      success: false,
      message: "bookingDate is required",
      errors: [
        {
          field: "bookingDate",
          message: "bookingDate is required",
        },
      ],
    });
  }

  if (!pickupTime || typeof pickupTime !== "string") {
    return res.status(400).json({
      success: false,
      message: "pickupTime is required",
      errors: [
        {
          field: "pickupTime",
          message: "pickupTime is required",
        },
      ],
    });
  }

  if (serviceType === "Driver Only") {
    if (
      !Number.isFinite(Number(estimatedHours)) ||
      Number(estimatedHours) < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "estimatedHours must be a number >= 1 for Driver Only",
        errors: [
          {
            field: "estimatedHours",
            message: "estimatedHours must be >= 1",
          },
        ],
      });
    }
  }

  if (serviceType === "Car with Driver") {
    if (!["Local", "Outstation"].includes(tripType)) {
      return res.status(400).json({
        success: false,
        message:
          "tripType must be 'Local' or 'Outstation' for Car with Driver",
        errors: [
          {
            field: "tripType",
            message: "Invalid tripType",
          },
        ],
      });
    }

    if (
      !["Mini", "Sedan", "XL – 7 Seater", "Force Traveller"].includes(
        vehicleCategory
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "A valid vehicleCategory is required for Car with Driver",
        errors: [
          {
            field: "vehicleCategory",
            message: "Invalid vehicleCategory",
          },
        ],
      });
    }

    if (!["AC", "Non-AC"].includes(vehicleAc)) {
      return res.status(400).json({
        success: false,
        message:
          "vehicleAc must be 'AC' or 'Non-AC' for Car with Driver",
        errors: [
          {
            field: "vehicleAc",
            message: "Invalid vehicleAc",
          },
        ],
      });
    }

    if (
      !Number.isFinite(Number(estimatedKm)) ||
      Number(estimatedKm) < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "estimatedKm must be a number >= 1 for Car with Driver",
        errors: [
          {
            field: "estimatedKm",
            message: "estimatedKm must be >= 1",
          },
        ],
      });
    }
  }

  const fareResult = await calculateFare({
    serviceType,
    tripType:
      serviceType === "Car with Driver"
        ? tripType
        : undefined,
    vehicleCategory:
      serviceType === "Car with Driver"
        ? vehicleCategory
        : undefined,
    vehicleAc:
      serviceType === "Car with Driver"
        ? vehicleAc
        : undefined,
    estimatedHours:
      serviceType === "Driver Only"
        ? Number(estimatedHours)
        : undefined,
    estimatedKm:
      serviceType === "Car with Driver"
        ? Number(estimatedKm)
        : undefined,
    pickupDate: bookingDate,
    pickupTime,
    waitingMinutes: 0,
  });

  return res.status(200).json({
    success: true,
    data: {
      serviceType,
      tripType:
        serviceType === "Car with Driver"
          ? tripType
          : null,
      vehicleCategory:
        serviceType === "Car with Driver"
          ? vehicleCategory
          : null,
      vehicleAc:
        serviceType === "Car with Driver"
          ? vehicleAc
          : null,

      baseFare: fareResult.baseFare,
      hourlyRate: fareResult.hourlyRate,
      distanceCharge: fareResult.distanceCharge,
      waitingCharge: fareResult.waitingCharge,
      outstationDriverAllowance:
        fareResult.outstationDriverAllowance,
      outstationNightStay:
        fareResult.outstationNightStay,
      outstationCharge: fareResult.outstationCharge,
      nightCharge: fareResult.nightCharge,
      weekendCharge: fareResult.weekendCharge,
      gst: fareResult.gst,
      estimatedTotal: fareResult.estimatedFare,
      distanceKm: fareResult.distanceKm,
      estimatedDuration: fareResult.estimatedDuration,
    },
  });
});
