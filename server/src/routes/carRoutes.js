const express = require("express");
const authMiddleware = require("../middleware/auth/authMiddleware");
const authorizeRoles = require("../middleware/auth/authorizeRoles");

const {
  addCar,
  getAllCars,
  getCarById,
  updateCar,
  deleteCar,
} = require("../controllers/carController");

const router = express.Router();

// Create Car
router.post("/", authMiddleware, authorizeRoles("admin"), addCar);

// Get All Cars
router.get("/", authMiddleware, authorizeRoles("admin"), getAllCars);

// Get Car By ID
router.get("/:id", authMiddleware, authorizeRoles("admin"), getCarById);

// Update Car
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateCar);

// Delete Car
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteCar);

module.exports = router;
