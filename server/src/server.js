require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/database/connectDB");

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectDB();

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 http://localhost:${PORT}`);
  console.log("=================================");
});