const { body, validationResult } = require("express-validator");

// Validation for Booking schema fields
// Returns clean validation errors
const bookingValidation = [
  body("customerName")
    .exists({ checkFalsy: true })
    .withMessage("Customer name is required")
    .isString()
    .withMessage("Customer name must be a string")
    .trim()
    .notEmpty()
    .withMessage("Customer name cannot be empty"),

  body("mobileNumber")
    .exists({ checkFalsy: true })
    .withMessage("Mobile number is required")
    .isString()
    .withMessage("Mobile number must be a string")
    .matches(/^[6-9]\d{9}$/)
    .withMessage("Please enter a valid mobile number"),

  body("serviceType")
    .exists({ checkFalsy: true })
    .withMessage("Service type is required")
    .isString()
    .withMessage("Service type must be a string")
    .isIn(["Driver Only", "Car with Driver"])
    .withMessage("Service type must be either 'Driver Only' or 'Car with Driver'"),

  // Conditional fields handled in custom validators below
  body("carType")
    .optional({ values: "null" })
    .isString()
    .withMessage("Car type must be a string")
    .isIn(["AC", "Non-AC"])
    .withMessage("Car type must be either 'AC' or 'Non-AC'"),

  body("pickupLocation")
    .exists({ checkFalsy: true })
    .withMessage("Pickup location is required")
    .isString()
    .withMessage("Pickup location must be a string")
    .trim()
    .notEmpty()
    .withMessage("Pickup location cannot be empty"),

  body("dropLocation")
    .exists({ checkFalsy: true })
    .withMessage("Drop location is required")
    .isString()
    .withMessage("Drop location must be a string")
    .trim()
    .notEmpty()
    .withMessage("Drop location cannot be empty"),

  body("bookingDate")
    .exists({ checkFalsy: true })
    .withMessage("Booking date is required")
    .isISO8601()
    .withMessage("Booking date must be a valid date"),

  body("pickupTime")
    .exists({ checkFalsy: true })
    .withMessage("Pickup time is required")
    .isString()
    .withMessage("Pickup time must be a string")
    .trim()
    .notEmpty()
    .withMessage("Pickup time cannot be empty"),

  body("estimatedHours")
    .optional({ values: "null" })
    .isNumeric()
    .withMessage("Estimated hours must be a number")
    .custom((value, { req }) => {
      if (req.body?.serviceType === "Driver Only") {
        if (value === undefined || value === null || value === "") {
          throw new Error("Estimated hours are required for Driver Only service");
        }
        if (Number(value) < 1) {
          throw new Error("Estimated hours must be at least 1 hour");
        }
      }
      return true;
    }),

  body("estimatedKm")
    .optional({ values: "null" })
    .isNumeric()
    .withMessage("Estimated kilometers must be a number")
    .custom((value, { req }) => {
      if (req.body?.serviceType === "Car with Driver") {
        if (value === undefined || value === null || value === "") {
          throw new Error("Estimated kilometers are required for Car with Driver service");
        }
        if (Number(value) < 1) {
          throw new Error("Estimated kilometers must be at least 1 km");
        }
      }
      return true;
    }),

  body("paymentMethod")
    .exists({ checkFalsy: true })
    .withMessage("Payment method is required")
    .isString()
    .withMessage("Payment method must be a string")
    .isIn(["Cash", "UPI", "Card", "Net Banking"])
    .withMessage(
      "Payment method must be one of: 'Cash', 'UPI', 'Card', 'Net Banking'"
    ),

  body("notes")
    .optional({ values: "null" })
    .isString()
    .withMessage("Notes must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("Notes cannot exceed 500 characters"),

  // Final conditional requirements for carType when serviceType=Car with Driver
  body("carType").custom((value, { req }) => {
    if (req.body?.serviceType === "Car with Driver") {
      if (!value) {
        throw new Error("Car type is required for Car with Driver service");
      }
    }
    return true;
  }),

  // Collect and return validation errors
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: errors.array().map((e) => ({
          field: e.path,
          message: e.msg,
        })),
      });
    }
    next();
  },
];

module.exports = bookingValidation;

