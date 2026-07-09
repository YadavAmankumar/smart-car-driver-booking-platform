const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const authRoutes = require("./routes/authRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const carRoutes = require("./routes/carRoutes");
const driverRoutes = require("./routes/driverRoutes"); // <-- Added
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/payment/paymentRoutes");
const pricingRoutes = require("./routes/pricingRoutes");


const app = express();



// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Health Check
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Car Driver Booking Platform API is running...",
  });
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/bookings", bookingRoutes);
app.use("/api/v1/cars", carRoutes);
app.use("/api/v1/drivers", driverRoutes); // <-- Added
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/pricing", pricingRoutes);


// 404 Handler


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

module.exports = app;

