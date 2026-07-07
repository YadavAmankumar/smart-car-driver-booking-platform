const express = require("express");

const {
  createBooking,
  getBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
  assignDriver,
  getCustomerBookings,
  getAllBookings,
  getBookingStats,
} = require("../controllers/bookingController");


const authMiddleware = require("../middleware/auth/authMiddleware");
const authorizeRoles = require("../middleware/auth/authorizeRoles");

const router = express.Router();

// ===============================
// Customer Routes
// ===============================

// Create booking
router.post(
  "/",
  authMiddleware,
  authorizeRoles("customer"),
  createBooking
);

// Get logged-in customer's bookings
router.get(
  "/customer",
  authMiddleware,
  authorizeRoles("customer"),
  getCustomerBookings
);

// ===============================
// Admin Routes
// ===============================

// Get all bookings
router.get(
  "/admin",
  authMiddleware,
  authorizeRoles("admin"),
  getAllBookings
);

// Booking statistics
router.get(
  "/admin/stats",
  authMiddleware,
  authorizeRoles("admin"),
  getBookingStats
);

// Legacy route (if you still use it)
router.get(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  getBookings
);

// Assign driver
router.put(
  "/:id/assign",
  authMiddleware,
  authorizeRoles("admin"),
  assignDriver
);

// Update booking
router.put(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  updateBooking
);

// Delete booking
router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  deleteBooking
);

// ===============================
// Dynamic Route (KEEP LAST)
// ===============================
router.get(
  "/:id",
  authMiddleware,
  getBookingById
);

module.exports = router;