const mongoose = require("mongoose");

const Payment = require("../../models/Payment");
const Booking = require("../../models/Booking");
const Driver = require("../../models/Driver");
const asyncHandler = require("../../utils/asyncHandler");

const UTR_PATTERN = /^[A-Za-z0-9/-]{8,35}$/;

const findDriverByUser = (user) => Driver.findOne({ user: user._id });

const syncBookingPayment = (payment, status) =>
  Booking.findByIdAndUpdate(payment.bookingId, { paymentStatus: status });

const refreshPaymentAmount = async (payment) => {
  const booking = await Booking.findById(payment.bookingId).select("totalAmount customer driver bookingStatus");
  if (!booking) return null;
  payment.amount = booking.totalAmount;
  return booking;
};

const paymentPopulate = (query) => query
  .populate("bookingId")
  .populate("customerId", "name email phone")
  .populate("driverId", "driverName phoneNumber")
  .populate("verifiedBy", "name email driverName");

const sanitizeUtr = (value) => String(value || "").trim().toUpperCase();

const validatePaymentId = (id, res) => {
  if (mongoose.Types.ObjectId.isValid(id)) return true;
  res.status(400).json({
    success: false,
    message: "Invalid payment id.",
    errors: [{ field: "id", message: "Invalid ObjectId" }],
  });
  return false;
};

exports.getPaymentConfig = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      upiId: process.env.BUSINESS_UPI_ID || "",
      upiQrImageUrl: process.env.BUSINESS_UPI_QR_URL || "",
      payeeName: process.env.BUSINESS_UPI_PAYEE_NAME || "Smart Car Driver Booking",
    },
  });
});

exports.getDriverPayments = asyncHandler(async (req, res) => {
  const driver = await findDriverByUser(req.user);
  if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found." });

  const payments = await paymentPopulate(Payment.find({ driverId: driver._id })).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: payments.length, data: payments });
});

exports.markCashCollected = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validatePaymentId(id, res)) return;

  const driver = await findDriverByUser(req.user);
  if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found." });

  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found." });

  if (payment.paymentMethod !== "Cash") {
    return res.status(400).json({ success: false, message: "Only cash payments can be collected by a driver." });
  }
  if (!payment.driverId || !payment.driverId.equals(driver._id)) {
    return res.status(403).json({ success: false, message: "Only the assigned driver can verify this payment." });
  }
  if (payment.paymentStatus !== "Pending") {
    return res.status(409).json({ success: false, message: "This payment cannot be marked collected." });
  }

  const booking = await refreshPaymentAmount(payment);
  if (!booking || booking.bookingStatus !== "Completed" || !booking.driver?.equals(driver._id)) {
    return res.status(409).json({
      success: false,
      message: "Cash can only be collected by the assigned driver after a completed booking.",
    });
  }

  const now = new Date();
  payment.paymentStatus = "Paid";
  payment.verificationStatus = "Approved";
  payment.verifiedBy = driver._id;
  payment.verifiedByModel = "Driver";
  payment.verifiedType = "Cash Collection";
  payment.verifiedAt = now;
  payment.paidAt = now;
  await payment.save();
  await syncBookingPayment(payment, "Paid");

  const updatedPayment = await paymentPopulate(Payment.findById(id));
  res.status(200).json({
    success: true,
    message: "Cash collected successfully. Payment marked as paid.",
    data: updatedPayment,
  });
});
exports.confirmDriverOnlinePayment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!validatePaymentId(id, res)) return;

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

  if (payment.paymentMethod !== "UPI") {
    return res.status(400).json({
      success: false,
      message: "Only UPI payments can be confirmed as online payment.",
    });
  }

  if (!payment.driverId || !payment.driverId.equals(driver._id)) {
    return res.status(403).json({
      success: false,
      message: "Only the assigned driver can confirm this payment.",
    });
  }

  if (!["Pending", "Verification Pending"].includes(payment.paymentStatus)) {
    return res.status(409).json({
      success: false,
      message: "This UPI payment cannot be confirmed now.",
    });
  }

  const booking = await refreshPaymentAmount(payment);

  if (!booking) {
    return res.status(404).json({
      success: false,
      message: "Linked booking not found.",
    });
  }

  if (
    booking.bookingStatus !== "Completed" ||
    !booking.driver ||
    !booking.driver.equals(driver._id)
  ) {
    return res.status(409).json({
      success: false,
      message:
        "Online payment can only be confirmed by the assigned driver after a completed booking.",
    });
  }

  const now = new Date();

  payment.amount = booking.totalAmount;
  payment.paymentStatus = "Paid";
  payment.verificationStatus = "Approved";
  payment.verifiedBy = driver._id;
  payment.verifiedByModel = "Driver";
  payment.verifiedType = "UPI Driver Confirmation";
  payment.verifiedAt = now;
  payment.paidAt = now;

  await payment.save();

  await syncBookingPayment(payment, "Paid");

  const updatedPayment = await paymentPopulate(Payment.findById(id));

  res.status(200).json({
    success: true,
    message: "Online payment confirmed successfully. Payment marked as paid.",
    data: updatedPayment,
  });
});

exports.submitUpiUtr = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ success: false, message: "Invalid booking id." });
  }

  const transactionId = sanitizeUtr(req.body?.transactionId || req.body?.utr);
  if (!UTR_PATTERN.test(transactionId)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid UPI transaction ID/UTR.",
      errors: [{ field: "transactionId", message: "UTR must be 8-35 letters, numbers, slash, or hyphen characters." }],
    });
  }

  const [booking, payment] = await Promise.all([
    Booking.findOne({ _id: bookingId, customer: req.user._id }),
    Payment.findOne({ bookingId, customerId: req.user._id }),
  ]);

  if (!booking || !payment) {
    return res.status(404).json({ success: false, message: "Payment not found for this booking." });
  }
  if (booking.bookingStatus === "Cancelled") {
    return res.status(409).json({ success: false, message: "Cancelled bookings cannot accept payment updates." });
  }
  if (payment.paymentMethod !== "UPI") {
    return res.status(400).json({ success: false, message: "This booking does not use UPI payment." });
  }
  if (!["Pending", "Rejected"].includes(payment.paymentStatus)) {
    return res.status(409).json({ success: false, message: "UPI transaction details cannot be changed now." });
  }

  const duplicate = await Payment.findOne({ _id: { $ne: payment._id }, transactionId }).select("_id");
  if (duplicate) {
    return res.status(409).json({ success: false, message: "This UPI transaction ID has already been submitted." });
  }

  payment.amount = booking.totalAmount;
  payment.transactionId = transactionId;
  payment.paymentStatus = "Verification Pending";
  payment.verificationStatus = "Pending";
  payment.verifiedBy = null;
  payment.verifiedByModel = "";
  payment.verifiedType = "";
  payment.verifiedAt = null;
  await payment.save();
  await syncBookingPayment(payment, "Verification Pending");

  res.status(202).json({
    success: true,
    message: "UPI transaction submitted for admin verification.",
    data: payment,
  });
});

exports.verifyUpiPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validatePaymentId(id, res)) return;

  const action = String(req.body?.action || "").trim().toLowerCase();
  const remarks = String(req.body?.remarks || "").trim();
  if (!["approve", "reject"].includes(action)) {
    return res.status(400).json({ success: false, message: "Action must be approve or reject." });
  }

  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found." });
  if (payment.paymentMethod !== "UPI") {
    return res.status(400).json({ success: false, message: "Only UPI payments require manual verification." });
  }
  if (payment.paymentStatus !== "Verification Pending" || payment.verificationStatus !== "Pending") {
    return res.status(409).json({ success: false, message: "This UPI payment is not awaiting verification." });
  }

  const booking = await refreshPaymentAmount(payment);
  if (!booking) return res.status(404).json({ success: false, message: "Linked booking not found." });

  const now = new Date();
  payment.verifiedBy = req.user._id;
  payment.verifiedByModel = "User";
  payment.verifiedType = "UPI Manual Verification";
  payment.verifiedAt = now;
  payment.remarks = remarks.slice(0, 500);

  if (action === "approve") {
    payment.paymentStatus = "Paid";
    payment.verificationStatus = "Approved";
    payment.paidAt = now;
  } else {
    payment.paymentStatus = "Rejected";
    payment.verificationStatus = "Rejected";
  }

  await payment.save();
  await syncBookingPayment(payment, payment.paymentStatus);

  const updatedPayment = await paymentPopulate(Payment.findById(id));
  res.status(200).json({
    success: true,
    message: action === "approve" ? "UPI payment approved." : "UPI payment rejected.",
    data: updatedPayment,
  });
});

exports.refundPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validatePaymentId(id, res)) return;

  const payment = await Payment.findById(id);
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found." });
  if (payment.paymentStatus !== "Paid") {
    return res.status(409).json({ success: false, message: "Only paid payments can be marked refunded." });
  }

  payment.paymentStatus = "Refunded";
  payment.refundedAt = new Date();
  payment.remarks = String(req.body?.remarks || payment.remarks || "").trim().slice(0, 500);
  await payment.save();
  await syncBookingPayment(payment, "Refunded");

  const updatedPayment = await paymentPopulate(Payment.findById(id));
  res.status(200).json({ success: true, message: "Payment marked as refunded.", data: updatedPayment });
});

exports.getCustomerPayments = asyncHandler(async (req, res) => {
  const payments = await paymentPopulate(Payment.find({ customerId: req.user._id })).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: payments.length, data: payments });
});

exports.getPaymentByBooking = asyncHandler(async (req, res) => {
  const { bookingId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid booking id.",
      errors: [{ field: "bookingId", message: "Invalid ObjectId" }],
    });
  }

  const payment = await paymentPopulate(Payment.findOne({ bookingId, customerId: req.user._id }));
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found for this booking." });

  res.status(200).json({ success: true, data: payment });
});

exports.getAllPayments = asyncHandler(async (req, res) => {
  const payments = await paymentPopulate(Payment.find()).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: payments.length, data: payments });
});

exports.getPaymentDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!validatePaymentId(id, res)) return;

  const payment = await paymentPopulate(Payment.findById(id));
  if (!payment) return res.status(404).json({ success: false, message: "Payment not found." });

  res.status(200).json({ success: true, data: payment });
});

exports.getPaymentStats = asyncHandler(async (req, res) => {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        pendingPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Pending"] }, 1, 0] } },
        verificationPendingPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Verification Pending"] }, 1, 0] } },
        paidPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, 1, 0] } },
        rejectedPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Rejected"] }, 1, 0] } },
        refundedPayments: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Refunded"] }, 1, 0] } },
        cashPayments: { $sum: { $cond: [{ $eq: ["$paymentMethod", "Cash"] }, 1, 0] } },
        upiPayments: { $sum: { $cond: [{ $eq: ["$paymentMethod", "UPI"] }, 1, 0] } },
      },
    },
  ]);

  const result = stats[0] || {};
  res.status(200).json({
    success: true,
    data: {
      totalPayments: result.totalPayments || 0,
      pendingPayments: result.pendingPayments || 0,
      verificationPendingPayments: result.verificationPendingPayments || 0,
      paidPayments: result.paidPayments || 0,
      rejectedPayments: result.rejectedPayments || 0,
      refundedPayments: result.refundedPayments || 0,
      cashPayments: result.cashPayments || 0,
      upiPayments: result.upiPayments || 0,
    },
  });
});

exports.getRevenueReport = asyncHandler(async (req, res) => {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const [todayRevenueResult, monthlyRevenueResult, paymentBreakdown] = await Promise.all([
    Payment.aggregate([
      { $match: { paymentStatus: "Paid", paidAt: { $gte: startOfToday, $lte: endOfToday } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      { $match: { paymentStatus: "Paid", paidAt: { $gte: startOfMonth, $lte: endOfMonth } } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]),
    Payment.aggregate([
      {
        $group: {
          _id: null,
          cashRevenue: {
            $sum: { $cond: [{ $and: [{ $eq: ["$paymentMethod", "Cash"] }, { $eq: ["$paymentStatus", "Paid"] }] }, "$amount", 0] },
          },
          upiRevenue: {
            $sum: { $cond: [{ $and: [{ $eq: ["$paymentMethod", "UPI"] }, { $eq: ["$paymentStatus", "Paid"] }] }, "$amount", 0] },
          },
          totalRevenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "Paid"] }, "$amount", 0] } },
          pendingAmount: {
            $sum: { $cond: [{ $in: ["$paymentStatus", ["Pending", "Verification Pending"]] }, "$amount", 0] },
          },
        },
      },
    ]),
  ]);

  const breakdown = paymentBreakdown[0] || {};
  res.status(200).json({
    success: true,
    data: {
      todayRevenue: todayRevenueResult[0]?.total || 0,
      monthlyRevenue: monthlyRevenueResult[0]?.total || 0,
      cashRevenue: breakdown.cashRevenue || 0,
      upiRevenue: breakdown.upiRevenue || 0,
      totalRevenue: breakdown.totalRevenue || 0,
      pendingAmount: breakdown.pendingAmount || 0,
    },
  });
});
