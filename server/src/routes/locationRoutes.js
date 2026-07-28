const express = require("express");
const authMiddleware = require("../middleware/auth/authMiddleware");
const { searchLocations, getDistance } = require("../controllers/locationController");
const router = express.Router();

router.get("/search", authMiddleware, searchLocations);
router.post("/distance", authMiddleware, getDistance);

module.exports = router;
