// ===============================
// Role Authorization Middleware
// ===============================
// Usage: authorizeRoles("admin"), authorizeRoles("admin", "driver"), etc.
// Must be used AFTER authMiddleware so req.user is available.

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. No user found in request.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized. Required roles: ${allowedRoles.join(", ")}`,
      });
    }

    next();
  };
};

module.exports = authorizeRoles;