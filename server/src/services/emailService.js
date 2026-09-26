const dotenv = require("dotenv");

dotenv.config();

const sendOtpEmail = async ({ to, otp, purpose }) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  if (!fromEmail) {
    throw new Error("RESEND_FROM_EMAIL is not configured");
  }

  const purposeLabel =
    purpose === "registration" ? "email verification" : "password reset";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject:
        purpose === "registration"
          ? "Verify your SmartDrive email"
          : "SmartDrive password reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; color: #0f172a;">
          <h2 style="margin-bottom: 8px;">SmartDrive</h2>
          <p>Your OTP for ${purposeLabel} is:</p>

          <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; margin: 24px 0;">
            ${otp}
          </div>

          <p>This OTP is valid for <strong>5 minutes</strong>.</p>

          <p style="color: #64748b;">
            If you did not request this code, you can safely ignore this email.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send OTP email: ${errorBody}`);
  }

  return response.json();
};

module.exports = {
  sendOtpEmail,
};
