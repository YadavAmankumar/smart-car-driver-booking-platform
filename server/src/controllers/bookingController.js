const Booking = require("../models/Booking");
const asyncHandler = require("../utils/asyncHandler");

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
  } = req.body;

  const booking = await Booking.create({

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

    // Pricing will be calculated later
    rate: 0,
    totalAmount: 0,
  });

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