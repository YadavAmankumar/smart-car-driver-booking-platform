const express = require("express");
const {
  getDashboardStats,
  getAdminBookings,
  patchAdminBookingStatus,
  getAdminCustomers, getAdminCustomerById, updateAdminCustomerStatus, deleteAdminCustomer,
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
router.get("/customers", authMiddleware, authorizeRoles("admin"), getAdminCustomers);
router.get("/customers/:id", authMiddleware, authorizeRoles("admin"), getAdminCustomerById);
router.patch("/customers/:id/status", authMiddleware, authorizeRoles("admin"), updateAdminCustomerStatus);
router.delete("/customers/:id", authMiddleware, authorizeRoles("admin"), deleteAdminCustomer);

module.exports = router;

