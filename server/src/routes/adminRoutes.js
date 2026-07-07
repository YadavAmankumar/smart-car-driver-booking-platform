const express = require("express");
const {
  getDashboardStats,
  getAdminBookings,
  patchAdminBookingStatus,
} = require("../controllers/adminController");
const authMiddleware = require("../middleware/auth/authMiddleware");
const authorizeRoles = require("../middleware/auth/authorizeRoles");

const router = express.Router();

// Admin dashboard stats
router.get(
  "/dashboard",
  authMiddleware,
  authorizeRoles("admin"),
  getDashboardStats
);

// Admin - Booking Management
router.get(
  "/bookings",
  authMiddleware,
  authorizeRoles("admin"),
  getAdminBookings
);

router.patch(
  "/bookings/:id/status",
  authMiddleware,
  authorizeRoles("admin"),
  patchAdminBookingStatus
);

module.exports = router;


