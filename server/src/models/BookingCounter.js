const mongoose = require("mongoose");

const bookingCounterSchema = new mongoose.Schema(
  {
    customerSuffix: {
      type: String,
      required: true,
      match: [/^\d{3}$/, "Invalid customer suffix"],
    },

    dateKey: {
      type: String,
      required: true,
      match: [/^\d{8}$/, "Invalid date key"],
    },

    sequence: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

bookingCounterSchema.index(
  { customerSuffix: 1, dateKey: 1 },
  { unique: true }
);

module.exports = mongoose.model("BookingCounter", bookingCounterSchema);
