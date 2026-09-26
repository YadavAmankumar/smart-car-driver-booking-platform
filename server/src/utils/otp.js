const crypto = require("crypto");

// Generate a cryptographically secure 6-digit numeric OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 1000000).toString();
};

// Hash OTP before storing it in the database
const hashOtp = (otp) => {
  return crypto.createHash("sha256").update(otp).digest("hex");
};

// Compare a plain OTP with its stored hash
const verifyOtp = (otp, hashedOtp) => {
  const otpHash = hashOtp(otp);

  const storedBuffer = Buffer.from(hashedOtp, "hex");
  const receivedBuffer = Buffer.from(otpHash, "hex");

  if (storedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedBuffer, receivedBuffer);
};

module.exports = {
  generateOtp,
  hashOtp,
  verifyOtp,
};
