const express = require("express");
const authMiddleware = require("../middleware/auth/authMiddleware");

const {
  addCar,
  getAllCars,
  getCarById,
  updateCar,
  deleteCar,
} = require("../controllers/carController");

const router = express.Router();

// Create Car
router.post("/", authMiddleware, addCar);

// Get All Cars
router.get("/", authMiddleware, getAllCars);

// Get Car By ID
router.get("/:id", authMiddleware, getCarById);

// Update Car
router.put("/:id", authMiddleware, updateCar);

// Delete Car
router.delete("/:id", authMiddleware, deleteCar);

module.exports = router;

