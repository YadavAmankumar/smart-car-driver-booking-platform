const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");

const app = express();

// ===============================
// Global Middleware
// ===============================
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===============================
// API Routes
// ===============================

// Authentication Routes
app.use("/api/v1/auth", authRoutes);

// Health Check Route
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Car Driver Booking API is running 🚗",
  });
});

module.exports = app;