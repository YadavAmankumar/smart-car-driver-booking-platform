const express = require("express");

const {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
} = require("../controllers/bookingController");

const router = express.Router();

// Create Booking
router.post("/", createBooking);

// Get All Bookings
router.get("/", getAllBookings);

// Get Booking By ID
router.get("/:id", getBookingById);

// Update Booking
router.put("/:id", updateBooking);

// Delete Booking
router.delete("/:id", deleteBooking);

module.exports = router;