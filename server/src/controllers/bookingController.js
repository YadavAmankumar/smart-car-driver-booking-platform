const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const Driver = require("../models/Driver");
const asyncHandler = require("../utils/asyncHandler");
const pricingService = require("../services/pricingService");
const mongoose = require("mongoose");
const {
  BookingLifecycleError,
  assertBookingResourcesAvailable,
  refreshResourceAvailability,
  releaseResourceIfFree,
  transitionBooking,
} = require("../services/bookingLifecycleService");

const bookingPopulate = (query) => query
  .populate({ path: "driver", select: "driverName experience phoneNumber" })
  .populate({ path: "car", select: "carName carNumber" });

const canAccessBooking = async (user, booking) => {
  if (user.role === "admin") return true;
  if (user.role === "customer") {
    return booking.customer?.equals(user._id) || false;
  }
  if (user.role === "driver") {
    const driver = await Driver.findOne({ user: user._id }).select("_id");
    return Boolean(driver && booking.driver?.equals(driver._id));
  }
  return false;
};

const sendBookingNotFound = (res) => res.status(404).json({
  success: false,
  message: "Booking not found.",
});

const sendLifecycleError = (res, error) => res.status(error.statusCode || 409).json({
  success: false,
  message: error.message,
});

// Admins may only change operational, non-financial booking details here.
// Assignment, payment, customer ownership, and fare snapshots stay immutable
// outside their dedicated workflows.
const ADMIN_MUTABLE_BOOKING_FIELDS = new Set([
  "customerName",
  "mobileNumber",
  "pickupLocation",
  "dropLocation",
  "bookingDate",
  "pickupTime",
  "notes",
]);

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Public
exports.createBooking = asyncHandler(async (req, res) => {
  const {
    customerName,
    mobileNumber,
    serviceType,
    carType,
    pickupLocation,
    dropLocation,
    bookingDate,
    pickupTime,
    estimatedHours,
    estimatedKm,
    paymentMethod,
    notes,

    // Must be provided by frontend for reliable airport charge.
    // Default to false for backward compatibility.
    isAirportRide,
  } = req.body;

  const fareResult = await pricingService.calculateFare({
    serviceType,
    carType,
    estimatedHours: serviceType === "Driver Only" ? estimatedHours : undefined,
    estimatedKm: serviceType === "Car with Driver" ? estimatedKm : undefined,
    pickupDate: bookingDate,
    pickupTime,
    isAirportRide: Boolean(isAirportRide),
    waitingMinutes: 0, // always 0 at booking creation
  });

  const session = await Booking.startSession();
  let booking;

  try {
    await session.withTransaction(async () => {
      [booking] = await Booking.create([{
        customerName, mobileNumber, customer: req.user._id,
        serviceType, carType, pickupLocation, dropLocation, bookingDate,
        pickupTime, estimatedHours, estimatedKm, paymentMethod, notes,
        pricingSnapshot: fareResult.pricingSnapshot,
        statusHistory: [{ to: "Pending", changedBy: req.user._id, reason: "Booking created" }],
        baseFare: fareResult.baseFare, ratePerKm: fareResult.ratePerKm,
        hourlyRate: fareResult.hourlyRate, gst: fareResult.gst,
        airportCharge: fareResult.airportCharge, waitingCharge: fareResult.waitingCharge,
        nightCharge: fareResult.nightCharge, weekendCharge: fareResult.weekendCharge,
        minimumFare: fareResult.minimumFare, distanceKm: fareResult.distanceKm,
        estimatedDuration: fareResult.estimatedDuration, distanceCharge: fareResult.distanceCharge,
        estimatedFare: fareResult.estimatedFare, rate: fareResult.baseFare,
        totalAmount: fareResult.estimatedFare,
      }], { session });

      const [payment] = await Payment.create([{
        bookingId: booking._id, customerId: req.user._id,
        driverId: booking.driver || null, amount: booking.totalAmount,
        paymentMethod, paymentStatus: "Pending",
        verificationStatus: paymentMethod === "UPI" ? "Pending" : "Not Required",
      }], { session });

      booking.payment = payment._id;
      await booking.save({ session });
    });
  } finally {
    await session.endSession();
  }

  res.status(201).json({
    success: true,
    message: "Booking created successfully.",
    data: booking,
  });
});


// @desc    Get all bookings
// @route   GET /api/bookings
// @access  Public
exports.getAllBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find()
    .sort({ createdAt: -1 })
    .populate({
      path: "driver",
      select: "driverName experience phoneNumber",
    })
    .populate({
      path: "car",
      select: "carName carNumber",
    });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

// @desc    Get booking by ID
// @route   GET /api/bookings/:id
// @access  Public
exports.getBookingById = asyncHandler(async (req, res) => {
  const booking = await bookingPopulate(Booking.findById(req.params.id));

  if (!booking) {
    return sendBookingNotFound(res);
  }

  if (!(await canAccessBooking(req.user, booking))) {
    // Use the same response as a missing record so booking identifiers do not
    // reveal whether another customer's booking exists.
    return sendBookingNotFound(res);
  }

  res.status(200).json({
    success: true,
    data: booking,
  });
});

// @desc    Update booking
// @route   PUT /api/bookings/:id
// @access  Public
exports.updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return sendBookingNotFound(res);
  }

  const requestedFields = Object.keys(req.body || {});
  const invalidFields = requestedFields.filter(
    (field) => !ADMIN_MUTABLE_BOOKING_FIELDS.has(field)
  );

  if (invalidFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: "One or more booking fields cannot be updated through this endpoint.",
      errors: invalidFields.map((field) => ({ field, message: "Field is protected." })),
    });
  }

  if (requestedFields.length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one mutable booking field is required.",
    });
  }

  for (const field of requestedFields) booking[field] = req.body[field];
  const scheduleChanged = requestedFields.some((field) => ["bookingDate", "pickupTime"].includes(field));
  if (scheduleChanged && (booking.driver || booking.car)) {
    try {
      await assertBookingResourcesAvailable(booking);
    } catch (error) {
      if (error instanceof BookingLifecycleError) return sendLifecycleError(res, error);
      throw error;
    }
  }
  const updatedBooking = await booking.save();

  res.status(200).json({
    success: true,
    message: "Booking updated successfully.",
    data: updatedBooking,
  });
});

// @desc    Delete booking
// @route   DELETE /api/bookings/:id
// @access  Public
exports.deleteBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return sendBookingNotFound(res);
  }

  await booking.deleteOne();

  res.status(200).json({
    success: true,
    message: "Booking deleted successfully.",
  });
});

// @desc    Assign driver and/or car to a booking
// @route   PUT /api/bookings/:id/assign
// @access  Admin
exports.assignBooking = asyncHandler(async (req, res) => {
  const payload = req.body || {};
  const allowedFields = ["driverId", "carId"];
  const invalidFields = Object.keys(payload).filter((field) => !allowedFields.includes(field));
  if (invalidFields.length > 0 || Object.keys(payload).length === 0) {
    return res.status(400).json({
      success: false,
      message: "Provide only driverId and/or carId for assignment.",
    });
  }

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found.",
    });
  }

  if (!["Pending", "Confirmed"].includes(booking.bookingStatus)) {
    return res.status(409).json({
      success: false,
      message: "Assignments can only be changed while a booking is Pending or Confirmed.",
    });
  }

  const hasDriverChange = Object.prototype.hasOwnProperty.call(payload, "driverId");
  const hasCarChange = Object.prototype.hasOwnProperty.call(payload, "carId");
  const oldDriverId = booking.driver;
  const oldCarId = booking.car;

  for (const [field, value] of [["driver", payload.driverId], ["car", payload.carId]]) {
    const supplied = field === "driver" ? hasDriverChange : hasCarChange;
    if (!supplied) continue;
    if (value !== null && !mongoose.Types.ObjectId.isValid(value)) {
      return res.status(400).json({ success: false, message: `Invalid ${field} id.` });
    }
    if (value === null && booking.bookingStatus !== "Pending") {
      return res.status(409).json({
        success: false,
        message: "Assigned resources can only be unassigned while a booking is Pending.",
      });
    }
    booking[field] = value;
  }

  try {
    await assertBookingResourcesAvailable(booking);
    if (booking.bookingStatus === "Pending" && booking.driver &&
      (booking.serviceType === "Driver Only" || booking.car)) {
      transitionBooking(booking, "Confirmed", req.user._id, "Required resources assigned");
    }
  } catch (error) {
    if (error instanceof BookingLifecycleError) return sendLifecycleError(res, error);
    throw error;
  }

  await booking.save();

  await releaseResourceIfFree("driver", oldDriverId);
  await releaseResourceIfFree("car", oldCarId);
  await refreshResourceAvailability(booking);

  // Sync assigned driver to the linked payment (do not create new payment)
  // Payment is created/linked at booking creation time via booking.payment
  if (booking.payment) {
    await Payment.findByIdAndUpdate(booking.payment, {
      driverId: booking.driver || null,
    });
  }

  // Populate references for the response
  const populatedBooking = await Booking.findById(booking._id)
    .populate({
      path: "driver",
      select: "driverName experience phoneNumber",
    })
    .populate({
      path: "car",
      select: "carName carNumber",
    });

  res.status(200).json({
    success: true,
    message: "Driver and/or car assigned successfully.",
    data: populatedBooking,
  });
});

// @desc    Cancel a customer's own pending or confirmed booking
// @route   POST /api/v1/bookings/:id/cancel
// @access  Customer
exports.cancelCustomerBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findOne({ _id: req.params.id, customer: req.user._id });
  if (!booking) return sendBookingNotFound(res);

  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "Cancelled by customer";
  if (reason.length > 500) {
    return res.status(400).json({ success: false, message: "Cancellation reason cannot exceed 500 characters." });
  }

  try {
    transitionBooking(booking, "Cancelled", req.user._id, reason || "Cancelled by customer");
  } catch (error) {
    if (error instanceof BookingLifecycleError) return sendLifecycleError(res, error);
    throw error;
  }

  await booking.save();
  await refreshResourceAvailability(booking);

  res.status(200).json({
    success: true,
    message: "Booking cancelled successfully.",
    data: booking,
  });
});

/**
 * Missing exports referenced by server/src/routes/bookingRoutes.js
 * Keep existing Booking APIs working; these are thin wrappers/aliases.
 */

// Legacy/admin "GET /api/v1/bookings" route handler (kept for backward compatibility)
exports.getBookings = exports.getAllBookings;

// Customer "GET /api/v1/bookings/customer"
exports.getCustomerBookings = asyncHandler(async (req, res) => {
  const customerId = req.user?._id;

  if (!customerId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  const bookings = await Booking.find({ customer: customerId })
    .sort({ createdAt: -1 })
    .populate({
      path: "driver",
      select: "driverName experience phoneNumber",
    })
    .populate({
      path: "car",
      select: "carName carNumber",
    });

  return res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

// Driver "GET /api/v1/bookings/driver"
exports.getDriverBookings = asyncHandler(async (req, res) => {
  const driver = await Driver.findOne({ user: req.user._id }).select("_id");
  if (!driver) {
    return res.status(403).json({
      success: false,
      message: "Driver account is not linked to a driver profile.",
    });
  }

  const bookings = await bookingPopulate(
    Booking.find({ driver: driver._id }).sort({ createdAt: -1 })
  );

  return res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

// Admin "PUT /api/v1/bookings/:id/assign" route handler
exports.assignDriver = exports.assignBooking;

// Admin "GET /api/v1/bookings/admin/stats"
exports.getBookingStats = asyncHandler(async (req, res) => {
  const stats = await Booking.aggregate([
    {
      $group: {
        _id: "$bookingStatus",
        count: { $sum: 1 },
        revenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    data: stats,
  });
});
