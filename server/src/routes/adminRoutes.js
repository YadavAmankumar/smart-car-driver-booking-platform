const express = require("express");
const { getDashboardStats } = require("../controllers/adminController");
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

module.exports = router;

