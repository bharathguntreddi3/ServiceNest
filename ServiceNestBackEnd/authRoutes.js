/* eslint-disable no-unused-vars */
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const pool = require("./db");
const authenticateToken = require("./authMiddleware");
const asyncHandler = require("./asyncHandler");

const { strictRateLimiter } = require("./rateLimiter");

const authrouter = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// routes for the login, register and other auth routes
// authentication and user management

// Transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Store for registration and profile OTPs
const registrationOtpStore = {};
const profileUpdateOtpStore = {};

// send otp to register new user
authrouter.post(
  "/register/send-otp",
  strictRateLimiter,
  asyncHandler(async (req, res) => {
    const { email, phone } = req.body;
    if (!email || !phone) {
      return res.status(400).json({ error: "Email and phone are required" });
    }
    // check if new registration is allowed or not
    const [regSettings] = await pool.execute(
      "SELECT setting_value FROM settings WHERE setting_key = 'enableRegistration'",
    );
    // value to boolean
    const enableRegistration =
      regSettings.length > 0 && regSettings[0].setting_value === "true";

    if (!enableRegistration) {
      return res
        .status(403)
        .json({ error: "New user registrations are currently disabled." });
    }
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    const [emailRows] = await pool.execute(
      `SELECT * FROM users WHERE LOWER(email) = ?`,
      [cleanEmail],
    );
    if (emailRows.length > 0) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const [phoneRows] = await pool.execute(
      `SELECT * FROM users WHERE phone = ?`,
      [cleanPhone],
    );
    if (phoneRows.length > 0) {
      return res.status(409).json({ error: "Phone number already exists" });
    }
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    registrationOtpStore[cleanEmail] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5-min expiry
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: cleanEmail,
      subject: "ServiceNest - Registration OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Welcome to ServiceNest!</h2>
          <p style="font-size: 16px; color: #555;">Please use the following OTP to complete your registration:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 28px; font-weight: bold; background-color: #f8f9fa; padding: 12px 24px; border-radius: 6px; color: #2c3e50; letter-spacing: 4px; border: 1px solid #ddd;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #7f8c8d;">This OTP is valid for 5 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "An OTP has been sent to your email successfully" });
  }),
);

// Handle registration
authrouter.post(
  "/register",
  strictRateLimiter,
  asyncHandler(async (req, res) => {
    const { name, email, password, phone, otp } = req.body;

    if (!email || !password || !phone || !otp) {
      return res
        .status(400)
        .json({ error: "Email, password, phone number, and OTP are required" });
    }

    const [regSettings] = await pool.execute(
      "SELECT setting_value FROM settings WHERE setting_key = 'enableRegistration'",
    );
    const enableRegistration =
      regSettings.length > 0 && regSettings[0].setting_value === "true";

    if (!enableRegistration) {
      return res
        .status(403)
        .json({ error: "New user registrations are currently disabled." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    const storedOtpData = registrationOtpStore[cleanEmail];
    if (!storedOtpData) {
      return res.status(400).json({ error: "OTP not requested or expired" });
    }
    if (Date.now() > storedOtpData.expires) {
      delete registrationOtpStore[cleanEmail];
      return res.status(400).json({ error: "OTP has expired" });
    }
    if (storedOtpData.otp !== otp.trim()) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    try {
      // hashing complexity of 12 salts
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const [result] = await pool.execute(
        `INSERT INTO users (name, email, password, phone) VALUES (?, ?, ?, ?)`,
        [name || null, cleanEmail, hashedPassword, cleanPhone],
      );

      const [settingsRows] = await pool.execute(
        "SELECT * FROM settings WHERE setting_key = 'sessionTimeout'",
      );
      const sessionTimeout =
        settingsRows.length > 0 ? `${settingsRows[0].setting_value}m` : "60m";

      const token = jwt.sign(
        {
          id: result.insertId,
          email: cleanEmail,
          role: "user",
        },
        process.env.JWT_SECRET || "default_secret_key",
        { expiresIn: sessionTimeout },
      );

      delete registrationOtpStore[cleanEmail];

      const newUser = {
        id: result.insertId,
        name: name || null,
        email: cleanEmail,
        phone: cleanPhone,
        role: "user",
      };

      res.status(201).json({
        message: "User registered successfully",
        user: newUser,
        token,
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        if (error.message.includes("phone")) {
          return res.status(409).json({ error: "Phone number already exists" });
        }
        if (error.message.includes("email")) {
          return res.status(409).json({ error: "Email already exists" });
        }
        return res
          .status(409)
          .json({ error: "A unique field already exists." });
      }
      throw error;
    }
  }),
);

// Handle login
authrouter.post(
  "/login",
  strictRateLimiter,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE LOWER(email) = ?`,
      [cleanEmail],
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User doesn't exist" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const isBlocked =
      user.is_blocked === 1 ||
      user.is_blocked === true ||
      user.is_blocked === "1" ||
      user.is_blocked === "true";
    if (isBlocked) {
      return res.status(403).json({
        error:
          "Your account has been blocked by the admin. Please contact the support team.",
      });
    }

    await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    const [settingsRows] = await pool.execute(
      "SELECT * FROM settings WHERE setting_key = 'sessionTimeout'",
    );
    const sessionTimeout =
      settingsRows.length > 0 ? `${settingsRows[0].setting_value}m` : "120m";

    const token = jwt.sign(
      {
        id: user.id || user.user_id || user.userId,
        email: user.email,
        role: user.role ? String(user.role).toLowerCase() : "user",
      },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: sessionTimeout },
    );

    res.json({
      message: "Login successful",
      user: {
        id: user.id || user.user_id || user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role ? String(user.role).toLowerCase() : "user",
        is_blocked: user.is_blocked,
      },
      token,
    });
  }),
);

// login with google
authrouter.post(
  "/auth/google",
  asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: "Google token is required." });
    }

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      // user info stored in payload
      payload = ticket.getPayload();
    } catch (error) {
      return res.status(401).json({ error: "Invalid Google token." });
    }

    const { name, email } = payload;
    const cleanEmail = email.trim().toLowerCase();

    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      cleanEmail,
    ]);
    let user = users[0];

    if (!user) {
      // generate a random password if the user doesn't exist in the db
      const randomPassword =
        Math.random().toString(36).slice(-8) +
        Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      const [result] = await pool.execute(
        "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
        [name, cleanEmail, hashedPassword, "user"],
      );

      const [newUserRows] = await pool.execute(
        "SELECT * FROM users WHERE id = ?",
        [result.insertId],
      );
      user = newUserRows[0];
    }

    const isBlocked =
      user.is_blocked === 1 ||
      user.is_blocked === true ||
      user.is_blocked === "1" ||
      user.is_blocked === "true";
    if (isBlocked) {
      return res.status(403).json({
        error:
          "Your account has been blocked by the admin. Please contact support.",
      });
    }

    await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    const [settingsRows] = await pool.execute(
      "SELECT * FROM settings WHERE setting_key = 'sessionTimeout'",
    );
    const sessionTimeout =
      settingsRows.length > 0 ? `${settingsRows[0].setting_value}m` : "60m";

    const appToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role ? String(user.role).toLowerCase() : "user",
      },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: sessionTimeout },
    );

    res.json({
      message: "Google sign-in successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role ? String(user.role).toLowerCase() : "user",
        is_blocked: user.is_blocked,
      },
      token: appToken,
    });
  }),
);

// Send OTP to update user
authrouter.post(
  "/user/:userId/send-update-otp",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (req.user.id.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const [rows] = await pool.execute("SELECT email FROM users WHERE id = ?", [
      userId,
    ]);
    if (rows.length === 0)
      return res.status(404).json({ error: "User not found" });

    const userEmail = rows[0].email;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    profileUpdateOtpStore[userId] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000,
    };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: "ServiceNest - Profile Update OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Profile Update Request</h2>
          <p style="font-size: 16px; color: #555;">Please use the following OTP to verify your identity and complete your profile update:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 28px; font-weight: bold; background-color: #f8f9fa; padding: 12px 24px; border-radius: 6px; color: #2c3e50; letter-spacing: 4px; border: 1px solid #ddd;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #7f8c8d;">This OTP is valid for 5 minutes.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.json({
      message: "An OTP has been sent to your registered email successfully",
    });
  }),
);

// Update User
authrouter.put(
  "/user/:userId",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { name, email, phone, address, otp } = req.body;

    if (req.user.id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to update this account" });
    }
    if (!name || !email || !phone) {
      return res
        .status(400)
        .json({ error: "Name, email, and phone are required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();

    try {
      const [otpSettings] = await pool.execute(
        "SELECT setting_value FROM settings WHERE setting_key = 'requireOtpForUpdates'",
      );
      const requireOtp =
        otpSettings.length > 0 && otpSettings[0].setting_value === "true";

      const [currentUserRows] = await pool.execute(
        "SELECT * FROM users WHERE id = ?",
        [userId],
      );
      if (currentUserRows.length > 0 && requireOtp) {
        const currentUser = currentUserRows[0];
        if (
          currentUser.email !== cleanEmail ||
          currentUser.phone !== cleanPhone
        ) {
          if (!otp)
            return res
              .status(400)
              .json({ error: "OTP is required for changing email or phone" });

          const storedOtpData = profileUpdateOtpStore[userId];
          if (!storedOtpData)
            return res
              .status(400)
              .json({ error: "OTP not requested or expired" });
          if (Date.now() > storedOtpData.expires) {
            delete profileUpdateOtpStore[userId];
            return res.status(400).json({ error: "OTP has expired" });
          }
          if (storedOtpData.otp !== otp.trim())
            return res.status(400).json({ error: "Invalid OTP" });

          delete profileUpdateOtpStore[userId];
        }
      }

      await pool.execute(
        "UPDATE users SET name = ?, email = ?, phone = ?, address = ? WHERE id = ?",
        [name.trim(), cleanEmail, cleanPhone, address || null, userId],
      );

      const [rows] = await pool.execute("SELECT * FROM users WHERE id = ?", [
        userId,
      ]);
      const updatedUser = rows[0];

      const [settingsRows] = await pool.execute(
        "SELECT * FROM settings WHERE setting_key = 'sessionTimeout'",
      );
      const sessionTimeout =
        settingsRows.length > 0 ? `${settingsRows[0].setting_value}m` : "60m";

      const token = jwt.sign(
        {
          id: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role || "user",
        },
        process.env.JWT_SECRET || "default_secret_key",
        { expiresIn: sessionTimeout },
      );

      res.json({
        message: "Profile updated successfully",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          address: updatedUser.address,
          role: updatedUser.role || "user",
        },
        token,
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        if (error.message.includes("phone"))
          return res.status(409).json({ error: "Phone number already exists" });
        if (error.message.includes("email"))
          return res.status(409).json({ error: "Email already exists" });
        return res
          .status(409)
          .json({ error: "A unique field already exists." });
      }
      throw error;
    }
  }),
);

// Delete User
authrouter.delete(
  "/user/:userId",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (req.user.id.toString() !== userId.toString()) {
      return res
        .status(403)
        .json({ error: "Unauthorized to delete this account" });
    }

    await pool.execute("DELETE FROM cart_items WHERE user_id = ?", [userId]);
    await pool.execute("DELETE FROM reviews WHERE user_id = ?", [userId]);
    await pool.execute("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: "Account deleted successfully" });
  }),
);

module.exports = authrouter;
