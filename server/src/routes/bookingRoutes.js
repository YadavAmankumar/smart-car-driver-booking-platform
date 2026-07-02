const express = require("express");
const authMiddleware = require("../middleware/auth/authMiddleware");
const bookingValidation = require("../middleware/bookingValidation");

const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookingController");

const router = express.Router();

// Create Booking
router.post("/", authMiddleware, bookingValidation, createBooking);

// Get All Bookings
router.get("/", authMiddleware, getAllBookings);

// Get Booking By ID
router.get("/:id", authMiddleware, getBookingById);

// Update Booking
router.put("/:id", authMiddleware, updateBooking);

// Delete Booking
router.delete("/:id", authMiddleware, deleteBooking);

module.exports = router;

