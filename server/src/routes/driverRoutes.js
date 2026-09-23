const express = require("express");
const authMiddleware = require("../middleware/auth/authMiddleware");
const authorizeRoles = require("../middleware/auth/authorizeRoles");

const {
  addDriver,
  provisionDriverAccount,
  updateDriverAccountEmail,
  resetDriverAccountPassword,
  updateDriverAccountStatus,
  getAllDrivers,
  getDriverById,
  getMyDriverProfile,
  updateMyDriverProfile,
  getMyDriverDashboard,
  getMyDriverBookings,
  updateMyAvailability,
  startAssignedBooking,
  completeAssignedBooking,
  updateDriver,
  deleteDriver,
} = require("../controllers/driverController");

const router = express.Router();

// Add Driver
router.post("/", authMiddleware, authorizeRoles("admin"), addDriver);

// Provisioning is separate so the existing driver-profile creation workflow
// remains compatible while making account linking explicit.
router.post("/:id/account", authMiddleware, authorizeRoles("admin"), provisionDriverAccount);
router.patch("/:id/account/email", authMiddleware, authorizeRoles("admin"), updateDriverAccountEmail);
router.patch("/:id/account/password", authMiddleware, authorizeRoles("admin"), resetDriverAccountPassword);
router.patch("/:id/account/status", authMiddleware, authorizeRoles("admin"), updateDriverAccountStatus);

// Get All Drivers
router.get("/", authMiddleware, authorizeRoles("admin"), getAllDrivers);

// Driver self-service access never exposes another driver's profile.
router.get("/me", authMiddleware, authorizeRoles("driver"), getMyDriverProfile);
router.put("/me", authMiddleware, authorizeRoles("driver"), updateMyDriverProfile);
router.get("/me/dashboard", authMiddleware, authorizeRoles("driver"), getMyDriverDashboard);
router.get("/me/bookings", authMiddleware, authorizeRoles("driver"), getMyDriverBookings);
router.put("/me/availability", authMiddleware, authorizeRoles("driver"), updateMyAvailability);
router.post("/me/bookings/:id/start", authMiddleware, authorizeRoles("driver"), startAssignedBooking);
router.post("/me/bookings/:id/complete", authMiddleware, authorizeRoles("driver"), completeAssignedBooking);

// Get Driver By ID
router.get("/:id", authMiddleware, authorizeRoles("admin"), getDriverById);

// Update Driver
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateDriver);

// Delete Driver
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteDriver);

module.exports = router;
