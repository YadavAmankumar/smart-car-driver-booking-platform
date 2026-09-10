const Driver = require("../models/Driver");
const User = require("../models/User");
const Booking = require("../models/Booking");
const Payment = require("../models/Payment");
const asyncHandler = require("../utils/asyncHandler");
const validator = require("validator");
const mongoose = require("mongoose");
const {
  BookingLifecycleError,
  refreshResourceAvailability,
  transitionBooking,
} = require("../services/bookingLifecycleService");

const DRIVER_FIELDS = [
  "driverName",
  "phoneNumber",
  "experience",
  "status",
  "email",
  "password",
  "confirmPassword",
  "createAccount",
];
const PASSWORD_MIN_LENGTH = 8;

const driverResponse = (driver, { includeAccount = false } = {}) => {
  const data = {
    id: driver._id,
    driverName: driver.driverName,
    phoneNumber: driver.phoneNumber,
    experience: driver.experience,
    status: driver.status,
    accountProvisioned: Boolean(driver.user),
    createdAt: driver.createdAt,
    updatedAt: driver.updatedAt,
  };

  if (includeAccount && driver.user && typeof driver.user === "object") {
    data.account = {
      id: driver.user._id,
      email: driver.user.email,
      status: driver.user.status,
    };
  }
  return data;
};

const validatePasswordStrength = (password) => {
  const value = String(password || "");
  if (value.length < PASSWORD_MIN_LENGTH) return "Password must be at least 8 characters.";
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value) || !/\d/.test(value)) {
    return "Password must include uppercase, lowercase, and number characters.";
  }
  return null;
};

const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

const releasedDriverEmail = (userId) => `released-driver-${userId}@deleted.smartcar.invalid`;

const releaseDriverUserEmail = async (userOrId) => {
  const user = typeof userOrId === "object" && userOrId?._id
    ? userOrId
    : await User.findById(userOrId);

  if (!user || user.role !== "driver") return null;

  const releasedEmail = releasedDriverEmail(user._id);
  user.email = releasedEmail;
  user.status = "inactive";
  await user.save();
  return user;
};

const validatePasswordPair = (body = {}) => {
  const password = String(body.password || "");
  const confirmPassword = String(body.confirmPassword || "");
  if (!password || !confirmPassword) return { error: "Password and confirm password are required." };
  if (password !== confirmPassword) return { error: "Password and confirm password do not match." };
  const strengthError = validatePasswordStrength(password);
  if (strengthError) return { error: strengthError };
  return { password };
};

const assertEmailAvailable = async (email, userId = null) => {
  const existingUser = await User.findOne({
    email,
    ...(userId ? { _id: { $ne: userId } } : {}),
  });
  if (!existingUser) return { available: true };

  if (existingUser.role === "driver") {
    const linkedDriver = await Driver.findOne({ user: existingUser._id }).select("isDeleted deletedAt driverName");
    if (!linkedDriver || linkedDriver.isDeleted) {
      await releaseDriverUserEmail(existingUser);
      return { available: true };
    }
  }

  return { available: false, message: "Email is already registered." };
};

const getDriverReferenceSummary = async (driverId, userId = null) => {
  const [bookingCount, paymentCount, userAuditBookingCount, userVerifiedPaymentCount] = await Promise.all([
    Booking.countDocuments({ driver: driverId }),
    Payment.countDocuments({ driverId }),
    userId
      ? Booking.countDocuments({
          $or: [
            { cancelledBy: userId },
            { "statusHistory.changedBy": userId },
          ],
        })
      : 0,
    userId ? Payment.countDocuments({ verifiedBy: userId, verifiedByModel: "User" }) : 0,
  ]);

  return {
    bookingCount,
    paymentCount,
    userAuditBookingCount,
    userVerifiedPaymentCount,
    hasReferences: bookingCount + paymentCount + userAuditBookingCount + userVerifiedPaymentCount > 0,
  };
};

const getDriverPayload = (body = {}) => {
  const invalidFields = Object.keys(body).filter((field) => !DRIVER_FIELDS.includes(field));
  if (invalidFields.length > 0) return { error: `Unsupported driver fields: ${invalidFields.join(", ")}.` };

  const payload = {};
  if (body.driverName !== undefined) payload.driverName = String(body.driverName).trim();
  if (body.phoneNumber !== undefined) payload.phoneNumber = String(body.phoneNumber).trim();
  if (body.experience !== undefined) {
    if (!Number.isFinite(body.experience) || body.experience < 0) {
      return { error: "Experience must be a non-negative number." };
    }
    payload.experience = body.experience;
  }
  if (body.status !== undefined) {
    if (!["Available", "Busy"].includes(body.status)) return { error: "Status must be Available or Busy." };
    payload.status = body.status;
  }
  return { payload };
};

const sendValidationError = (res, message) => res.status(400).json({ success: false, message });
const hasValidDriverId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateDriverPayload = (payload) => {
  if (payload.driverName !== undefined && payload.driverName.length < 2) return "Driver name must be at least 2 characters.";
  if (payload.phoneNumber !== undefined && !/^[6-9]\d{9}$/.test(payload.phoneNumber)) return "Please enter a valid mobile number.";
  return null;
};

const driverBookingPopulate = (query) => query
  .populate({ path: "customer", select: "name phone" })
  .populate({ path: "car", select: "carName carNumber carType isAC" })
  .populate({ path: "payment", select: "paymentMethod paymentStatus amount transactionId verificationStatus" });

const getLinkedDriver = async (userId) => Driver.findOne({ user: userId, isDeleted: { $ne: true } });

const sendLifecycleError = (res, error) => res.status(error.statusCode || 409).json({
  success: false,
  message: error.message,
});

const findAssignedBooking = async (bookingId, driverId) => {
  if (!mongoose.Types.ObjectId.isValid(bookingId)) return { error: { status: 400, message: "Invalid booking id." } };
  const booking = await driverBookingPopulate(Booking.findOne({ _id: bookingId, driver: driverId }));
  if (!booking) return { error: { status: 404, message: "Booking not found." } };
  return { booking };
};

const getDriverDashboardData = async (driver) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(startOfToday);
  endOfToday.setHours(23, 59, 59, 999);

  const bookings = await driverBookingPopulate(
    Booking.find({ driver: driver._id }).sort({ bookingDate: 1, pickupTime: 1 })
  );
  const payments = await Payment.find({ driverId: driver._id })
    .select("amount paymentMethod paymentStatus bookingId transactionId verifiedBy verifiedByModel verifiedType verifiedAt paidAt")
    .populate("bookingId", "bookingStatus driver totalAmount bookingDate pickupTime pickupLocation dropLocation serviceType");

  const todayTrips = bookings.filter((booking) => {
    const date = new Date(booking.bookingDate);
    return date >= startOfToday && date <= endOfToday;
  });
  const upcomingTrips = bookings.filter((booking) => {
    const date = new Date(booking.bookingDate);
    return date > endOfToday && ["Pending", "Confirmed", "Ongoing"].includes(booking.bookingStatus);
  });
  const completedTrips = bookings.filter((booking) => booking.bookingStatus === "Completed");

  return {
    driver: driverResponse(driver),
    summary: {
      assignedCount: bookings.length,
      todayCount: todayTrips.length,
      upcomingCount: upcomingTrips.length,
      completedCount: completedTrips.length,
      paidEarnings: payments.reduce((sum, payment) => payment.paymentStatus === "Paid" ? sum + Number(payment.amount || 0) : sum, 0),
      pendingAmount: payments.reduce((sum, payment) => ["Pending", "Verification Pending"].includes(payment.paymentStatus) ? sum + Number(payment.amount || 0) : sum, 0),
    },
    assignedBookings: bookings,
    todayTrips,
    upcomingTrips,
    completedTrips,
    payments,
  };
};

// @desc    Add a new driver
// @route   POST /api/v1/drivers
// @access  Private/Admin
exports.addDriver = asyncHandler(async (req, res) => {
  const { payload, error } = getDriverPayload(req.body);
  if (error) return sendValidationError(res, error);
  if (!payload.driverName || !payload.phoneNumber || payload.experience === undefined) {
    return sendValidationError(res, "Driver name, phone number, and experience are required.");
  }
  const validationError = validateDriverPayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const shouldCreateAccount = req.body?.createAccount === true || Boolean(req.body?.email);
  let user = null;

  if (shouldCreateAccount) {
    const email = normalizeEmail(req.body.email);
    if (!email || !validator.isEmail(email)) {
      return sendValidationError(res, "Please enter a valid email address.");
    }
    const emailAvailability = await assertEmailAvailable(email);
    if (!emailAvailability.available) {
      return res.status(409).json({ success: false, message: emailAvailability.message });
    }

    const passwordResult = validatePasswordPair(req.body);
    if (passwordResult.error) return sendValidationError(res, passwordResult.error);

    user = await User.create({
      name: payload.driverName,
      email,
      phone: payload.phoneNumber,
      password: passwordResult.password,
      role: "driver",
      status: "active",
    });
    payload.user = user._id;
  }

  let driver;
  try {
    driver = await Driver.create(payload);
  } catch (err) {
    if (user) await User.findByIdAndDelete(user._id);
    throw err;
  }

  res.status(201).json({
    success: true,
    message: "Driver added successfully.",
    data: {
      driver: driverResponse(await driver.populate("user", "email status"), { includeAccount: true }),
      account: user ? {
        id: user._id,
        email: user.email,
        status: user.status,
      } : null,
    },
  });
});

// @desc    Provision a sign-in account for an existing driver profile
// @route   POST /api/v1/drivers/:id/account
// @access  Private/Admin
exports.provisionDriverAccount = asyncHandler(async (req, res) => {
  const email = normalizeEmail(req.body.email);

  if (!hasValidDriverId(req.params.id)) return sendValidationError(res, "Invalid driver id.");

  const driver = await Driver.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!driver) {
    return res.status(404).json({ success: false, message: "Driver not found." });
  }
  if (driver.user) {
    return res.status(409).json({
      success: false,
      message: "This driver already has a linked account.",
    });
  }

  if (!email || !validator.isEmail(email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }
  const emailAvailability = await assertEmailAvailable(email);
  if (!emailAvailability.available) {
    return res.status(409).json({
      success: false,
      message: emailAvailability.message,
    });
  }
  const passwordResult = validatePasswordPair(req.body);
  if (passwordResult.error) return sendValidationError(res, passwordResult.error);

  const user = await User.create({
    name: driver.driverName,
    email,
    phone: driver.phoneNumber,
    password: passwordResult.password,
    role: "driver",
    status: "active",
  });

  try {
    driver.user = user._id;
    await driver.save();
  } catch (err) {
    await User.findByIdAndDelete(user._id);
    throw err;
  }

  res.status(201).json({
    success: true,
    message: "Driver account provisioned successfully.",
    data: {
      driverId: driver._id,
      userId: user._id,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  });
});

exports.updateDriverAccountEmail = asyncHandler(async (req, res) => {
  if (!hasValidDriverId(req.params.id)) return sendValidationError(res, "Invalid driver id.");
  const email = normalizeEmail(req.body.email);
  if (!email || !validator.isEmail(email)) return sendValidationError(res, "Please enter a valid email address.");

  const driver = await Driver.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!driver) return res.status(404).json({ success: false, message: "Driver not found." });
  if (!driver.user) return res.status(409).json({ success: false, message: "Driver account is not provisioned." });

  const emailAvailability = await assertEmailAvailable(email, driver.user);
  if (!emailAvailability.available) {
    return res.status(409).json({ success: false, message: emailAvailability.message });
  }

  const user = await User.findById(driver.user);
  if (!user || user.role !== "driver") {
    return res.status(409).json({ success: false, message: "Linked account is invalid." });
  }

  user.email = email;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Driver account email updated.",
    data: driverResponse(await driver.populate("user", "email status"), { includeAccount: true }),
  });
});

exports.resetDriverAccountPassword = asyncHandler(async (req, res) => {
  if (!hasValidDriverId(req.params.id)) return sendValidationError(res, "Invalid driver id.");

  const driver = await Driver.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!driver) return res.status(404).json({ success: false, message: "Driver not found." });
  if (!driver.user) return res.status(409).json({ success: false, message: "Driver account is not provisioned." });

  const user = await User.findById(driver.user).select("+password");
  if (!user || user.role !== "driver") {
    return res.status(409).json({ success: false, message: "Linked account is invalid." });
  }

  const passwordResult = validatePasswordPair(req.body);
  if (passwordResult.error) return sendValidationError(res, passwordResult.error);

  user.password = passwordResult.password;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Driver account password reset.",
    data: {
      driverId: driver._id,
      userId: user._id,
      email: user.email,
      status: user.status,
    },
  });
});

exports.updateDriverAccountStatus = asyncHandler(async (req, res) => {
  if (!hasValidDriverId(req.params.id)) return sendValidationError(res, "Invalid driver id.");
  const status = String(req.body?.status || "").trim();
  if (!["active", "inactive"].includes(status)) {
    return sendValidationError(res, "Account status must be active or inactive.");
  }

  const driver = await Driver.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
  if (!driver) return res.status(404).json({ success: false, message: "Driver not found." });
  if (!driver.user) return res.status(409).json({ success: false, message: "Driver account is not provisioned." });

  const user = await User.findById(driver.user);
  if (!user || user.role !== "driver") {
    return res.status(409).json({ success: false, message: "Linked account is invalid." });
  }

  user.status = status;
  await user.save();

  res.status(200).json({
    success: true,
    message: `Driver account ${status === "active" ? "activated" : "deactivated"}.`,
    data: driverResponse(await driver.populate("user", "email status"), { includeAccount: true }),
  });
});

// @desc    Get all drivers
// @route   GET /api/v1/drivers
// @access  Private
exports.getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.find({ isDeleted: { $ne: true } })
    .populate("user", "email status")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: drivers.length,
    data: drivers.map((driver) => driverResponse(driver, { includeAccount: true })),
  });
});

// @desc    Get driver by ID
// @route   GET /api/v1/drivers/:id
// @access  Private
exports.getDriverById = asyncHandler(async (req, res) => {
  if (!hasValidDriverId(req.params.id)) return sendValidationError(res, "Invalid driver id.");
  const driver = await Driver.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).populate("user", "email status");

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: "Driver not found.",
    });
  }

  res.status(200).json({
    success: true,
    data: driverResponse(driver, { includeAccount: true }),
  });
});

// @desc    Get the logged-in driver's own profile
// @route   GET /api/v1/drivers/me
// @access  Private/Driver
exports.getMyDriverProfile = asyncHandler(async (req, res) => {
  const driver = await getLinkedDriver(req.user._id);
  if (!driver) {
    return res.status(404).json({ success: false, message: "Driver profile not found." });
  }

  res.status(200).json({ success: true, data: driverResponse(driver) });
});

exports.updateMyDriverProfile = asyncHandler(async (req, res) => {
  const allowedFields = ["driverName", "phoneNumber", "experience"];
  const invalidFields = Object.keys(req.body || {}).filter((field) => !allowedFields.includes(field));
  if (invalidFields.length > 0) return sendValidationError(res, "Only driverName, phoneNumber, and experience can be updated.");

  const { payload, error } = getDriverPayload(req.body);
  if (error) return sendValidationError(res, error);
  delete payload.status;
  if (Object.keys(payload).length === 0) return sendValidationError(res, "At least one profile field is required.");

  const validationError = validateDriverPayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const driver = await getLinkedDriver(req.user._id);
  if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found." });

  Object.assign(driver, payload);
  await driver.save();
  await User.findByIdAndUpdate(req.user._id, {
    name: driver.driverName,
    phone: driver.phoneNumber,
  }, { runValidators: true });

  res.status(200).json({ success: true, message: "Driver profile updated.", data: driverResponse(driver) });
});

exports.getMyDriverDashboard = asyncHandler(async (req, res) => {
  const driver = await getLinkedDriver(req.user._id);
  if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found." });
  res.status(200).json({ success: true, data: await getDriverDashboardData(driver) });
});

exports.getMyDriverBookings = asyncHandler(async (req, res) => {
  const driver = await getLinkedDriver(req.user._id);
  if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found." });

  const bookings = await driverBookingPopulate(
    Booking.find({ driver: driver._id }).sort({ bookingDate: 1, pickupTime: 1 })
  );
  res.status(200).json({ success: true, count: bookings.length, data: bookings });
});

exports.updateMyAvailability = asyncHandler(async (req, res) => {
  const status = String(req.body?.status || "").trim();
  if (!["Available", "Busy"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be Available or Busy." });
  }

  const driver = await getLinkedDriver(req.user._id);
  if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found." });

  const ongoingTrip = await Booking.exists({ driver: driver._id, bookingStatus: "Ongoing" });
  if (ongoingTrip && status === "Available") {
    return res.status(409).json({ success: false, message: "Availability cannot be changed to Available during an ongoing trip." });
  }

  driver.status = status;
  await driver.save();
  res.status(200).json({ success: true, message: "Availability updated.", data: driverResponse(driver) });
});

exports.startAssignedBooking = asyncHandler(async (req, res) => {
  const driver = await getLinkedDriver(req.user._id);
  if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found." });

  const { booking, error } = await findAssignedBooking(req.params.id, driver._id);
  if (error) return res.status(error.status).json({ success: false, message: error.message });
  if (booking.bookingStatus !== "Confirmed") {
    return res.status(409).json({ success: false, message: "Only confirmed bookings can be started." });
  }

  try {
    transitionBooking(booking, "Ongoing", req.user._id, "Started by assigned driver");
  } catch (err) {
    if (err instanceof BookingLifecycleError) return sendLifecycleError(res, err);
    throw err;
  }

  booking.startedAt = new Date();
  await booking.save();
  await refreshResourceAvailability(booking);

  const updatedBooking = await driverBookingPopulate(Booking.findById(booking._id));
  res.status(200).json({ success: true, message: "Trip started.", data: updatedBooking });
});

exports.completeAssignedBooking = asyncHandler(async (req, res) => {
  const driver = await getLinkedDriver(req.user._id);
  if (!driver) return res.status(404).json({ success: false, message: "Driver profile not found." });

  const { booking, error } = await findAssignedBooking(req.params.id, driver._id);
  if (error) return res.status(error.status).json({ success: false, message: error.message });
  if (booking.bookingStatus !== "Ongoing") {
    return res.status(409).json({ success: false, message: "Only ongoing bookings can be completed." });
  }

  try {
    transitionBooking(booking, "Completed", req.user._id, "Completed by assigned driver");
  } catch (err) {
    if (err instanceof BookingLifecycleError) return sendLifecycleError(res, err);
    throw err;
  }

  booking.completedAt = new Date();
  await booking.save();
  await refreshResourceAvailability(booking);

  const updatedBooking = await driverBookingPopulate(Booking.findById(booking._id));
  res.status(200).json({ success: true, message: "Trip completed.", data: updatedBooking });
});

// @desc    Update driver
// @route   PUT /api/v1/drivers/:id
// @access  Private/Admin
exports.updateDriver = asyncHandler(async (req, res) => {
  if (!hasValidDriverId(req.params.id)) return sendValidationError(res, "Invalid driver id.");
  const { payload, error } = getDriverPayload(req.body);
  if (error) return sendValidationError(res, error);
  if (Object.keys(payload).length === 0) {
    return sendValidationError(res, "At least one driver field is required.");
  }
  const validationError = validateDriverPayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const driver = await Driver.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: "Driver not found.",
    });
  }

  Object.assign(driver, payload);
  const updatedDriver = await driver.save();

  // Keep the linked account's display and contact identity in sync.
  if (updatedDriver.user) {
    await User.findByIdAndUpdate(updatedDriver.user, {
      name: updatedDriver.driverName,
      phone: updatedDriver.phoneNumber,
    }, { runValidators: true });
  }

  res.status(200).json({
    success: true,
    message: "Driver updated successfully.",
    data: driverResponse(updatedDriver),
  });
});

// @desc    Delete driver
// @route   DELETE /api/v1/drivers/:id
// @access  Private/Admin
exports.deleteDriver = asyncHandler(async (req, res) => {
  if (!hasValidDriverId(req.params.id)) return sendValidationError(res, "Invalid driver id.");
  const driver = await Driver.findOne({ _id: req.params.id, isDeleted: { $ne: true } });

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: "Driver not found.",
    });
  }

  const linkedUserId = driver.user || null;
  const references = await getDriverReferenceSummary(driver._id, linkedUserId);

  if (references.hasReferences) {
    if (linkedUserId) {
      await releaseDriverUserEmail(linkedUserId);
    }

    driver.isDeleted = true;
    driver.deletedAt = new Date();
    driver.status = "Busy";
    await driver.save();

    return res.status(200).json({
      success: true,
      message: linkedUserId
        ? "Driver archived. Linked account was deactivated and its email was released for reuse."
        : "Driver archived because historical records still reference this driver.",
      data: {
        driverId: driver._id,
        deleted: false,
        archived: true,
        accountAction: linkedUserId ? "archived_email_released" : "none",
        emailReusable: true,
        references,
      },
    });
  }

  if (linkedUserId) {
    await User.findByIdAndDelete(linkedUserId);
  }
  await driver.deleteOne();

  res.status(200).json({
    success: true,
    message: linkedUserId
      ? "Driver deleted and linked account removed. The email can be reused."
      : "Driver deleted successfully.",
    data: {
      driverId: driver._id,
      deleted: true,
      archived: false,
      accountAction: linkedUserId ? "removed" : "none",
      emailReusable: true,
      references,
    },
  });
});
