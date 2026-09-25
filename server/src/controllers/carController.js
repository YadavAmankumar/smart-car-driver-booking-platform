const Car = require("../models/Car");
const Booking = require("../models/Booking");
const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const {
  uploadCarImage: uploadCarImageToCloudinary,
  deleteCarImage,
} = require("../services/carImageService");

const CAR_FIELDS = ["carName", "carNumber", "carType", "vehicleCategory", "isAC", "isAvailable"];

const getCarPayload = (body = {}) => {
  const invalidFields = Object.keys(body).filter((field) => !CAR_FIELDS.includes(field));
  if (invalidFields.length > 0) return { error: `Unsupported car fields: ${invalidFields.join(", ")}.` };

  const payload = {};
  if (body.carName !== undefined) payload.carName = String(body.carName).trim();
  if (body.carNumber !== undefined) payload.carNumber = String(body.carNumber).trim().toUpperCase();
  if (body.carType !== undefined) payload.carType = body.carType;
  if (body.vehicleCategory !== undefined) payload.vehicleCategory = body.vehicleCategory;
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
  if (payload.vehicleCategory !== undefined && !["Mini", "Sedan", "XL – 7 Seater", "Force Traveller"].includes(payload.vehicleCategory)) return "Vehicle category must be Mini, Sedan, XL – 7 Seater, or Force Traveller.";
  return null;
};

// @desc    Add a new car
// @route   POST /api/v1/cars
// @access  Private
exports.addCar = asyncHandler(async (req, res) => {
  const { payload, error } = getCarPayload(req.body);
  if (error) return sendValidationError(res, error);
  if (!payload.carName || !payload.carNumber || !payload.carType || !payload.vehicleCategory) {
    return sendValidationError(res, "Car name, car number, fuel type, and vehicle category are required.");
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

  const carIds = cars.map((car) => car._id);

  const bookings = await Booking.find({
    car: { $in: carIds },
    bookingStatus: { $in: ["Pending", "Confirmed", "Ongoing"] },
  })
    .sort({ bookingDate: 1, pickupTime: 1 })
    .populate({
      path: "driver",
      select: "driverName phoneNumber experience",
    })
    .select(
      "car driver bookingDate pickupTime pickupLocation dropLocation bookingStatus serviceType estimatedHours estimatedKm estimatedDuration startedAt completedAt"
    );

  const bookingsByCar = new Map();

  for (const booking of bookings) {
    const key = booking.car.toString();

    if (!bookingsByCar.has(key)) {
      bookingsByCar.set(key, []);
    }

    bookingsByCar.get(key).push({
      _id: booking._id,
      bookingDate: booking.bookingDate,
      pickupTime: booking.pickupTime,
      pickupLocation: booking.pickupLocation,
      dropLocation: booking.dropLocation,
      bookingStatus: booking.bookingStatus,
      serviceType: booking.serviceType,
      estimatedHours: booking.estimatedHours,
      estimatedKm: booking.estimatedKm,
      estimatedDuration: booking.estimatedDuration,
      startedAt: booking.startedAt,
      completedAt: booking.completedAt,
      driver: booking.driver
        ? {
            _id: booking.driver._id,
            driverName: booking.driver.driverName,
            phoneNumber: booking.driver.phoneNumber,
            experience: booking.driver.experience,
          }
        : null,
    });
  }

  const data = cars.map((car) => ({
    ...car.toObject(),
    schedule: bookingsByCar.get(car._id.toString()) || [],
  }));

  res.status(200).json({
    success: true,
    count: cars.length,
    data,
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
// @route   POST /api/v1/cars/:id/image
// @access  Private
exports.uploadCarImage = asyncHandler(async (req, res) => {
  if (!hasValidCarId(req.params.id)) {
    return sendValidationError(res, "Invalid car id.");
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Car image is required.",
    });
  }

  const car = await Car.findById(req.params.id);

  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found.",
    });
  }

  const oldImagePublicId = car.imagePublicId;

  const uploadedImage = await uploadCarImageToCloudinary(req.file.buffer);

  car.imageUrl = uploadedImage.imageUrl;
  car.imagePublicId = uploadedImage.imagePublicId;

  await car.save();

  if (oldImagePublicId) {
    try {
      await deleteCarImage(oldImagePublicId);
    } catch (error) {
      console.error("Failed to delete old car image from Cloudinary:", error);
    }
  }

  res.status(200).json({
    success: true,
    message: "Car image uploaded successfully.",
    data: {
      imageUrl: car.imageUrl,
      imagePublicId: car.imagePublicId,
    },
  });
});

// @route   DELETE /api/v1/cars/:id/image
// @access  Private
exports.deleteCarImage = asyncHandler(async (req, res) => {
  if (!hasValidCarId(req.params.id)) {
    return sendValidationError(res, "Invalid car id.");
  }

  const car = await Car.findById(req.params.id);

  if (!car) {
    return res.status(404).json({
      success: false,
      message: "Car not found.",
    });
  }

  if (car.imagePublicId) {
    await deleteCarImage(car.imagePublicId);
  }

  car.imageUrl = "";
  car.imagePublicId = "";

  await car.save();

  res.status(200).json({
    success: true,
    message: "Car image deleted successfully.",
    data: car,
  });
});

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
