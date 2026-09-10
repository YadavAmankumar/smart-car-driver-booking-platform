const Car = require("../models/Car");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");

const CAR_FIELDS = ["carName", "carNumber", "carType", "isAC", "isAvailable"];

const getCarPayload = (body = {}) => {
  const invalidFields = Object.keys(body).filter((field) => !CAR_FIELDS.includes(field));
  if (invalidFields.length > 0) return { error: `Unsupported car fields: ${invalidFields.join(", ")}.` };

  const payload = {};
  if (body.carName !== undefined) payload.carName = String(body.carName).trim();
  if (body.carNumber !== undefined) payload.carNumber = String(body.carNumber).trim().toUpperCase();
  if (body.carType !== undefined) payload.carType = body.carType;
  for (const field of ["isAC", "isAvailable"]) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== "boolean") return { error: `${field} must be a boolean.` };
      payload[field] = body[field];
    }
  }
  return { payload };
};

const sendValidationError = (res, message) => res.status(400).json({ success: false, message });
const hasValidCarId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateCarPayload = (payload) => {
  if (payload.carName !== undefined && payload.carName.length < 2) return "Car name must be at least 2 characters.";
  if (payload.carNumber !== undefined && !/^[A-Z0-9 -]{4,20}$/.test(payload.carNumber)) return "Please enter a valid car number.";
  if (payload.carType !== undefined && !["Petrol", "Diesel", "CNG", "EV"].includes(payload.carType)) return "Fuel type must be Petrol, Diesel, CNG, or EV.";
  return null;
};

// @desc    Add a new car
// @route   POST /api/v1/cars
// @access  Private
exports.addCar = asyncHandler(async (req, res) => {
  const { payload, error } = getCarPayload(req.body);
  if (error) return sendValidationError(res, error);
  if (!payload.carName || !payload.carNumber || !payload.carType) {
    return sendValidationError(res, "Car name, car number, and fuel type are required.");
  }
  const validationError = validateCarPayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const car = await Car.create(payload);

  res.status(201).json({
    success: true,
    message: "Car added successfully.",
    data: car,
  });
});

// @desc    Get all cars
// @route   GET /api/v1/cars
// @access  Private
exports.getAllCars = asyncHandler(async (req, res) => {
  const cars = await Car.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: cars.length,
    data: cars,
  });
});

// @desc    Get car by ID
// @route   GET /api/v1/cars/:id
// @access  Private
exports.getCarById = asyncHandler(async (req, res) => {
  if (!hasValidCarId(req.params.id)) return sendValidationError(res, "Invalid car id.");
  const car = await Car.findById(req.params.id);

  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found.",
    });
  }

  res.status(200).json({
    success: true,
    data: car,
  });
});

// @desc    Update car
// @route   PUT /api/v1/cars/:id
// @access  Private
exports.updateCar = asyncHandler(async (req, res) => {
  if (!hasValidCarId(req.params.id)) return sendValidationError(res, "Invalid car id.");
  const { payload, error } = getCarPayload(req.body);
  if (error) return sendValidationError(res, error);
  if (Object.keys(payload).length === 0) {
    return sendValidationError(res, "At least one car field is required.");
  }
  const validationError = validateCarPayload(payload);
  if (validationError) return sendValidationError(res, validationError);

  const updatedCar = await Car.findByIdAndUpdate(
    req.params.id,
    payload,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedCar) {
    return res.status(404).json({
      success: false,
      message: "Car not found.",
    });
  }

  res.status(200).json({
    success: true,
    message: "Car updated successfully.",
    data: updatedCar,
  });
});

// @desc    Delete car
// @route   DELETE /api/v1/cars/:id
// @access  Private
exports.deleteCar = asyncHandler(async (req, res) => {
  if (!hasValidCarId(req.params.id)) return sendValidationError(res, "Invalid car id.");
  const car = await Car.findById(req.params.id);

  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found.",
    });
  }

  await car.deleteOne();

  res.status(200).json({
    success: true,
    message: "Car deleted successfully.",
  });
});
