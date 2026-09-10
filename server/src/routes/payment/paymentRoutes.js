const express = require("express");

const authMiddleware = require("../../middleware/auth/authMiddleware");
const authorizeRoles = require("../../middleware/auth/authorizeRoles");

const {
  getDriverPayments,
  markCashCollected,
  confirmDriverOnlinePayment,
  submitUpiUtr,
  verifyUpiPayment,
  refundPayment,
  getPaymentConfig,
  getCustomerPayments,
  getPaymentByBooking,
  getAllPayments,
  getPaymentDetails,
  getPaymentStats,
  getRevenueReport,
} = require("../../controllers/payment/paymentController");

const router = express.Router();

router.get(
  "/config",
  authMiddleware,
  authorizeRoles("customer", "admin"),
  getPaymentConfig
);

// ===============================
// Driver routes
// ===============================
router.get(
  "/driver",
  authMiddleware,
  authorizeRoles("driver"),
  getDriverPayments
);

router.put(
  "/:id/cash-collected",
  authMiddleware,
  authorizeRoles("driver"),
  markCashCollected
);

router.put(
  "/:id/online-confirmed",
  authMiddleware,
  authorizeRoles("driver"),
  confirmDriverOnlinePayment
);

// ===============================
// Customer routes
// ===============================
router.post(
  "/customer/:bookingId/upi-utr",
  authMiddleware,
  authorizeRoles("customer"),
  submitUpiUtr
);

router.get(
  "/customer",
  authMiddleware,
  authorizeRoles("customer"),
  getCustomerPayments
);

router.get(
  "/customer/:bookingId",
  authMiddleware,
  authorizeRoles("customer"),
  getPaymentByBooking
);

// ===============================
// Admin routes
// ===============================
router.post(
  "/admin/:id/verify-upi",
  authMiddleware,
  authorizeRoles("admin"),
  verifyUpiPayment
);

router.post(
  "/admin/:id/refund",
  authMiddleware,
  authorizeRoles("admin"),
  refundPayment
);

router.get(
  "/admin",
  authMiddleware,
  authorizeRoles("admin"),
  getAllPayments
);

router.get(
  "/admin/stats",
  authMiddleware,
  authorizeRoles("admin"),
  getPaymentStats
);

router.get(
  "/admin/revenue",
  authMiddleware,
  authorizeRoles("admin"),
  getRevenueReport
);

router.get(
  "/admin/:id",
  authMiddleware,
  authorizeRoles("admin"),
  getPaymentDetails
);

module.exports = router;
