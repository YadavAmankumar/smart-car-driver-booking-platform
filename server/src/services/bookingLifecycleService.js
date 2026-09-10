const Booking = require("../models/Booking");
const Driver = require("../models/Driver");
const Car = require("../models/Car");

const TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Ongoing", "Cancelled"],
  Ongoing: ["Completed"],
  Completed: [],
  Cancelled: [],
};

const RESERVING_STATUSES = ["Pending", "Confirmed", "Ongoing"];

class BookingLifecycleError extends Error {
  constructor(message, statusCode = 409) {
    super(message);
    this.name = "BookingLifecycleError";
    this.statusCode = statusCode;
  }
}

const sameId = (left, right) => Boolean(left && right && left.toString() === right.toString());

const getBookingWindow = (booking) => {
  const pickupDate = new Date(booking.bookingDate);
  const [hours = "0", minutes = "0"] = String(booking.pickupTime || "").split(":");
  const start = new Date(pickupDate);
  start.setHours(Number(hours), Number(minutes), 0, 0);
  if (Number.isNaN(start.getTime())) {
    throw new BookingLifecycleError("Booking has an invalid pickup schedule.", 400);
  }

  const durationMinutes = booking.serviceType === "Driver Only"
    ? Math.max(60, Number(booking.estimatedHours || 1) * 60)
    : Math.max(
      60,
      Number(booking.estimatedDuration || 0) * 60,
      Math.ceil((Number(booking.estimatedKm || 1) / 40) * 60),
    );

  return { start, end: new Date(start.getTime() + durationMinutes * 60 * 1000) };
};

const windowsOverlap = (left, right) => left.start < right.end && right.start < left.end;

const findResourceConflict = async (booking, field, resourceId) => {
  if (!resourceId) return null;
  const candidates = await Booking.find({
    _id: { $ne: booking._id },
    [field]: resourceId,
    bookingStatus: { $in: RESERVING_STATUSES },
  }).select("bookingDate pickupTime serviceType estimatedHours estimatedDuration estimatedKm bookingStatus");

  const targetWindow = getBookingWindow(booking);
  return candidates.find((candidate) => windowsOverlap(targetWindow, getBookingWindow(candidate))) || null;
};

const assertNoResourceConflict = async (booking, field, resourceId) => {
  const conflict = await findResourceConflict(booking, field, resourceId);
  if (conflict) {
    const label = field === "driver" ? "driver" : "car";
    throw new BookingLifecycleError(`The selected ${label} is already reserved for an overlapping booking.`);
  }
};

const assertBookingResourcesAvailable = async (booking, { driverId, carId } = {}) => {
  const selectedDriverId = driverId === undefined ? booking.driver : driverId;
  const selectedCarId = carId === undefined ? booking.car : carId;

  if (selectedDriverId) {
    const driver = await Driver.findById(selectedDriverId);
    if (!driver) throw new BookingLifecycleError("Selected driver was not found.", 404);
    if (driver.status !== "Available" && !sameId(booking.driver, driver._id)) {
      throw new BookingLifecycleError("Selected driver is unavailable.");
    }
    await assertNoResourceConflict(booking, "driver", driver._id);
  }

  if (selectedCarId) {
    if (booking.serviceType !== "Car with Driver") {
      throw new BookingLifecycleError("A car can only be assigned to a Car with Driver booking.", 400);
    }
    const car = await Car.findById(selectedCarId);
    if (!car) throw new BookingLifecycleError("Selected car was not found.", 404);
    if (!car.isAvailable && !sameId(booking.car, car._id)) {
      throw new BookingLifecycleError("Selected car is unavailable.");
    }
    if ((booking.carType === "AC") !== car.isAC) {
      throw new BookingLifecycleError("Selected car does not match the booking's AC requirement.", 400);
    }
    await assertNoResourceConflict(booking, "car", car._id);
  }
};

const hasRequiredResources = (booking) => Boolean(
  booking.driver && (booking.serviceType === "Driver Only" || booking.car)
);

const appendStatusHistory = (booking, from, to, actor, reason = "") => {
  if (!Array.isArray(booking.statusHistory)) booking.statusHistory = [];
  booking.statusHistory.push({ from, to, changedBy: actor, changedAt: new Date(), reason });
};

const transitionBooking = (booking, nextStatus, actor, reason = "") => {
  const from = booking.bookingStatus;
  if (!TRANSITIONS[from]?.includes(nextStatus)) {
    throw new BookingLifecycleError(`Cannot change booking status from ${from} to ${nextStatus}.`, 400);
  }
  if (["Confirmed", "Ongoing"].includes(nextStatus) && !hasRequiredResources(booking)) {
    throw new BookingLifecycleError("A driver and any required car must be assigned before this status change.");
  }

  booking.bookingStatus = nextStatus;
  appendStatusHistory(booking, from, nextStatus, actor, reason);
  if (nextStatus === "Cancelled") {
    booking.cancelledAt = new Date();
    booking.cancelledBy = actor;
    booking.cancellationReason = reason;
  }
};

const refreshResourceAvailability = async (booking) => {
  if (booking.driver) {
    const driverHasReservation = await Booking.exists({
      _id: { $ne: booking._id },
      driver: booking.driver,
      bookingStatus: { $in: RESERVING_STATUSES },
    });
    await Driver.findByIdAndUpdate(booking.driver, {
      status: driverHasReservation || RESERVING_STATUSES.includes(booking.bookingStatus) ? "Busy" : "Available",
    });
  }
  if (booking.car) {
    const carHasReservation = await Booking.exists({
      _id: { $ne: booking._id },
      car: booking.car,
      bookingStatus: { $in: RESERVING_STATUSES },
    });
    await Car.findByIdAndUpdate(booking.car, {
      isAvailable: !(carHasReservation || RESERVING_STATUSES.includes(booking.bookingStatus)),
    });
  }
};

const releaseResourceIfFree = async (field, resourceId) => {
  if (!resourceId) return;
  const hasReservation = await Booking.exists({ [field]: resourceId, bookingStatus: { $in: RESERVING_STATUSES } });
  if (field === "driver") {
    await Driver.findByIdAndUpdate(resourceId, { status: hasReservation ? "Busy" : "Available" });
  } else {
    await Car.findByIdAndUpdate(resourceId, { isAvailable: !hasReservation });
  }
};

module.exports = {
  BookingLifecycleError,
  RESERVING_STATUSES,
  assertBookingResourcesAvailable,
  findResourceConflict,
  getBookingWindow,
  hasRequiredResources,
  refreshResourceAvailability,
  releaseResourceIfFree,
  transitionBooking,
};
