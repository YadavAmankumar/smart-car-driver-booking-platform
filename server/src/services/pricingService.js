const Pricing = require("../models/Pricing");

const DEFAULT_NIGHT_WINDOW = { startHour: 22, endHour: 5 };

const VEHICLE_CATEGORIES = [
  "Mini",
  "Sedan",
  "XL – 7 Seater",
  "Force Traveller",
];

const VEHICLE_CATEGORY_KEYS = {
  Mini: "mini",
  Sedan: "sedan",
  "XL – 7 Seater": "xl7Seater",
  "Force Traveller": "forceTraveller",
};

const AC_TYPES = ["AC", "Non-AC"];
const TRIP_TYPES = ["Local", "Outstation"];

const isValidNumber = (value) =>
  typeof value === "number" && Number.isFinite(value);

const assertNonNegative = (value, field) => {
  if (!isValidNumber(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
};

const assertPositive = (value, field) => {
  if (!isValidNumber(value) || value <= 0) {
    throw new Error(`${field} must be a positive number`);
  }
};

const validateVehiclePricing = (pricing, fieldPrefix) => {
  if (!pricing || typeof pricing !== "object") {
    throw new Error(`${fieldPrefix} pricing configuration is missing`);
  }

  assertNonNegative(pricing.baseFare, `${fieldPrefix}.baseFare`);
  assertNonNegative(pricing.ratePerKm, `${fieldPrefix}.ratePerKm`);
  assertPositive(pricing.minimumKm, `${fieldPrefix}.minimumKm`);
  assertNonNegative(pricing.extraKmCharge, `${fieldPrefix}.extraKmCharge`);
};

const validateVehicleCategoryPricing = (pricing, fieldPrefix) => {
  if (!pricing || typeof pricing !== "object") {
    throw new Error(`${fieldPrefix} pricing configuration is missing`);
  }

  validateVehiclePricing(pricing.ac, `${fieldPrefix}.ac`);
  validateVehiclePricing(pricing.nonAc, `${fieldPrefix}.nonAc`);
};

const validateTripPricing = (pricing, tripType) => {
  if (!pricing || typeof pricing !== "object") {
    throw new Error(`${tripType} pricing configuration is missing`);
  }

  Object.entries(VEHICLE_CATEGORY_KEYS).forEach(
    ([category, categoryKey]) => {
      validateVehicleCategoryPricing(
        pricing[categoryKey],
        `carWithDriver.${tripType.toLowerCase()}.${category}`
      );
    }
  );
};

const validatePricingConfig = (p) => {
  if (!p) {
    throw new Error("Missing active pricing configuration");
  }

  if (!p.driverOnly) {
    throw new Error("driverOnly pricing configuration is missing");
  }

  assertNonNegative(p.driverOnly.baseFare, "driverOnly.baseFare");
  assertNonNegative(p.driverOnly.hourlyRate, "driverOnly.hourlyRate");
  assertNonNegative(
    p.driverOnly.extraHourlyRate,
    "driverOnly.extraHourlyRate"
  );
  assertPositive(p.driverOnly.minimumHours, "driverOnly.minimumHours");

  if (!p.carWithDriver) {
    throw new Error("carWithDriver pricing configuration is missing");
  }

  validateTripPricing(p.carWithDriver.local, "Local");
  validateTripPricing(p.carWithDriver.outstation, "Outstation");

  if (!p.outstationCharges) {
    throw new Error("outstationCharges configuration is missing");
  }

  assertNonNegative(
    p.outstationCharges.driverAllowance,
    "outstationCharges.driverAllowance"
  );
  assertNonNegative(
    p.outstationCharges.nightStay,
    "outstationCharges.nightStay"
  );

  if (!p.common) {
    throw new Error("common pricing configuration is missing");
  }

  assertNonNegative(
    p.common.waitingChargePerMinute,
    "common.waitingChargePerMinute"
  );
  assertNonNegative(
    p.common.waitingGraceTimeMinutes,
    "common.waitingGraceTimeMinutes"
  );
  assertNonNegative(p.common.gstPercent, "common.gstPercent");
  assertNonNegative(
    p.common.nightChargePercent,
    "common.nightChargePercent"
  );
  assertNonNegative(
    p.common.weekendChargePercent,
    "common.weekendChargePercent"
  );
  assertNonNegative(p.common.minimumFare, "common.minimumFare");

  const window = p.common.nightChargeWindow || DEFAULT_NIGHT_WINDOW;

  if (!isValidNumber(window.startHour) || !isValidNumber(window.endHour)) {
    throw new Error(
      "common.nightChargeWindow must contain valid startHour and endHour"
    );
  }

  if (window.startHour < 0 || window.startHour > 23) {
    throw new Error(
      "common.nightChargeWindow.startHour must be between 0 and 23"
    );
  }

  if (window.endHour < 0 || window.endHour > 23) {
    throw new Error(
      "common.nightChargeWindow.endHour must be between 0 and 23"
    );
  }
};

const isNightTime = ({ pickupTime, nightChargeWindow }) => {
  if (!pickupTime) return false;

  const { startHour, endHour } =
    nightChargeWindow || DEFAULT_NIGHT_WINDOW;

  const timeStr = String(pickupTime).trim();
  const [hhStr, mmStr] = timeStr.split(":");

  const hour = Number(hhStr);
  const minute = Number(mmStr);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return false;
  }

  if (startHour === endHour) {
    return hour === startHour;
  }

  if (startHour < endHour) {
    return hour >= startHour && hour < endHour;
  }

  return hour >= startHour || hour < endHour;
};

const isWeekend = ({ pickupDate }) => {
  if (!pickupDate) return false;

  const date =
    pickupDate instanceof Date ? pickupDate : new Date(pickupDate);

  if (Number.isNaN(date.getTime())) return false;

  const day = date.getDay();

  return day === 0 || day === 6;
};

const calculateWaitingChargeMinutes = ({
  waitingMinutes,
  graceMinutes,
}) => {
  if (!isValidNumber(waitingMinutes) || waitingMinutes <= 0) {
    return 0;
  }

  if (!isValidNumber(graceMinutes) || graceMinutes <= 0) {
    return waitingMinutes;
  }

  return Math.max(0, waitingMinutes - graceMinutes);
};

const getVehiclePricing = ({
  pricing,
  tripType,
  vehicleCategory,
  vehicleAc,
}) => {
  if (!TRIP_TYPES.includes(tripType)) {
    throw new Error("tripType must be 'Local' or 'Outstation'");
  }

  if (!VEHICLE_CATEGORIES.includes(vehicleCategory)) {
    throw new Error(
      "vehicleCategory must be 'Mini', 'Sedan', 'XL – 7 Seater', or 'Force Traveller'"
    );
  }

  if (!AC_TYPES.includes(vehicleAc)) {
    throw new Error("vehicleAc must be 'AC' or 'Non-AC'");
  }

  const tripKey = tripType.toLowerCase();
  const categoryKey = VEHICLE_CATEGORY_KEYS[vehicleCategory];
  const acKey = vehicleAc === "AC" ? "ac" : "nonAc";

  const selectedPricing =
    pricing.carWithDriver?.[tripKey]?.[categoryKey]?.[acKey];

  if (!selectedPricing) {
    throw new Error(
      `Pricing configuration not found for ${tripType} / ${vehicleCategory} / ${vehicleAc}`
    );
  }

  return selectedPricing;
};

const calculateFare = async ({
  serviceType,
  tripType,
  vehicleCategory,
  vehicleAc,
  estimatedHours,
  estimatedKm,
  pickupDate,
  pickupTime,
  waitingMinutes = 0,
}) => {
  const pricing = await getActivePricing();

  validatePricingConfig(pricing);

  const common = pricing.common;

  let selectedVehiclePricing = null;

  if (serviceType === "Car with Driver") {
    selectedVehiclePricing = getVehiclePricing({
      pricing,
      tripType,
      vehicleCategory,
      vehicleAc,
    });
  }

  const nightChargeWindow =
    common.nightChargeWindow || DEFAULT_NIGHT_WINDOW;

  const weekendEligible = isWeekend({
    pickupDate,
  });

  const nightEligible = isNightTime({
    pickupTime,
    nightChargeWindow,
  });

  let baseFare = 0;
  let distanceCharge = 0;
  let hourlyRate = 0;
  let ratePerKm = 0;
  let estimatedDuration = 0;
  let distanceKm = 0;

  let outstationDriverAllowance = 0;
  let outstationNightStay = 0;

  if (serviceType === "Driver Only") {
    if (!isValidNumber(estimatedHours) || estimatedHours < 1) {
      throw new Error(
        "estimatedHours must be a number >= 1 for Driver Only"
      );
    }

    const driverOnly = pricing.driverOnly;
    hourlyRate = driverOnly.hourlyRate;

    // The customer books an explicit number of Driver Only hours. Legacy
    // configuration remains snapshotted for compatibility, but does not alter
    // the new booking estimate.
    baseFare = estimatedHours * hourlyRate;

    const round = (value) => Math.round((value || 0) * 100) / 100;

    return {
      pricingSnapshot: {
        driverOnly: pricing.driverOnly,
        common,
      },
      baseFare: round(baseFare),
      distanceKm: 0,
      estimatedDuration: 0,
      ratePerKm: 0,
      hourlyRate: round(hourlyRate),
      distanceCharge: 0,
      waitingCharge: 0,
      outstationDriverAllowance: 0,
      outstationNightStay: 0,
      outstationCharge: 0,
      airportCharge: 0,
      nightCharge: 0,
      weekendCharge: 0,
      gst: 0,
      minimumFare: 0,
      estimatedFare: round(baseFare),
    };
  } else if (serviceType === "Car with Driver") {
    if (!TRIP_TYPES.includes(tripType)) {
      throw new Error(
        "tripType must be 'Local' or 'Outstation' for Car with Driver"
      );
    }

    if (!VEHICLE_CATEGORIES.includes(vehicleCategory)) {
      throw new Error("Valid vehicleCategory is required for Car with Driver");
    }

    if (!AC_TYPES.includes(vehicleAc)) {
      throw new Error("Valid vehicleAc is required for Car with Driver");
    }

    if (!isValidNumber(estimatedKm) || estimatedKm < 1) {
      throw new Error(
        "estimatedKm must be a number >= 1 for Car with Driver"
      );
    }

    distanceKm = estimatedKm;

    baseFare = selectedVehiclePricing.baseFare;
    ratePerKm = selectedVehiclePricing.ratePerKm;

    const minimumKm = selectedVehiclePricing.minimumKm;
    const chargedKm = Math.max(distanceKm, minimumKm);

    const includedKm = Math.min(chargedKm, minimumKm);
    const extraKm = Math.max(0, chargedKm - minimumKm);

    distanceCharge =
      includedKm * ratePerKm +
      extraKm * (ratePerKm + selectedVehiclePricing.extraKmCharge);

    if (tripType === "Outstation") {
      outstationDriverAllowance =
        pricing.outstationCharges.driverAllowance;

      outstationNightStay =
        pricing.outstationCharges.nightStay;
    }

    estimatedDuration = 0;
  } else {
    throw new Error("Invalid serviceType");
  }

  const waitingChargeableMinutes =
    calculateWaitingChargeMinutes({
      waitingMinutes,
      graceMinutes: common.waitingGraceTimeMinutes,
    });

  const waitingCharge =
    waitingChargeableMinutes * common.waitingChargePerMinute;

  const outstationCharge =
    serviceType === "Car with Driver" && tripType === "Outstation"
      ? outstationDriverAllowance + outstationNightStay
      : 0;

  const subtotalBeforeSurcharges =
    baseFare +
    distanceCharge +
    waitingCharge +
    outstationCharge;

  const nightCharge = nightEligible
    ? (subtotalBeforeSurcharges * common.nightChargePercent) / 100
    : 0;

  const weekendCharge = weekendEligible
    ? (subtotalBeforeSurcharges * common.weekendChargePercent) / 100
    : 0;

  const subtotalAfterSurcharges =
    subtotalBeforeSurcharges +
    nightCharge +
    weekendCharge;

  const gst =
    (subtotalAfterSurcharges * common.gstPercent) / 100;

  let estimatedFare = subtotalAfterSurcharges + gst;

  if (estimatedFare < common.minimumFare) {
    estimatedFare = common.minimumFare;
  }

  const round = (value) =>
    Math.round((value || 0) * 100) / 100;

  const pricingSnapshot = {
    driverOnly: pricing.driverOnly,
    carWithDriver:
      serviceType === "Car with Driver"
        ? {
            tripType,
            vehicleCategory,
            vehicleAc,
            pricing: selectedVehiclePricing,
          }
        : undefined,
    outstationCharges:
      serviceType === "Car with Driver" && tripType === "Outstation"
        ? pricing.outstationCharges
        : undefined,
    common,
  };

  return {
    pricingSnapshot,

    baseFare: round(baseFare),
    distanceKm: round(distanceKm),
    estimatedDuration: round(estimatedDuration),

    ratePerKm: round(ratePerKm),
    hourlyRate: round(hourlyRate),

    distanceCharge: round(distanceCharge),
    waitingCharge: round(waitingCharge),

    outstationDriverAllowance: round(outstationDriverAllowance),
    outstationNightStay: round(outstationNightStay),
    outstationCharge: round(outstationCharge),

    airportCharge: 0,
    nightCharge: round(nightCharge),
    weekendCharge: round(weekendCharge),
    gst: round(gst),
    minimumFare: round(common.minimumFare),

    estimatedFare: round(estimatedFare),
  };
};

const getActivePricing = async () => {
  const active = await Pricing.find({ isActive: true }).sort({
    createdAt: -1,
  });

  if (!active || active.length === 0) {
    throw new Error("No active pricing configuration found");
  }

  if (active.length > 1) {
    const [keep, ...rest] = active;

    await Pricing.updateMany(
      { _id: { $in: rest.map((pricing) => pricing._id) } },
      { $set: { isActive: false } }
    );

    return keep;
  }

  return active[0];
};

module.exports = {
  validatePricingConfig,
  calculateFare,
  getActivePricing,
};
