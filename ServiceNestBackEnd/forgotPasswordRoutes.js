const express = require("express");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const path = require("path");
const asyncHandler = require("./asyncHandler");

// In-memory store for OTPs.
// Note: For production, you might want to use Redis or a database table to store OTPs.
const otpStore = {};

function forgotPasswordRoutes(pool) {
  const router = express.Router();

  // Configure Nodemailer transporter using your environment variables
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Forgot Password - Verify User and Send OTP
  // The path here is relative to where it is mounted in the main server file.
  // We will mount this router at "/api/forgot-password", so this route becomes "/api/forgot-password/send-otp"
  router.post("/send-otp", asyncHandler(async (req, res) => {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const cleanEmail = email.trim().toLowerCase();
      const [rows] = await pool.execute(
        `SELECT * FROM users WHERE LOWER(email) = ?`,
        [cleanEmail],
      );
      if (rows.length === 0) {
        return res.status(404).json({ error: "User doesn't exist" });
      }
      // Generate a 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // Store OTP with an expiration time of 5 minutes
      otpStore[cleanEmail] = {
        otp,
        expires: Date.now() + 5 * 60 * 1000,
      };

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: cleanEmail,
        subject: "ServiceNest - Password Reset OTP",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.05);">
          <h2 style="color: #333; text-align: center;">ServiceNest Password Reset</h2>
          <p style="font-size: 16px; color: #555; line-height: 1.5;">Hello,</p>
          <p style="font-size: 16px; color: #555; line-height: 1.5;">We received a request to reset the password for your ServiceNest account. Please use the One-Time Password (OTP) below to proceed:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 28px; font-weight: bold; background-color: #f8f9fa; padding: 12px 24px; border-radius: 6px; color: #2c3e50; letter-spacing: 4px; display: inline-block; border: 1px solid #ddd;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #7f8c8d; line-height: 1.5;">This OTP is valid for <strong>5 minutes</strong>. If you did not request a password reset, you can safely ignore this email.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <div style="text-align: center;">
            <img src="cid:servicenestlogo" alt="ServiceNest Logo" style="width: 200px; height: auto;" />
            <p style="font-size: 12px; color: #aaa; margin-top: 15px;">&copy; ${new Date().getFullYear()} ServiceNest. All rights reserved.</p>
          </div>
        </div>
      `,
        attachments: [
          {
            filename: "logo.png",
            path: path.join(__dirname, "../src/assets/logo.png"),
            cid: "servicenestlogo",
          },
        ],
      };

      await transporter.sendMail(mailOptions);

      res.json({ message: "An OTP has been sent to your email successfully" });
    }),
  );

  // Verify OTP and Reset Password
  router.post("/reset-password", asyncHandler(async (req, res) => {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const cleanEmail = email.trim().toLowerCase();
      const storedOtpData = otpStore[cleanEmail];

      if (!storedOtpData) {
        return res.status(400).json({ error: "OTP not requested or expired" });
      }
      if (Date.now() > storedOtpData.expires) {
        delete otpStore[cleanEmail];
        return res.status(400).json({ error: "OTP has expired" });
      }
      if (storedOtpData.otp !== otp.trim()) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      // Hash the new password (using 12 rounds to match your registration logic)
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await pool.execute(
        `UPDATE users SET password = ? WHERE LOWER(email) = ?`,
        [hashedPassword, cleanEmail],
      );
      delete otpStore[cleanEmail]; // Clean up the OTP once used successfully
      res.json({
        message: "Password has been reset successfully. Redirecting...",
      });
    }),
  );

  return router;
}

module.exports = forgotPasswordRoutes;
