const mongoose = require("mongoose");

const Booking = require("../models/Booking");
const Driver = require("../models/Driver");
const Car = require("../models/Car");
const User = require("../models/User");

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

const customerObjectId = (id, res) => {
  if (mongoose.Types.ObjectId.isValid(id)) return true;
  res.status(400).json({ success: false, message: "Invalid customer id." });
  return false;
};

exports.getAdminCustomers = asyncHandler(async (req, res) => {
  const { search = "", status = "all", sort = "newest", page = 1, limit = 10 } = req.query;
  const filter = { role: "customer" };
  if (["active", "blocked"].includes(status)) filter.status = status;
  if (String(search).trim()) {
    const query = new RegExp(escapeRegex(String(search).trim()), "i");
    filter.$or = [{ name: query }, { email: query }, { phone: query }];
  }
  const sortMap = { newest: { createdAt: -1 }, oldest: { createdAt: 1 }, name: { name: 1 }, bookings: { bookingCount: -1 } };
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);
  const [result] = await User.aggregate([
    { $match: filter },
    { $lookup: { from: "bookings", localField: "_id", foreignField: "customer", as: "bookings" } },
    { $addFields: { bookingCount: { $size: "$bookings" } } },
    { $project: { password: 0, bookings: 0 } },
    { $facet: { data: [{ $sort: sortMap[sort] || sortMap.newest }, { $skip: (safePage - 1) * safeLimit }, { $limit: safeLimit }], total: [{ $count: "count" }] } },
  ]);
  const [totalCustomers, activeCustomers, blockedCustomers, newCustomersThisMonth] = await Promise.all([
    User.countDocuments({ role: "customer" }), User.countDocuments({ role: "customer", status: "active" }), User.countDocuments({ role: "customer", status: "blocked" }), User.countDocuments({ role: "customer", createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } }),
  ]);
  res.json({ success: true, data: result.data, count: result.total[0]?.count || 0, page: safePage, limit: safeLimit, summary: { totalCustomers, activeCustomers, blockedCustomers, newCustomersThisMonth } });
});

exports.getAdminCustomerById = asyncHandler(async (req, res) => {
  if (!customerObjectId(req.params.id, res)) return;
  const customer = await User.findOne({ _id: req.params.id, role: "customer" }).select("-password");
  if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
  const bookings = await Booking.find({ customer: customer._id }).sort({ createdAt: -1 }).select("serviceType bookingStatus totalAmount bookingDate createdAt");
  const totalAmountSpent = bookings.reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);
  res.json({ success: true, data: { ...customer.toObject(), bookingCount: bookings.length, totalAmountSpent, latestBooking: bookings[0] || null, bookings } });
});

exports.updateAdminCustomerStatus = asyncHandler(async (req, res) => {
  if (!customerObjectId(req.params.id, res)) return;
  const { status } = req.body;
  if (!["active", "blocked"].includes(status)) return res.status(400).json({ success: false, message: "Status must be active or blocked." });
  const customer = await User.findOneAndUpdate({ _id: req.params.id, role: "customer" }, { status }, { new: true, runValidators: true }).select("-password");
  if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
  res.json({ success: true, message: `Customer ${status === "blocked" ? "blocked" : "unblocked"} successfully.`, data: customer });
});

exports.deleteAdminCustomer = asyncHandler(async (req, res) => {
  if (!customerObjectId(req.params.id, res)) return;
  const customer = await User.findOneAndDelete({ _id: req.params.id, role: "customer" });
  if (!customer) return res.status(404).json({ success: false, message: "Customer not found." });
  res.json({ success: true, message: "Customer deleted successfully." });
});

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

