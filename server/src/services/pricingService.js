const Pricing = require("../models/Pricing");

const DEFAULT_NIGHT_WINDOW = { startHour: 22, endHour: 5 }; // 22:00–05:00

const buildDefaultPricingPayload = () => ({
  // Driver Only
  driverBaseFare: 300,
  driverHourlyRate: 150,
  driverExtraHourlyRate: 120,
  driverMinimumHours: 4,

  // Car + Driver
  carDriverBaseFare: 250,
  acRatePerKm: 21,
  nonAcRatePerKm: 18,

  // Common
  waitingChargePerMinute: 2,
  waitingGraceTimeMinutes: 15,
  airportCharge: 200,
  gstPercent: 5,
  nightChargePercent: 10,
  weekendChargePercent: 5,
  minimumFare: 300,

  nightChargeWindow: DEFAULT_NIGHT_WINDOW,
});

const isValidNumber = (n) => typeof n === "number" && Number.isFinite(n);

const assertNonNegative = (value, field) => {
  if (!isValidNumber(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
};

const assertNonNegativeOrZero = (value, field) => {
  if (!isValidNumber(value) || value < 0) {
    throw new Error(`${field} must be a non-negative number`);
  }
};

const assertPositive = (value, field) => {
  if (!isValidNumber(value) || value <= 0) {
    throw new Error(`${field} must be a positive number`);
  }
};

const validatePricingConfig = (p) => {
  if (!p) throw new Error("Missing active pricing configuration");

  // Driver only
  assertNonNegative(p.driverBaseFare, "driverBaseFare");
  assertNonNegative(p.driverHourlyRate, "driverHourlyRate");
  assertNonNegative(p.driverExtraHourlyRate, "driverExtraHourlyRate");
  assertPositive(p.driverMinimumHours, "driverMinimumHours");

  // Car+driver
  assertNonNegative(p.carDriverBaseFare, "carDriverBaseFare");
  assertNonNegative(p.acRatePerKm, "acRatePerKm");
  assertNonNegative(p.nonAcRatePerKm, "nonAcRatePerKm");

  // Common
  assertNonNegativeOrZero(p.waitingChargePerMinute, "waitingChargePerMinute");
  assertNonNegativeOrZero(
    p.waitingGraceTimeMinutes,
    "waitingGraceTimeMinutes"
  );
  assertNonNegative(p.airportCharge, "airportCharge");

  assertNonNegativeOrZero(p.gstPercent, "gstPercent");
  assertNonNegativeOrZero(p.nightChargePercent, "nightChargePercent");
  assertNonNegativeOrZero(p.weekendChargePercent, "weekendChargePercent");

  assertNonNegative(p.minimumFare, "minimumFare");

  // Night window
  const window = p.nightChargeWindow || DEFAULT_NIGHT_WINDOW;
  if (!isValidNumber(window.startHour) || !isValidNumber(window.endHour)) {
    throw new Error("nightChargeWindow must contain valid startHour and endHour");
  }
  if (window.startHour < 0 || window.startHour > 23) {
    throw new Error("nightChargeWindow.startHour must be between 0 and 23");
  }
  if (window.endHour < 0 || window.endHour > 23) {
    throw new Error("nightChargeWindow.endHour must be between 0 and 23");
  }
};

const isNightTime = ({ pickupDate, pickupTime, nightChargeWindow }) => {
  if (!pickupDate || !pickupTime) return false;

  const { startHour, endHour } = nightChargeWindow || DEFAULT_NIGHT_WINDOW;

  const timeStr = String(pickupTime).trim();
  // Expect format like HH:mm or HH:mm:ss
  const [hhStr, mmStr] = timeStr.split(":");
  const hour = Number(hhStr);
  const minute = Number(mmStr);

  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return false;

  // Handles cross-midnight: 22 -> 5
  if (startHour === endHour) {
    return hour === startHour;
  }

  if (startHour < endHour) {
    // Same-day window
    return hour >= startHour && hour < endHour;
  }

  // Cross-midnight window
  return hour >= startHour || hour < endHour;
};

const isWeekend = ({ pickupDate }) => {
  if (!pickupDate) return false;
  const d = pickupDate instanceof Date ? pickupDate : new Date(pickupDate);
  if (Number.isNaN(d.getTime())) return false;
  const day = d.getDay();
  // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
};

const calculateWaitingChargeMinutes = ({ waitingMinutes, graceMinutes }) => {
  if (!isValidNumber(waitingMinutes) || waitingMinutes <= 0) return 0;
  if (!isValidNumber(graceMinutes) || graceMinutes <= 0) {
    // If grace time is invalid/zero, charge from minute 1
    return waitingMinutes;
  }
  const chargeable = Math.max(0, waitingMinutes - graceMinutes);
  return chargeable;
};

/**
 * Booking supports future distance/duration integration:
 * - Provide distance/duration later without changing Pricing Engine signature too much.
 * - For now, booking inputs are estimatedHours/estimatedKm.
 */
const calculateFare = async ({
  serviceType,
  carType,
  estimatedHours,
  estimatedKm,
  pickupDate,
  pickupTime,
  isAirportRide,
  waitingMinutes = 0,
}) => {
  const pricing = await getActivePricing();
  validatePricingConfig(pricing);

  // Snapshot values
  const snapshot = {
    driverBaseFare: pricing.driverBaseFare,
    driverHourlyRate: pricing.driverHourlyRate,
    driverExtraHourlyRate: pricing.driverExtraHourlyRate,
    driverMinimumHours: pricing.driverMinimumHours,
    carDriverBaseFare: pricing.carDriverBaseFare,
    acRatePerKm: pricing.acRatePerKm,
    nonAcRatePerKm: pricing.nonAcRatePerKm,
    waitingChargePerMinute: pricing.waitingChargePerMinute,
    waitingGraceTimeMinutes: pricing.waitingGraceTimeMinutes,
    airportCharge: pricing.airportCharge,
    gstPercent: pricing.gstPercent,
    nightChargePercent: pricing.nightChargePercent,
    weekendChargePercent: pricing.weekendChargePercent,
    minimumFare: pricing.minimumFare,
    nightChargeWindow: pricing.nightChargeWindow || DEFAULT_NIGHT_WINDOW,
  };

  const nightChargeWindow = snapshot.nightChargeWindow || DEFAULT_NIGHT_WINDOW;

  const weekendEligible = isWeekend({ pickupDate });
  const nightEligible = isNightTime({
    pickupDate,
    pickupTime,
    nightChargeWindow,
  });

  let baseFare = 0;
  let distanceCharge = 0;
  let hourlyRate = 0;
  let ratePerKm = 0;

  let estimatedDuration = 0; // in hours
  let distanceKm = 0;

  // ==============================
  // Base + distance
  // ==============================
  if (serviceType === "Driver Only") {
    if (!isValidNumber(estimatedHours) || estimatedHours < 1) {
      throw new Error("estimatedHours must be a number >= 1 for Driver Only");
    }

    estimatedDuration = estimatedHours;

    baseFare = snapshot.driverBaseFare;
    hourlyRate = snapshot.driverHourlyRate;

    // Minimum hours are bundled with hourly rate.
    // Extra hours charged with extra rate beyond minimum.
    const minimumHours = snapshot.driverMinimumHours;
    const regularHoursCharged = Math.min(estimatedHours, minimumHours);
    const extraHoursCharged = Math.max(0, estimatedHours - minimumHours);

    const regularCharge = regularHoursCharged * snapshot.driverHourlyRate;
    const extraCharge = extraHoursCharged * snapshot.driverExtraHourlyRate;

    baseFare = baseFare + regularCharge + extraCharge;
  } else if (serviceType === "Car with Driver") {
    if (!isValidNumber(estimatedKm) || estimatedKm < 1) {
      throw new Error("estimatedKm must be a number >= 1 for Car with Driver");
    }
    if (!carType || !["AC", "Non-AC"].includes(carType)) {
      throw new Error("carType must be 'AC' or 'Non-AC' for Car with Driver");
    }

    distanceKm = estimatedKm;

    baseFare = snapshot.carDriverBaseFare;

    if (carType === "AC") {
      ratePerKm = snapshot.acRatePerKm;
    } else {
      ratePerKm = snapshot.nonAcRatePerKm;
    }

    distanceCharge = distanceKm * ratePerKm;

    // For now, estimatedDuration isn't derived from km (no duration model provided).
    // Leave as 0 to be compatible with future Google Directions integration.
    estimatedDuration = 0;
  } else {
    throw new Error("Invalid serviceType");
  }

  // ==============================
  // Waiting (future workflow; always 0 at booking creation)
  // ==============================
  const waitingChargeableMinutes =
    calculateWaitingChargeMinutes({
      waitingMinutes,
      graceMinutes: snapshot.waitingGraceTimeMinutes,
    });

  const waitingCharge = waitingChargeableMinutes * snapshot.waitingChargePerMinute;

  // Airport: must be based on dedicated boolean field (no address searching)
  const airportCharge = isAirportRide ? snapshot.airportCharge : 0;

  // Night / weekend charges are percent surcharges on subtotal BEFORE GST.
  const subtotalBeforeGST =
    baseFare + distanceCharge + waitingCharge + airportCharge;

  const nightCharge = nightEligible
    ? (subtotalBeforeGST * snapshot.nightChargePercent) / 100
    : 0;

  const weekendCharge = weekendEligible
    ? (subtotalBeforeGST * snapshot.weekendChargePercent) / 100
    : 0;

  const subtotalAfterSurcharges = subtotalBeforeGST + nightCharge + weekendCharge;

  const gst = (subtotalAfterSurcharges * snapshot.gstPercent) / 100;

  let estimatedFare = subtotalAfterSurcharges + gst;

  // Enforce minimum fare (after GST)
  if (estimatedFare < snapshot.minimumFare) {
    estimatedFare = snapshot.minimumFare;
  }

  // Ensure rounding to paise-safe integer (project currently stores Numbers).
  // We'll round to nearest integer rupee to match existing totalAmount expectations.
  const round = (n) => Math.round((n || 0) * 100) / 100;

  return {
    pricingSnapshot: snapshot,

    baseFare: round(baseFare),
    distanceKm: round(distanceKm),
    estimatedDuration: round(estimatedDuration),

    ratePerKm: round(ratePerKm),
    hourlyRate: round(hourlyRate),

    distanceCharge: round(distanceCharge),
    waitingCharge: round(waitingCharge),
    airportCharge: round(airportCharge),
    nightCharge: round(nightCharge),
    weekendCharge: round(weekendCharge),
    gst: round(gst),
    minimumFare: round(snapshot.minimumFare),

    estimatedFare: round(estimatedFare),
  };
};

const getActivePricing = async () => {
  const active = await Pricing.find({ isActive: true }).sort({ createdAt: -1 });

  if (!active || active.length === 0) {
    const created = await Pricing.create({
      ...buildDefaultPricingPayload(),
      isActive: true,
    });
    return created;
  }

  if (active.length > 1) {
    // Service-layer enforcement (in case partial indexes are not supported).
    // Keep the newest active; deactivate the rest.
    const [keep, ...rest] = active;
    await Pricing.updateMany(
      { _id: { $in: rest.map((d) => d._id) } },
      { $set: { isActive: false } }
    );
    return keep;
  }

  return active[0];
};

module.exports = {
  getActivePricing,
  validatePricingConfig,
  calculateFare,
};

