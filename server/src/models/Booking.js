const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: [true, "Mobile number is required"],
      trim: true,
      match: [/^[6-9]\d{9}$/, "Please enter a valid mobile number"],
    },

    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: ["Driver Only", "Car with Driver"],
    },

    // Required only when serviceType = "Car with Driver"
    carType: {
      type: String,
      enum: ["AC", "Non-AC"],
    },

    pickupLocation: {
      type: String,
      required: [true, "Pickup location is required"],
      trim: true,
    },

    dropLocation: {
      type: String,
      required: [true, "Drop location is required"],
      trim: true,
    },

    bookingDate: {
      type: Date,
      required: [true, "Booking date is required"],
    },

    pickupTime: {
      type: String,
      required: [true, "Pickup time is required"],
    },

    // Used for Driver Only bookings
    estimatedHours: {
      type: Number,
      min: 1,
    },

    // Used for Car with Driver bookings
    estimatedKm: {
      type: Number,
      min: 1,
    },

    // ==============================
    // Pricing Snapshot + Fare Breakdown
    // ==============================

    // Pricing snapshot (immutable). Store all config values used at booking time.
    pricingSnapshot: {
      type: Object,
      default: {},
    },

    // Price used at the time of the booking
    // (Kept for backward compatibility)
    rate: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Stored snapshot values / rates
    baseFare: { type: Number, min: 0, default: 0 },
    ratePerKm: { type: Number, min: 0, default: 0 },
    hourlyRate: { type: Number, min: 0, default: 0 },

    gst: { type: Number, min: 0, default: 0 },
    airportCharge: { type: Number, min: 0, default: 0 },
    waitingCharge: { type: Number, min: 0, default: 0 },
    nightCharge: { type: Number, min: 0, default: 0 },
    weekendCharge: { type: Number, min: 0, default: 0 },
    minimumFare: { type: Number, min: 0, default: 0 },

    // Distance/time breakdown
    distanceKm: { type: Number, min: 0, default: 0 },
    estimatedDuration: { type: Number, min: 0, default: 0 },

    // Fare breakdown components
    distanceCharge: { type: Number, min: 0, default: 0 },

    // Final amount charged
    // This should always be calculated on the backend
    totalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },

    // Estimated total calculated by Pricing Engine
    estimatedFare: { type: Number, min: 0, default: 0 },

    paymentMethod: {
      type: String,
      required: [true, "Payment method is required"],
      enum: ["Cash", "UPI", "Card", "Net Banking"],
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Refunded"],
      default: "Pending",
    },

    bookingStatus: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "Ongoing",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },

    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      default: null,
    },

    car: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Car",
      default: null,
    },

    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null,
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Booking", bookingSchema);

