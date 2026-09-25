const express = require("express");
const authMiddleware = require("../middleware/auth/authMiddleware");
const authorizeRoles = require("../middleware/auth/authorizeRoles");
const uploadCarImage = require("../middleware/uploadCarImage");

const {
  addCar,
  getAllCars,
  getCarById,
  updateCar,
  deleteCar,
  uploadCarImage: uploadCarImageController,
  deleteCarImage: deleteCarImageController,
} = require("../controllers/carController");

const router = express.Router();

// Create Car
router.post("/", authMiddleware, authorizeRoles("admin"), addCar);

// Get All Cars
router.get("/", authMiddleware, authorizeRoles("admin"), getAllCars);

// Upload / Replace Car Image
router.post(
  "/:id/image",
  authMiddleware,
  authorizeRoles("admin"),
  uploadCarImage.single("carImage"),
  uploadCarImageController
);

// Get Car By ID
router.delete(
  "/:id/image",
  authMiddleware,
  authorizeRoles("admin"),
  deleteCarImageController
);

router.get("/:id", authMiddleware, authorizeRoles("admin"), getCarById);

// Update Car
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateCar);

// Delete Car
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteCar);

module.exports = router;
