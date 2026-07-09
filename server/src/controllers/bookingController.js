const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const asyncHandler = require("../utils/asyncHandler");
const pricingService = require("../services/pricingService");

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

  const booking = await Booking.create({
    customerName,
    mobileNumber,
    customer: req.user?._id || null,
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

    // Pricing engine outputs
    pricingSnapshot: fareResult.pricingSnapshot,

    baseFare: fareResult.baseFare,
    ratePerKm: fareResult.ratePerKm,
    hourlyRate: fareResult.hourlyRate,

    gst: fareResult.gst,
    airportCharge: fareResult.airportCharge,
    waitingCharge: fareResult.waitingCharge,
    nightCharge: fareResult.nightCharge,
    weekendCharge: fareResult.weekendCharge,
    minimumFare: fareResult.minimumFare,

    distanceKm: fareResult.distanceKm,
    estimatedDuration: fareResult.estimatedDuration,

    distanceCharge: fareResult.distanceCharge,

    estimatedFare: fareResult.estimatedFare,

    // Backward compatibility fields
    rate: fareResult.baseFare,
    totalAmount: fareResult.estimatedFare,
  });

  // Create initial (Pending) payment and link it to the booking
  const payment = await Payment.create({
    bookingId: booking._id,
    customerId: req.user?._id || null,
    driverId: booking.driver || null,
    amount: booking.totalAmount,
    paymentMethod: booking.paymentMethod,
    paymentStatus: "Pending",
  });

  booking.payment = payment._id;
  await booking.save();

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
  const bookings = await Booking.find().sort({ createdAt: -1 });

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
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found.",
    });
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
    return res.status(404).json({
      success: false,
      message: "Booking not found.",
    });
  }

  const updatedBooking = await Booking.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

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
    return res.status(404).json({
      success: false,
      message: "Booking not found.",
    });
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
  const { driverId, carId } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found.",
    });
  }

  if (driverId) {
    booking.driver = driverId;
  }

  if (carId) {
    booking.car = carId;
  }

  // Auto-confirm if still pending
  if (booking.bookingStatus === "Pending") {
    booking.bookingStatus = "Confirmed";
  }

  await booking.save();

  // Sync assigned driver to the linked payment (do not create new payment)
  // Payment is created/linked at booking creation time via booking.payment
  if (booking.payment) {
    await Payment.findByIdAndUpdate(booking.payment, {
      driverId: booking.driver || null,
    });
  }

  // Populate references for the response
  const populatedBooking = await Booking.findById(booking._id)
    .populate("driver")
    .populate("car");

  res.status(200).json({
    success: true,
    message: "Driver and/or car assigned successfully.",
    data: populatedBooking,
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

  const bookings = await Booking.find({ customer: customerId }).sort({ createdAt: -1 });

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

