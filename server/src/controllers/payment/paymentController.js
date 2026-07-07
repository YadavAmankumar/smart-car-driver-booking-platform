const mongoose = require("mongoose");

const Payment = require("../../models/Payment");
const Booking = require("../../models/Booking");
const Driver = require("../../models/Driver");

const asyncHandler = require("../../utils/asyncHandler");

// ===============================
// Helper: Find Driver by User
// ===============================
const findDriverByUser = async (user) => {
  return await Driver.findOne({ phoneNumber: user.phone });
};

// ===============================
// Driver Payment APIs
// ===============================

// @desc    Get driver's assigned payments
// @route   GET /api/v1/payments/driver
// @access  Driver
exports.getDriverPayments = asyncHandler(async (req, res) => {
  const driver = await findDriverByUser(req.user);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: "Driver profile not found.",
    });
  }

  const payments = await Payment.find({ driverId: driver._id })
    .populate("bookingId")
    .populate("customerId", "name email phone")
    .populate("verifiedBy", "driverName")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
});

// @desc    Mark cash as collected
// @route   PUT /api/v1/payments/:id/cash-collected
// @access  Driver
exports.markCashCollected = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment id.",
      errors: [{ field: "id", message: "Invalid ObjectId" }],
    });
  }

  const driver = await findDriverByUser(req.user);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: "Driver profile not found.",
    });
  }

  const payment = await Payment.findById(id);

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found.",
    });
  }

  // Only assigned driver can verify
  if (payment.driverId.toString() !== driver._id.toString()) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only the assigned driver can verify this payment.",
    });
  }

  if (payment.paymentStatus === "Paid") {
    return res.status(400).json({
      success: false,
      message: "Payment is already marked as paid.",
    });
  }

  payment.paymentStatus = "Paid";
  payment.verifiedBy = driver._id;
  payment.verifiedType = "Cash Collection";
  payment.verifiedAt = new Date();
  await payment.save();

  // Sync payment status to booking
  await Booking.findByIdAndUpdate(payment.bookingId, {
    paymentStatus: "Paid",
  });

  const updatedPayment = await Payment.findById(id)
    .populate("bookingId")
    .populate("customerId", "name email phone")
    .populate("verifiedBy", "driverName");

  res.status(200).json({
    success: true,
    message: "Cash collected successfully. Payment marked as paid.",
    data: updatedPayment,
  });
});

// @desc    Approve online payment
// @route   PUT /api/v1/payments/:id/approve
// @access  Driver
exports.approveOnlinePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment id.",
      errors: [{ field: "id", message: "Invalid ObjectId" }],
    });
  }

  const driver = await findDriverByUser(req.user);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: "Driver profile not found.",
    });
  }

  const payment = await Payment.findById(id);

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found.",
    });
  }

  // Only assigned driver can verify
  if (payment.driverId.toString() !== driver._id.toString()) {
    return res.status(403).json({
      success: false,
      message:
        "Access denied. Only the assigned driver can verify this payment.",
    });
  }

  if (payment.paymentStatus === "Paid") {
    return res.status(400).json({
      success: false,
      message: "Payment is already marked as paid.",
    });
  }

  payment.paymentStatus = "Paid";
  payment.verifiedBy = driver._id;
  payment.verifiedType = "Online Verification";
  payment.verifiedAt = new Date();
  await payment.save();

  // Sync payment status to booking
  await Booking.findByIdAndUpdate(payment.bookingId, {
    paymentStatus: "Paid",
  });

  const updatedPayment = await Payment.findById(id)
    .populate("bookingId")
    .populate("customerId", "name email phone")
    .populate("verifiedBy", "driverName");

  res.status(200).json({
    success: true,
    message: "Online payment approved successfully. Payment marked as paid.",
    data: updatedPayment,
  });
});

// ===============================
// Customer Payment APIs
// ===============================

// @desc    Get customer's payment history
// @route   GET /api/v1/payments/customer
// @access  Customer
exports.getCustomerPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ customerId: req.user._id })
    .populate("bookingId")
    .populate("driverId", "driverName phoneNumber")
    .populate("verifiedBy", "driverName")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
});

// @desc    Get payment details for a booking
// @route   GET /api/v1/payments/customer/:bookingId
// @access  Customer
exports.getPaymentByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking id.",
      errors: [{ field: "bookingId", message: "Invalid ObjectId" }],
    });
  }

  const payment = await Payment.findOne({
    bookingId,
    customerId: req.user._id,
  })
    .populate("bookingId")
    .populate("driverId", "driverName phoneNumber")
    .populate("verifiedBy", "driverName");

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found for this booking.",
    });
  }

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// ===============================
// Admin Payment APIs
// ===============================

// @desc    Get all payments
// @route   GET /api/v1/payments/admin
// @access  Admin
exports.getAllPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find()
    .populate("bookingId")
    .populate("customerId", "name email phone")
    .populate("driverId", "driverName phoneNumber")
    .populate("verifiedBy", "driverName")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: payments.length,
    data: payments,
  });
});

// @desc    Get payment details by ID
// @route   GET /api/v1/payments/admin/:id
// @access  Admin
exports.getPaymentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: "Invalid payment id.",
      errors: [{ field: "id", message: "Invalid ObjectId" }],
    });
  }

  const payment = await Payment.findById(id)
    .populate("bookingId")
    .populate("customerId", "name email phone")
    .populate("driverId", "driverName phoneNumber")
    .populate("verifiedBy", "driverName");

  if (!payment) {
    return res.status(404).json({
      success: false,
      message: "Payment not found.",
    });
  }

  res.status(200).json({
    success: true,
    data: payment,
  });
});

// @desc    Get payment statistics
// @route   GET /api/v1/payments/admin/stats
// @access  Admin
exports.getPaymentStats = asyncHandler(async (req, res) => {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        pendingPayments: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "Pending"] }, 1, 0] },
        },
        paidPayments: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0] },
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "Failed"] }, 1, 0] },
        },
        refundedPayments: {
          $sum: { $cond: [{ $eq: ["$paymentStatus", "Refunded"] }, 1, 0] },
        },
        cashPayments: {
          $sum: { $cond: [{ $eq: ["$paymentMethod", "Cash"] }, 1, 0] },
        },
        onlinePayments: {
          $sum: { $cond: [{ $eq: ["$paymentMethod", "Online"] }, 1, 0] },
        },
      },
    },
  ]);

  const result = stats.length > 0 ? stats[0] : {};

  res.status(200).json({
    success: true,
    data: {
      totalPayments: result.totalPayments || 0,
      pendingPayments: result.pendingPayments || 0,
      paidPayments: result.paidPayments || 0,
      failedPayments: result.failedPayments || 0,
      refundedPayments: result.refundedPayments || 0,
      cashPayments: result.cashPayments || 0,
      onlinePayments: result.onlinePayments || 0,
    },
  });
});

// @desc    Get revenue report
// @route   GET /api/v1/payments/admin/revenue
// @access  Admin
exports.getRevenueReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now.setHours(0, 0, 0, 0));
  const endOfToday = new Date(now.setHours(23, 59, 59, 999));

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [todayRevenueResult, monthlyRevenueResult, paymentBreakdown] =
    await Promise.all([
      // Today's revenue
      Payment.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            verifiedAt: { $gte: startOfToday, $lte: endOfToday },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      // Monthly revenue
      Payment.aggregate([
        {
          $match: {
            paymentStatus: "Paid",
            verifiedAt: { $gte: startOfMonth, $lte: endOfMonth },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]),

      // Revenue by payment method and pending amount
      Payment.aggregate([
        {
          $group: {
            _id: null,
            cashRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$paymentMethod", "Cash"] },
                      { $eq: ["$paymentStatus", "Paid"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
            onlineRevenue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $eq: ["$paymentMethod", "Online"] },
                      { $eq: ["$paymentStatus", "Paid"] },
                    ],
                  },
                  "$amount",
                  0,
                ],
              },
            },
            totalRevenue: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$amount", 0],
              },
            },
            pendingAmount: {
              $sum: {
                $cond: [{ $eq: ["$paymentStatus", "Pending"] }, "$amount", 0],
              },
            },
          },
        },
      ]),
    ]);

  const todayRevenue =
    todayRevenueResult.length > 0 ? todayRevenueResult[0].total : 0;
  const monthlyRevenue =
    monthlyRevenueResult.length > 0 ? monthlyRevenueResult[0].total : 0;
  const breakdown =
    paymentBreakdown.length > 0 ? paymentBreakdown[0] : {};

  res.status(200).json({
    success: true,
    data: {
      todayRevenue,
      monthlyRevenue,
      cashRevenue: breakdown.cashRevenue || 0,
      onlineRevenue: breakdown.onlineRevenue || 0,
      totalRevenue: breakdown.totalRevenue || 0,
      pendingAmount: breakdown.pendingAmount || 0,
    },
  });
});