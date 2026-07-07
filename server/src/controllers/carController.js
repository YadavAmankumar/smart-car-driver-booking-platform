const Car = require("../models/Car");
const asyncHandler = require("../utils/asyncHandler");

// @desc    Add a new car
// @route   POST /api/v1/cars
// @access  Private
exports.addCar = asyncHandler(async (req, res) => {
  const { carName, carNumber, carType, isAvailable } = req.body;

  const car = await Car.create({
    carName,
    carNumber,
    carType,
    isAvailable,
  });

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
  const { carName, carNumber, carType, isAvailable } = req.body;

  const updatedCar = await Car.findByIdAndUpdate(
    req.params.id,
    {
      carName,
      carNumber,
      carType,
      isAvailable,
    },
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

