const Pricing = require("../models/Pricing");
const asyncHandler = require("../utils/asyncHandler");
const { validatePricingConfig, calculateFare } = require("../services/pricingService");


const buildPricingResponse = (p) => {
  if (!p) return null;
  return {
    id: p._id,
    isActive: p.isActive,

    // Driver only
    driverBaseFare: p.driverBaseFare,
    driverHourlyRate: p.driverHourlyRate,
    driverExtraHourlyRate: p.driverExtraHourlyRate,
    driverMinimumHours: p.driverMinimumHours,

    // Car + Driver
    carDriverBaseFare: p.carDriverBaseFare,
    acRatePerKm: p.acRatePerKm,
    nonAcRatePerKm: p.nonAcRatePerKm,
    minimumKm: p.minimumKm,
    extraKmCharge: p.extraKmCharge,

    driverAllowance: p.driverAllowance,
    nightStay: p.nightStay,
    tollCharge: p.tollCharge,
    stateTax: p.stateTax,
    localBaseFare: p.localBaseFare,
    localPerKmRate: p.localPerKmRate,

    // Common
    waitingChargePerMinute: p.waitingChargePerMinute,
    waitingGraceTimeMinutes: p.waitingGraceTimeMinutes,
    airportCharge: p.airportCharge,
    gstPercent: p.gstPercent,
    nightChargePercent: p.nightChargePercent,
    weekendChargePercent: p.weekendChargePercent,
    minimumFare: p.minimumFare,

    nightChargeWindow: p.nightChargeWindow || { startHour: 22, endHour: 5 },
  };
};

// Admin: GET /api/v1/pricing
exports.getPricing = asyncHandler(async (req, res) => {
  const pricing = await Pricing.findOne({ isActive: true }).sort({ createdAt: -1 });

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

  // A pricing edit always targets the existing active document. It never
  // creates, replaces, or changes the document identity.
  const active = await Pricing.findOne({ isActive: true }).sort({ createdAt: -1 });

  if (!active) {
    return res.status(404).json({
      success: false,
      message: "No active pricing configuration found.",
    });
  }

  console.log("[pricing] Active pricing before update", active.toObject());

  const [pricingDocumentCount, activePricingCount] = await Promise.all([
    Pricing.countDocuments(),
    Pricing.countDocuments({ isActive: true }),
  ]);

  if (pricingDocumentCount !== 1 || activePricingCount !== 1) {
    return res.status(409).json({
      success: false,
      message: "Pricing collection integrity error: exactly one active pricing document is required.",
    });
  }

  // Only allow pricing fields and retain the active document's value for any
  // omitted field. This lets validation run without constructing a new model.
  const candidate = {
    // Driver only
    driverBaseFare: payload.driverBaseFare ?? active.driverBaseFare,
    driverHourlyRate: payload.driverHourlyRate ?? active.driverHourlyRate,
    driverExtraHourlyRate:
      payload.driverExtraHourlyRate ?? active.driverExtraHourlyRate,
    driverMinimumHours: payload.driverMinimumHours ?? active.driverMinimumHours,

    // Car+driver
    carDriverBaseFare: payload.carDriverBaseFare ?? active.carDriverBaseFare,
    acRatePerKm: payload.acRatePerKm ?? active.acRatePerKm,
    nonAcRatePerKm: payload.nonAcRatePerKm ?? active.nonAcRatePerKm,
    minimumKm: payload.minimumKm ?? active.minimumKm,
    extraKmCharge: payload.extraKmCharge ?? active.extraKmCharge,

    driverAllowance: payload.driverAllowance ?? active.driverAllowance,
    nightStay: payload.nightStay ?? active.nightStay,
    tollCharge: payload.tollCharge ?? active.tollCharge,
    stateTax: payload.stateTax ?? active.stateTax,
    localBaseFare: payload.localBaseFare ?? active.localBaseFare,
    localPerKmRate: payload.localPerKmRate ?? active.localPerKmRate,

    // Common
    waitingChargePerMinute:
      payload.waitingChargePerMinute ?? active.waitingChargePerMinute,
    waitingGraceTimeMinutes:
      payload.waitingGraceTimeMinutes ?? active.waitingGraceTimeMinutes,
    airportCharge: payload.airportCharge ?? active.airportCharge,
    gstPercent: payload.gstPercent ?? active.gstPercent,
    nightChargePercent: payload.nightChargePercent ?? active.nightChargePercent,
    weekendChargePercent:
      payload.weekendChargePercent ?? active.weekendChargePercent,
    minimumFare: payload.minimumFare ?? active.minimumFare,

    nightChargeWindow: payload.nightChargeWindow ?? active.nightChargeWindow,

    isActive: true,
  };

  validatePricingConfig(candidate);

  const activeId = active._id;
  const updateValues = { ...candidate, isActive: true };
  console.log("[pricing] active.set values", updateValues);
  active.set(updateValues);
  const saved = await active.save();
  console.log("[pricing] Active pricing after save", saved.toObject());

  if (!saved._id.equals(activeId)) {
    throw new Error("Pricing update changed the active document identity");
  }

  const [savedDocumentCount, savedActiveCount] = await Promise.all([
    Pricing.countDocuments(),
    Pricing.countDocuments({ isActive: true }),
  ]);

  if (savedDocumentCount !== 1 || savedActiveCount !== 1) {
    throw new Error("Pricing collection integrity changed during update");
  }

  const persisted = await Pricing.findById(activeId);
  if (!persisted) {
    return res.status(500).json({
      success: false,
      message: "Pricing update could not be verified in MongoDB.",
    });
  }

  console.log("[pricing] Pricing re-read from MongoDB", persisted.toObject());

  const mismatchedFields = Object.entries(updateValues)
    .filter(([field, value]) => {
      const persistedValue = persisted.get(field);
      return JSON.stringify(persistedValue) !== JSON.stringify(value);
    })
    .map(([field]) => field);

  if (mismatchedFields.length > 0) {
    console.error("[pricing] MongoDB verification mismatch", mismatchedFields);
    return res.status(500).json({
      success: false,
      message: "Pricing update was not persisted to MongoDB.",
      errors: mismatchedFields,
    });
  }

  res.status(200).json({
    success: true,
    message: "Pricing updated successfully.",
    data: buildPricingResponse(persisted),
  });

});

// Customer: POST /api/v1/pricing/estimate
exports.estimateFare = asyncHandler(async (req, res) => {
  const {
    serviceType,
    carType,
    pickupLocation,
    dropLocation,
    estimatedKm,
    estimatedHours,
    bookingDate,
    pickupTime,
    isAirportRide,
  } = req.body || {};

  // Basic validations (kept minimal to align with existing pricingService errors)
  if (!serviceType || !["Driver Only", "Car with Driver"].includes(serviceType)) {
    return res.status(400).json({
      success: false,
      message: "serviceType must be 'Driver Only' or 'Car with Driver'",
      errors: [{ field: "serviceType", message: "Invalid serviceType" }],
    });
  }

  if (!pickupLocation || typeof pickupLocation !== "string") {
    return res.status(400).json({
      success: false,
      message: "pickupLocation is required",
      errors: [{ field: "pickupLocation", message: "pickupLocation is required" }],
    });
  }

  if (!dropLocation || typeof dropLocation !== "string") {
    return res.status(400).json({
      success: false,
      message: "dropLocation is required",
      errors: [{ field: "dropLocation", message: "dropLocation is required" }],
    });
  }

  if (!bookingDate || typeof bookingDate !== "string") {
    return res.status(400).json({
      success: false,
      message: "bookingDate is required",
      errors: [{ field: "bookingDate", message: "bookingDate is required" }],
    });
  }

  if (!pickupTime || typeof pickupTime !== "string") {
    return res.status(400).json({
      success: false,
      message: "pickupTime is required",
      errors: [{ field: "pickupTime", message: "pickupTime is required" }],
    });
  }

  if (serviceType === "Driver Only") {
    if (!Number.isFinite(estimatedHours) || Number(estimatedHours) < 1) {
      return res.status(400).json({
        success: false,
        message: "estimatedHours must be a number >= 1 for Driver Only",
        errors: [{ field: "estimatedHours", message: "estimatedHours must be >= 1" }],
      });
    }
  }

  if (serviceType === "Car with Driver") {
    if (!Number.isFinite(estimatedKm) || Number(estimatedKm) < 1) {
      return res.status(400).json({
        success: false,
        message: "estimatedKm must be a number >= 1 for Car with Driver",
        errors: [{ field: "estimatedKm", message: "estimatedKm must be >= 1" }],
      });
    }

    if (!carType || !["AC", "Non-AC"].includes(carType)) {
      return res.status(400).json({
        success: false,
        message: "carType must be 'AC' or 'Non-AC' for Car with Driver",
        errors: [{ field: "carType", message: "Invalid carType" }],
      });
    }
  }

  const fareResult = await calculateFare({
    serviceType,
    carType: serviceType === "Car with Driver" ? carType : undefined,
    estimatedHours: serviceType === "Driver Only" ? Number(estimatedHours) : undefined,
    estimatedKm: serviceType === "Car with Driver" ? Number(estimatedKm) : undefined,
    pickupDate: bookingDate,
    pickupTime,
    isAirportRide: Boolean(isAirportRide),
    waitingMinutes: 0,
  });

  res.status(200).json({
    success: true,
    data: {
      baseFare: fareResult.baseFare,
      distanceCharge: fareResult.distanceCharge,
      waitingCharge: fareResult.waitingCharge,
      airportCharge: fareResult.airportCharge,
      nightCharge: fareResult.nightCharge,
      weekendCharge: fareResult.weekendCharge,
      gst: fareResult.gst,
      estimatedTotal: fareResult.estimatedFare,
      distanceKm: fareResult.distanceKm,
      estimatedDuration: fareResult.estimatedDuration,
    },
  });
});
