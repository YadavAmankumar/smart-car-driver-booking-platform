const Booking = require("../models/Booking");
const Driver = require("../models/Driver");
const Car = require("../models/Car");

const asyncHandler = require("../utils/asyncHandler");

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

