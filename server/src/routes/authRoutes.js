const express = require("express");
const authMiddleware = require("../middleware/auth/authMiddleware");

const router = express.Router();

const {
  registerUser,
  verifyEmailOtp,
  resendEmailOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/authController");

// ===============================
// Public Routes
// ===============================

// Register
router.post("/register", registerUser);

// Verify registration email OTP
router.post("/verify-email-otp", verifyEmailOtp);

// Resend registration email OTP
router.post("/resend-email-otp", resendEmailOtp);

// Forgot password
router.post("/forgot-password", forgotPassword);

// Verify password reset OTP
router.post("/verify-reset-otp", verifyResetOtp);

// Reset customer password
router.post("/reset-password", resetPassword);

// Login
router.post("/login", loginUser);

// ===============================
// Protected Routes
// ===============================

// Get Profile
router.get("/profile", authMiddleware, getProfile);

// Update Profile
router.put("/profile", authMiddleware, updateProfile);

// Change Password
router.put("/change-password", authMiddleware, changePassword);

module.exports = router;