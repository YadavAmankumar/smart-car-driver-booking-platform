const jwt = require("jsonwebtoken");
const User = require("../../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Check Authorization Header
    if (typeof req.headers.authorization === "string") {
      const [scheme, value, ...extra] = req.headers.authorization.trim().split(/\s+/);
      if (scheme === "Bearer" && value && extra.length === 0) token = value;
    }

    // Token not found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find User
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found.",
      });
    }
    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is not active.",
      });
    }

    // Attach User to Request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
};

module.exports = authMiddleware;
