const User = require("../models/User");
const Driver = require("../models/Driver");
const EmailOtp = require("../models/EmailOtp");
const EmailOtpRequest = require("../models/EmailOtpRequest");
const generateToken = require("../utils/generateToken");
const generateResetToken = require("../utils/generateResetToken");
const asyncHandler = require("../utils/asyncHandler");
const { generateOtp, hashOtp, verifyOtp } = require("../utils/otp");
const { sendOtpEmail } = require("../services/emailService");

// ===============================
// Register User
// ===============================
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;

  // Check required fields
  if (!name || !email || !phone || !password) {
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "Email already registered",
    });
  }

  // Create unverified customer account
  const user = await User.create({
    name,
    email,
    phone,
    password,
    isVerified: false,
  });

  // Count the initial registration OTP request
  await EmailOtpRequest.create({
    email,
    purpose: "registration",
    requestedAt: new Date(),
  });

  // Generate a secure 6-digit OTP
  const otp = generateOtp();

  // Invalidate any previous registration OTP for this email
  await EmailOtp.deleteMany({
    email,
    purpose: "registration",
  });

  // Store only the hashed OTP
  await EmailOtp.create({
    email,
    otpHash: hashOtp(otp),
    purpose: "registration",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
    lastSentAt: new Date(),
  });

  // Send OTP through Resend
  try {
    await sendOtpEmail({
      to: email,
      otp,
      purpose: "registration",
    });
  } catch (error) {
    // Do not leave an unusable unverified account if email delivery fails
    await EmailOtp.deleteMany({
      email,
      purpose: "registration",
    });
    await User.findByIdAndDelete(user._id);
    throw error;
  }

  return res.status(201).json({
    success: true,
    message: "Registration successful. Please verify your email with the OTP sent to you.",
    requiresEmailVerification: true,
    email: user.email,
  });
});

// ===============================
// Resend Registration Email OTP
// ===============================
const resendEmailOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "Email is already verified",
    });
  }

  const latestOtp = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose: "registration",
  }).sort({ createdAt: -1 });

  // Enforce 60-second resend cooldown
  if (latestOtp?.lastSentAt) {
    const elapsedSeconds =
      (Date.now() - latestOtp.lastSentAt.getTime()) / 1000;

    if (elapsedSeconds < 60) {
      const retryAfter = Math.ceil(60 - elapsedSeconds);

      return res.status(429).json({
        success: false,
        message: `Please wait ${retryAfter} second(s) before requesting another OTP.`,
        retryAfter,
      });
    }
  }

  // Count OTP requests made within the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const requestCount = await EmailOtpRequest.countDocuments({
    email: normalizedEmail,
    purpose: "registration",
    requestedAt: { $gte: oneHourAgo },
  });

  if (requestCount >= 5) {
    return res.status(429).json({
      success: false,
      message:
        "Maximum OTP requests exceeded. Please try again after one hour.",
    });
  }

  // Generate a new secure OTP
  const otp = generateOtp();

  // Invalidate the previous OTP
  await EmailOtp.deleteMany({
    email: normalizedEmail,
    purpose: "registration",
  });

  // Store only the hashed OTP
  await EmailOtp.create({
    email: normalizedEmail,
    otpHash: hashOtp(otp),
    purpose: "registration",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
    lastSentAt: new Date(),
  });

  // Record this OTP request for hourly rate limiting
  await EmailOtpRequest.create({
    email: normalizedEmail,
    purpose: "registration",
    requestedAt: new Date(),
  });

  try {
    await sendOtpEmail({
      to: normalizedEmail,
      otp,
      purpose: "registration",
    });
  } catch (error) {
    // Remove the newly generated OTP if delivery fails
    await EmailOtp.deleteMany({
      email: normalizedEmail,
      purpose: "registration",
    });

    throw error;
  }

  return res.status(200).json({
    success: true,
    message: "A new OTP has been sent to your email.",
    requiresEmailVerification: true,
    email: normalizedEmail,
  });
});

// ===============================
// Verify Registration Email OTP
// ===============================
const verifyEmailOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: "OTP must be a 6-digit number",
    });
  }

  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  if (user.isVerified) {
    return res.status(400).json({
      success: false,
      message: "Email is already verified",
    });
  }

  const otpRecord = await EmailOtp.findOne({
    email,
    purpose: "registration",
  });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "OTP is invalid or has expired. Please request a new OTP.",
    });
  }

  if (otpRecord.expiresAt <= new Date()) {
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    return res.status(400).json({
      success: false,
      message: "OTP has expired. Please request a new OTP.",
    });
  }

  if (otpRecord.attempts >= 5) {
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    return res.status(429).json({
      success: false,
      message: "Maximum OTP verification attempts exceeded. Please request a new OTP.",
    });
  }

  const { verifyOtp } = require("../utils/otp");
  const isValid = verifyOtp(otp, otpRecord.otpHash);

  if (!isValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    const attemptsRemaining = Math.max(0, 5 - otpRecord.attempts);

    return res.status(400).json({
      success: false,
      message:
        attemptsRemaining > 0
          ? `Invalid OTP. ${attemptsRemaining} attempt(s) remaining.`
          : "Invalid OTP. Maximum attempts exceeded. Please request a new OTP.",
    });
  }

  user.isVerified = true;
  await user.save();

  await EmailOtp.deleteOne({ _id: otpRecord._id });

  const token = generateToken(user._id, user.role);

  return res.status(200).json({
    success: true,
    message: "Email verified successfully",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// ===============================
// Forgot Password - Customer Only
// ===============================
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: "Email is required",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    role: "customer",
  });

  // Do not reveal whether the email belongs to a customer account.
  if (!user) {
    return res.status(200).json({
      success: true,
      message: "If a customer account exists for this email, a password reset OTP has been sent.",
    });
  }

  if (user.status !== "active") {
    return res.status(200).json({
      success: true,
      message: "If a customer account exists for this email, a password reset OTP has been sent.",
    });
  }

  const latestOtp = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose: "password_reset",
  }).sort({ createdAt: -1 });

  // Enforce 60-second resend cooldown.
  if (latestOtp?.lastSentAt) {
    const elapsedSeconds =
      (Date.now() - latestOtp.lastSentAt.getTime()) / 1000;

    if (elapsedSeconds < 60) {
      const retryAfter = Math.ceil(60 - elapsedSeconds);

      return res.status(429).json({
        success: false,
        message: `Please wait ${retryAfter} second(s) before requesting another OTP.`,
        retryAfter,
      });
    }
  }

  // Enforce maximum 5 password-reset OTP requests per hour.
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const requestCount = await EmailOtpRequest.countDocuments({
    email: normalizedEmail,
    purpose: "password_reset",
    requestedAt: { $gte: oneHourAgo },
  });

  if (requestCount >= 5) {
    return res.status(429).json({
      success: false,
      message:
        "Maximum OTP requests exceeded. Please try again after one hour.",
    });
  }

  const otp = generateOtp();

  // Invalidate any previous password-reset OTP.
  await EmailOtp.deleteMany({
    email: normalizedEmail,
    purpose: "password_reset",
  });

  await EmailOtp.create({
    email: normalizedEmail,
    otpHash: hashOtp(otp),
    purpose: "password_reset",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    attempts: 0,
    lastSentAt: new Date(),
  });

  await EmailOtpRequest.create({
    email: normalizedEmail,
    purpose: "password_reset",
    requestedAt: new Date(),
  });

  try {
    await sendOtpEmail({
      to: normalizedEmail,
      otp,
      purpose: "password_reset",
    });
  } catch (error) {
    await EmailOtp.deleteMany({
      email: normalizedEmail,
      purpose: "password_reset",
    });
    throw error;
  }

  return res.status(200).json({
    success: true,
    message: "If a customer account exists for this email, a password reset OTP has been sent.",
  });
});

// ===============================
// Verify Password Reset OTP
// ===============================
const verifyResetOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({
      success: false,
      message: "Email and OTP are required",
    });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).json({
      success: false,
      message: "OTP must be a 6-digit number",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    role: "customer",
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  const otpRecord = await EmailOtp.findOne({
    email: normalizedEmail,
    purpose: "password_reset",
  });

  if (!otpRecord) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired OTP",
    });
  }

  if (otpRecord.expiresAt <= new Date()) {
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    return res.status(400).json({
      success: false,
      message: "OTP has expired. Please request a new OTP.",
    });
  }

  if (otpRecord.attempts >= 5) {
    await EmailOtp.deleteOne({ _id: otpRecord._id });

    return res.status(429).json({
      success: false,
      message:
        "Maximum OTP verification attempts exceeded. Please request a new OTP.",
    });
  }

  const isValid = verifyOtp(otp, otpRecord.otpHash);

  if (!isValid) {
    otpRecord.attempts += 1;
    await otpRecord.save();

    const attemptsRemaining = Math.max(0, 5 - otpRecord.attempts);

    return res.status(400).json({
      success: false,
      message:
        attemptsRemaining > 0
          ? `Invalid OTP. ${attemptsRemaining} attempt(s) remaining.`
          : "Invalid OTP. Maximum attempts exceeded. Please request a new OTP.",
    });
  }

  await EmailOtp.deleteOne({ _id: otpRecord._id });

  const resetToken = generateResetToken(user._id);

  return res.status(200).json({
    success: true,
    message: "OTP verified successfully",
    resetToken,
  });
});

// ===============================
// Reset Customer Password
// ===============================
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Reset token and new password are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters long",
    });
  }

  let decoded;

  try {
    const jwt = require("jsonwebtoken");

    decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Reset token is invalid or expired",
    });
  }

  if (decoded.purpose !== "password_reset") {
    return res.status(401).json({
      success: false,
      message: "Invalid password reset token",
    });
  }

  const user = await User.findOne({
    _id: decoded.id,
    role: "customer",
  }).select("+password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "Customer account not found",
    });
  }

  if (user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Your account is not active. Please contact support.",
    });
  }

  user.password = newPassword;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password reset successfully. Please log in with your new password.",
  });
});

// ===============================
// Login User
// ===============================
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check required fields
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  // Find user (password is hidden by default)
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }
  if (user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "Your account is not active. Please contact support.",
    });
  }

  // Customer accounts must verify their email before login
  if (user.role === "customer" && !user.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before logging in.",
      requiresEmailVerification: true,
      email: user.email,
    });
  }

  // A driver role alone is not sufficient: it must map to a managed driver
  // profile. This removes the former phone-number based identity binding.
  if (user.role === "driver") {
    const driverProfiles = await Driver.find({ user: user._id }).select("_id").limit(2);
    if (driverProfiles.length !== 1) {
      return res.status(403).json({
        success: false,
        message: "Driver account is not linked to exactly one driver profile.",
      });
    }
  }

  // Compare password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  }

  // Generate Token
  const token = generateToken(user._id, user.role);

  return res.status(200).json({
    success: true,
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
    },
  });
});

// ===============================
// Get Profile
// ===============================
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const driverProfile = user.role === "driver"
    ? await Driver.findOne({ user: user._id }).select("_id")
    : null;

  return res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      driverId: driverProfile?._id || null,
    },
  });
});

// ===============================
// Update Profile
// ===============================
const updateProfile = asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  // At least one field required
  if (!name && !email && !phone) {
    return res.status(400).json({
      success: false,
      message: "At least one field (name, email, phone) is required to update",
    });
  }

  // Check for duplicate email if email is being changed
  if (email) {
    const existingUser = await User.findOne({
      email,
      _id: { $ne: req.user._id },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already in use by another account",
      });
    }
  }

  // Build update object with only provided fields
  const updateFields = {};
  if (name) updateFields.name = name;
  if (email) updateFields.email = email;
  if (phone) updateFields.phone = phone;

  const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
    new: true,
    runValidators: true,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isVerified: user.isVerified,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
});

// ===============================
// Change Password
// ===============================
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Validate inputs
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "Current password and new password are required",
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 6 characters long",
    });
  }

  // Get user with password field
  const user = await User.findById(req.user._id).select("+password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Current password is incorrect",
    });
  }

  // Set new password (pre-save hook will hash it)
  user.password = newPassword;
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password changed successfully",
  });
});

module.exports = {
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
};
