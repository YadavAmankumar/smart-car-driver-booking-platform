const express = require("express");

const authMiddleware = require("../../middleware/auth/authMiddleware");
const authorizeRoles = require("../../middleware/auth/authorizeRoles");

const {
  getDriverPayments,
  markCashCollected,
  approveOnlinePayment,
  getCustomerPayments,
  getPaymentByBooking,
  getAllPayments,
  getPaymentDetails,
  getPaymentStats,
  getRevenueReport,
} = require("../../controllers/payment/paymentController");

const router = express.Router();

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
  "/:id/approve",
  authMiddleware,
  authorizeRoles("driver"),
  approveOnlinePayment
);

// ===============================
// Customer routes
// ===============================
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

