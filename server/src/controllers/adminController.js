const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Driver = require("../models/Driver");
const Car = require("../models/Car");

const asyncHandler = require("../utils/asyncHandler");

const escapeRegex = (value) => {
  return String(value).replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
};

const ALLOWED_BOOKING_STATUSES = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
];

// @desc    Get Admin Dashboard Statistics
// @route   GET /api/v1/admin/dashboard
// @access  Admin
exports.getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalBookings,
    pendingBookings,
    confirmedBookings,
    completedBookings,
    cancelledBookings,
    totalDrivers,
    availableDrivers,
    totalCars,
    availableCars,
    todayBookings,
    totalRevenueResult,
  ] = await Promise.all([
    Booking.countDocuments(),
    Booking.countDocuments({ bookingStatus: "Pending" }),
    Booking.countDocuments({ bookingStatus: "Confirmed" }),
    Booking.countDocuments({ bookingStatus: "Completed" }),
    Booking.countDocuments({ bookingStatus: "Cancelled" }),
    Driver.countDocuments(),
    Driver.countDocuments({ status: "Available" }),
    Car.countDocuments(),
    Car.countDocuments({ isAvailable: true }),
    Booking.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
    Booking.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]),
  ]);

  const totalRevenue =
    totalRevenueResult && totalRevenueResult.length > 0
      ? totalRevenueResult[0].totalRevenue
      : 0;

  res.status(200).json({
    success: true,
    data: {
      totalBookings,
      pendingBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      totalDrivers,
      availableDrivers,
      totalCars,
      availableCars,
      todayBookings,
      totalRevenue,
    },
  });
});

// @desc    Admin - Get all bookings with filters
// @route   GET /api/v1/admin/bookings
// @access  Admin
exports.getAdminBookings = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  const filter = {};

  if (status && ALLOWED_BOOKING_STATUSES.includes(status)) {
    filter.bookingStatus = status;
  }

  if (search && String(search).trim().length > 0) {
    const searchValue = String(search).trim();

    // If user provides digits, match mobile number exactly.
    const isDigitsOnly = /^\d+$/.test(searchValue);

    const customerNameRegex = new RegExp(escapeRegex(searchValue), "i");

    // Booking schema mobileNumber is a string; allow exact match for digit searches,
    // otherwise do a case-insensitive partial match.
    const mobileNumberRegex = isDigitsOnly
      ? new RegExp(`^${escapeRegex(searchValue)}$`)
      : new RegExp(escapeRegex(searchValue), "i");

    filter.$or = [
      { customerName: customerNameRegex },
      { mobileNumber: mobileNumberRegex },
    ];
  }

  const bookings = await Booking.find(filter)
    .populate("driver")
    .populate("car")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: bookings.length,
    data: bookings,
  });
});

// @desc    Admin - Patch booking status
// @route   PATCH /api/v1/admin/bookings/:id/status
// @access  Admin
exports.patchAdminBookingStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { bookingStatus } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking id.",
      errors: [{ field: "id", message: "Invalid ObjectId" }],
    });
  }

  if (!bookingStatus || !ALLOWED_BOOKING_STATUSES.includes(bookingStatus)) {
    return res.status(400).json({
      success: false,
      message: "Invalid bookingStatus.",
      errors: [
        {
          field: "bookingStatus",
          message: `Allowed values: ${ALLOWED_BOOKING_STATUSES.join(", ")}`,
        },
      ],
    });
  }

  const booking = await Booking.findById(id);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Booking not found.",
    });
  }

  booking.bookingStatus = bookingStatus;
  await booking.save();

  const updatedBooking = await Booking.findById(id)
    .populate("driver")
    .populate("car");

  res.status(200).json({
    success: true,
    message: "Booking status updated successfully.",
    data: updatedBooking,
  });
});


