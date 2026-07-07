const Driver = require("../models/Driver");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Add a new driver
// @route   POST /api/v1/drivers
// @access  Private/Admin
exports.addDriver = asyncHandler(async (req, res) => {
  const { driverName, phoneNumber, experience, status } = req.body;

  const driver = await Driver.create({
    driverName,
    phoneNumber,
    experience,
    status,
  });

  res.status(201).json({
    success: true,
    message: "Driver added successfully.",
    data: driver,
  });
});

// @desc    Get all drivers
// @route   GET /api/v1/drivers
// @access  Private
exports.getAllDrivers = asyncHandler(async (req, res) => {
  const drivers = await Driver.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: drivers.length,
    data: drivers,
  });
});

// @desc    Get driver by ID
// @route   GET /api/v1/drivers/:id
// @access  Private
exports.getDriverById = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: "Driver not found.",
    });
  }

  res.status(200).json({
    success: true,
    data: driver,
  });
});

// @desc    Update driver
// @route   PUT /api/v1/drivers/:id
// @access  Private/Admin
exports.updateDriver = asyncHandler(async (req, res) => {
  const { driverName, phoneNumber, experience, status } = req.body;

  const updatedDriver = await Driver.findByIdAndUpdate(
    req.params.id,
    {
      driverName,
      phoneNumber,
      experience,
      status,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedDriver) {
    return res.status(404).json({
      success: false,
      message: "Driver not found.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Driver updated successfully.",
    data: updatedDriver,
  });
});

// @desc    Delete driver
// @route   DELETE /api/v1/drivers/:id
// @access  Private/Admin
exports.deleteDriver = asyncHandler(async (req, res) => {
  const driver = await Driver.findById(req.params.id);

  if (!driver) {
    return res.status(404).json({
      success: false,
      message: "Driver not found.",
    });
  }

  await driver.deleteOne();

  res.status(200).json({
    success: true,
    message: "Driver deleted successfully.",
  });
});