const mongoose = require("mongoose");

const errorHandler = (err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  let statusCode = 500;
  let message = "Something went wrong";
  let details;

  // Mongoose: ValidationError
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    message = "Validation error";
    details = Object.values(err.errors || {}).map((e) => ({
      field: e.path,
      message: e.message,
    }));

    return res.status(statusCode).json({
      success: false,
      message,
      errors: details,
    });
  }

  // Mongoose: CastError (e.g., invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid ${err.path}`;

    return res.status(statusCode).json({
      success: false,
      message,
      errors: [{ field: err.path, message: err.message }],
    });
  }

  // Duplicate Key Error (MongoDB)
  if (err && err.code === 11000) {
    statusCode = 409;
    message = "Duplicate key error";

    // Try to extract the duplicate field/value if present
    const key = err.keyValue || {};
    const field = Object.keys(key)[0];
    const value = field ? key[field] : undefined;

    return res.status(statusCode).json({
      success: false,
      message,
      errors: [
        {
          field,
          message: value !== undefined ? `Value '${value}' already exists` : "Duplicate value already exists",
        },
      ],
    });
  }

  // JWT errors
  if (err && err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  if (err && err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  // Some JWT libraries throw these strings/objects
  if (typeof err?.message === "string" && err.message.toLowerCase().includes("jwt")) {
    statusCode = 401;
    message = "Unauthorized";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }

  // Generic server error
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;

