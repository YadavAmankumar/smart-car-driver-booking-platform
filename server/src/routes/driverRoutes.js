const express = require("express");
const authMiddleware = require("../middleware/auth/authMiddleware");
const authorizeRoles = require("../middleware/auth/authorizeRoles");

const {
  addDriver,
  getAllDrivers,
  getDriverById,
  updateDriver,
  deleteDriver,
} = require("../controllers/driverController");

const router = express.Router();

// Add Driver
router.post("/", authMiddleware, authorizeRoles("admin"), addDriver);

// Get All Drivers
router.get("/", authMiddleware, getAllDrivers);

// Get Driver By ID
router.get("/:id", authMiddleware, getDriverById);

// Update Driver
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateDriver);

// Delete Driver
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteDriver);

module.exports = router;