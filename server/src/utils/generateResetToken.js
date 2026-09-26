const jwt = require("jsonwebtoken");

const generateResetToken = (userId) => {
  return jwt.sign(
    {
      id: userId,
      purpose: "password_reset",
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "10m",
    }
  );
};

module.exports = generateResetToken;
