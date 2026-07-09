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

  // If missing, controller still returns defaults (created via service usually),
  // but controller should be robust too.
  if (!pricing) {
    const created = await Pricing.create({
      isActive: true,
    });
    return res.status(200).json({
      success: true,
      data: buildPricingResponse(created),
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

  // Ensure only allowed fields are used.
  // (We do not import express-validator to avoid changing dependencies.)
  const candidate = {
    // Driver only
    driverBaseFare: payload.driverBaseFare,
    driverHourlyRate: payload.driverHourlyRate,
    driverExtraHourlyRate: payload.driverExtraHourlyRate,
    driverMinimumHours: payload.driverMinimumHours,

    // Car+driver
    carDriverBaseFare: payload.carDriverBaseFare,
    acRatePerKm: payload.acRatePerKm,
    nonAcRatePerKm: payload.nonAcRatePerKm,

    // Common
    waitingChargePerMinute: payload.waitingChargePerMinute,
    waitingGraceTimeMinutes: payload.waitingGraceTimeMinutes,
    airportCharge: payload.airportCharge,
    gstPercent: payload.gstPercent,
    nightChargePercent: payload.nightChargePercent,
    weekendChargePercent: payload.weekendChargePercent,
    minimumFare: payload.minimumFare,

    nightChargeWindow: payload.nightChargeWindow,

    isActive: true,
  };

  // Build a document-like object for validation.
  // Set defaults from schema by creating a temporary instance.
  const temp = new Pricing(candidate);

  // Normalize nightChargeWindow defaults
  if (!temp.nightChargeWindow) {
    temp.nightChargeWindow = { startHour: 22, endHour: 5 };
  }

  validatePricingConfig(temp.toObject());

  // Deactivate previous actives and create a new active doc (keeps history).
  await Pricing.updateMany({ isActive: true }, { $set: { isActive: false } });

  const created = await Pricing.create({ ...candidate, isActive: true });

  res.status(200).json({
    success: true,
    message: "Pricing updated successfully.",
    data: buildPricingResponse(created),
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


