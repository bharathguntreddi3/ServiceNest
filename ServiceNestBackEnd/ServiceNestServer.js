/**
 * @file ServiceNestServer.js
 * @description Main entry point for the ServiceNest Backend Node.js/Express server.
 * It handles user authentication, cart management, bookings, service configurations,
 * admin dashboards, and email notifications.
 * @author ServiceNest
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const forgotPasswordRoutes = require("./forgotPasswordRoutes");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const nodemailer = require("nodemailer");

const app = express();
const port = process.env.PORT;

// Database configuration using environment variables
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Enable CORS so that our FrontEnd can communicate with this API
app.use(cors({ origin: "http://localhost:5173" }));

// Initialize Google Auth Client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to parse JSON request bodies
app.use(express.json());

// Create a connection pool for better performance and concurrency
// instead of single connection pool maintains multiple open connections to the db
// slightly more memory requirements than single connection
// for production ready use pool
const pool = mysql.createPool(dbConfig);

// Test the database connection on startup
pool
  .getConnection()
  .then((connection) => {
    console.log("Successfully connected to the MySQL database.");
    connection.release();
  })
  .catch((err) => {
    console.error("Error connecting to the database:", err);
  });

/**
 * @route GET /api/status
 * @description Sample diagnostic route to test if the database connection is active.
 * @access Public
 * @returns {Object} Status message and raw data response
 */
app.get("/api/status", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT 1 as status");
    res.json({ message: "Database connection is active", data: rows });
  } catch (error) {
    console.error("Database query failed:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * JWT Verification Middleware
 * Intercepts incoming requests, extracts the Bearer token from the Authorization header,
 * and verifies its validity using jsonwebtoken. Sets `req.user` if valid.
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Format is "Bearer TOKEN"
  // open post man and use get method and select bearer token ad insert the token

  if (!token)
    return res.status(401).json({ error: "Access denied. No token provided." });

  jwt.verify(
    token,
    process.env.JWT_SECRET || "default_secret_key",
    async (err, decodedUser) => {
      if (err)
        return res.status(403).json({ error: "Invalid or expired token." });

      try {
        // Automatically block users who have been blocked after they originally logged in
        const [rows] = await pool.execute(
          "SELECT is_blocked FROM users WHERE id = ?",
          [decodedUser.id],
        );
        if (rows.length > 0) {
          const isBlocked =
            rows[0].is_blocked === 1 ||
            rows[0].is_blocked === true ||
            rows[0].is_blocked === "1" ||
            rows[0].is_blocked === "true";
          if (isBlocked) {
            return res
              .status(403)
              .json({ error: "Your account has been blocked by the admin." });
          }
        }
      } catch (dbErr) {
        console.error("DB error during token verification:", dbErr);
      }

      req.user = decodedUser;
      next();
    },
  );
};

// Transporter for sending emails
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Store for registration OTPs
const registrationOtpStore = {};

/**
 * @route POST /api/register/send-otp
 * @description Generates a 6-digit OTP, stores it in memory with a 5-minute expiration,
 * and emails it to the user. Also checks if global user registrations are currently enabled.
 * @access Public
 * @param {string} req.body.email - The user's email address
 * @returns {Object} JSON response indicating success or failure
 */
app.post("/api/register/send-otp", async (req, res) => {
  const { email, phone } = req.body;
  if (!email || !phone) {
    return res.status(400).json({ error: "Email and phone are required" });
  }

  try {
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    registrationOtpStore[cleanEmail] = {
      otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
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
  } catch (error) {
    console.error("Error sending registration OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});

/**
 * @route POST /api/register
 * @description Validates the provided OTP, creates a new user account with a hashed password,
 * and issues a JWT token for immediate login.
 * @access Public
 * @param {string} req.body.name, req.body.email, req.body.password, req.body.phone, req.body.otp
 * @returns {Object} JSON containing success message, user details, and initial JWT token
 */
app.post("/api/register", async (req, res) => {
  const { name, email, password, phone, otp } = req.body;

  if (!email || !password || !phone || !otp) {
    return res
      .status(400)
      .json({ error: "Email, password, phone number, and OTP are required" });
  }

  try {
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
  } catch (error) {
    console.error("Error checking registration settings:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }

  // Remove accidental spaces and ensure email is lowercase
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
      settingsRows.length > 0 ? `${settingsRows[0].setting_value}m` : "120m";

    // Generate JWT Token
    const token = jwt.sign(
      { id: result.insertId, email: cleanEmail, role: "user" },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: sessionTimeout },
    );

    // Clear OTP after successful registration
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
      return res.status(409).json({ error: "A unique field already exists." });
    }
    console.error("Registration error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
});

/**
 * @route POST /api/login
 * @description Authenticates a user by checking their email and verifying the hashed password.
 * Issues a new JWT token based on the currently configured global session timeout.
 * @access Public
 * @param {string} req.body.email, req.body.password
 * @returns {Object} JSON containing success message, user details, and JWT token
 */
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`\n--- LOGIN ATTEMPT ---`);
  console.log(`Frontend sent -> Email: "${email}", Password: "${password}"`);
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  // Match the email format we used during registration
  const cleanEmail = email.trim().toLowerCase();
  console.log(`Searching DB for email: "${cleanEmail}"`);
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM users WHERE LOWER(email) = ?`,
      [cleanEmail],
    );
    if (rows.length === 0) {
      console.log(`Result: Failed. No user found with email "${cleanEmail}"`);
      return res.status(404).json({ error: "User doesn't exist" });
    }

    const user = rows[0];
    console.log(`Result: User found!`);
    // Compare the provided plain-text password with the stored hashed password.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log(`Result: Failed. Password mismatch!`);
      return res.status(401).json({ error: "Incorrect password" });
    }

    const isBlocked =
      user.is_blocked === 1 ||
      user.is_blocked === true ||
      user.is_blocked === "1" ||
      user.is_blocked === "true";
    if (isBlocked) {
      console.log(`Result: Failed. User account is blocked!`);
      return res.status(403).json({
        error:
          "Your account has been blocked by the admin. Please contact the support team.",
      });
    }

    console.log(`Result: Success! User authenticated.`);

    // Update last_login timestamp
    await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    const [settingsRows] = await pool.execute(
      "SELECT * FROM settings WHERE setting_key = 'sessionTimeout'",
    );
    const sessionTimeout =
      settingsRows.length > 0 ? `${settingsRows[0].setting_value}m` : "120m";

    // Generate JWT Token
    const token = jwt.sign(
      {
        id: user.id || user.user_id || user.userId,
        email: user.email,
        role: user.role ? String(user.role).toLowerCase() : "user",
      },
      process.env.JWT_SECRET || "default_secret_key",
      { expiresIn: sessionTimeout },
    );

    // Return user info (excluding password) upon successful login
    // Safely fallback to user.user_id if your database column is named differently
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
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      details: error.message,
    });
  }
});

/**
 * @route POST /api/auth/google
 * @description Authenticates a user via a Google ID token. If the user doesn't exist,
 * a new account is created. Issues a new JWT token for the application session.
 * @access Public
 * @param {string} req.body.token - The Google ID token from the frontend.
 * @returns {Object} JSON containing success message, user details, and JWT token.
 */
app.post("/api/auth/google", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Google token is required." });
  }

  try {
    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { name, email } = payload;

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const [users] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      cleanEmail,
    ]);

    let user = users[0];

    // If user does not exist, create a new one
    if (!user) {
      console.log(`New user from Google: ${cleanEmail}. Creating account.`);
      // For OAuth users, we don't have a password. Store a non-login-able value.
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

    // Check if the user is blocked
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

    // Update last_login timestamp
    await pool.execute("UPDATE users SET last_login = NOW() WHERE id = ?", [
      user.id,
    ]);

    // Get session timeout from settings
    const [settingsRows] = await pool.execute(
      "SELECT * FROM settings WHERE setting_key = 'sessionTimeout'",
    );
    const sessionTimeout =
      settingsRows.length > 0 ? `${settingsRows[0].setting_value}m` : "120m";

    // Generate our own JWT for the user
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
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(401).json({ error: "Invalid Google token." });
  }
});

/**
 * @route GET /api/settings
 * @description Retrieves global platform settings from the database and maps them into a key-value object.
 * @access Public
 * @returns {Object} JSON object containing all configuration settings
 */
app.get("/api/settings", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM settings");
    const settings = rows.reduce((acc, row) => {
      let value = row.setting_value;
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (
        !isNaN(Number(value)) &&
        Number.isFinite(Number(value)) &&
        !/^\+\d{10,}$/.test(value) // Avoid converting long phone numbers to numbers
      ) {
        value = Number(value);
      }
      acc[row.setting_key] = value;
      return acc;
    }, {});
    res.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route PUT /api/admin/settings
 * @description Updates global platform settings. Only accessible by administrators.
 * Performs a bulk upsert operation wrapped in a MySQL transaction.
 * @access Private/Admin
 * @param {Object} req.body - Key-value pairs of settings to update
 */
app.put("/api/admin/settings", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  const settings = req.body;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();
    for (const key in settings) {
      if (Object.hasOwnProperty.call(settings, key)) {
        const value = String(settings[key]); // Store all as strings
        await connection.execute(
          "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?",
          [key, value, value],
        );
      }
    }
    await connection.commit();
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Error updating settings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    connection.release();
  }
});

// --- Admin Routes ---

/**
 * @route GET /api/admin/users
 * @description Fetches all registered users for the Admin Dashboard.
 * @access Private/Admin
 * @returns {Array} List of users
 */
app.get("/api/admin/users", authenticateToken, async (req, res) => {
  // Security: Check if user is an admin
  if (req.user.role !== "admin") {
    // Fallback check against the database in case of older tokens without 'role' property
    try {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  try {
    // This query joins users with aggregated booking data to provide comprehensive stats
    // for each user in the admin dashboard.
    const [rows] = await pool.execute(`
      SELECT
          u.id,
          u.name,
          u.email,
          u.role,
          u.is_blocked,
          u.created_at,
          u.last_login,
          COALESCE(b_stats.total_bookings, 0) AS total_bookings,
          COALESCE(b_stats.total_spent, 0) AS total_spent,
          b_stats.last_booking_date
      FROM
          users u
      LEFT JOIN (
          SELECT
              user_id,
              COUNT(*) AS total_bookings,
              SUM(price * quantity) AS total_spent,
              MAX(booking_date) AS last_booking_date
          FROM
              bookings
          GROUP BY
              user_id
      ) AS b_stats ON u.id = b_stats.user_id
      ORDER BY u.id DESC
    `);
    res.json(rows);
  } catch (error) {
    // Gracefully handle if the bookings table doesn't exist yet
    if (
      error.code === "ER_NO_SUCH_TABLE" &&
      error.message.includes("bookings")
    ) {
      const [rows] = await pool.execute(
        "SELECT id, name, email, role, is_blocked, created_at, last_login FROM users ORDER BY id DESC",
      );
      const usersWithDefaults = rows.map((user) => ({
        ...user,
        total_bookings: 0,
        total_spent: 0,
        last_booking_date: null,
      }));
      return res.json(usersWithDefaults);
    }
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Update User (Admin Dashboard)
app.put("/api/admin/users/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    try {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  const { id } = req.params;
  const { name, email, role, is_blocked } = req.body;

  try {
    // Only update is_blocked if it was intentionally passed, mitigating accidental unblocks
    if (is_blocked !== undefined) {
      const isBlockedValue =
        is_blocked === true ||
        is_blocked === 1 ||
        is_blocked === "true" ||
        is_blocked === "1"
          ? 1
          : 0;
      await pool.execute(
        "UPDATE users SET name = ?, email = ?, role = ?, is_blocked = ? WHERE id = ?",
        [name, email, role, isBlockedValue, id],
      );
    } else {
      await pool.execute(
        "UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?",
        [name, email, role, id],
      );
    }
    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete User (Admin Dashboard)
app.delete("/api/admin/users/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    try {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  const { id } = req.params;

  try {
    await pool.execute("DELETE FROM cart_items WHERE user_id = ?", [id]);
    await pool.execute("DELETE FROM reviews WHERE user_id = ?", [id]);
    try {
      await pool.execute("DELETE FROM bookings WHERE user_id = ?", [id]);
    } catch (e) {
      /* ignore if table missing */
    }
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all bookings for Admin Dashboard
app.get("/api/admin/bookings", authenticateToken, async (req, res) => {
  // Security: Check if user is an admin
  if (req.user.role !== "admin") {
    try {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  try {
    const [rows] = await pool.execute(
      `SELECT b.*, u.name as user_name
       FROM bookings b
       JOIN users u ON b.user_id = u.id
       ORDER BY b.booking_date DESC`,
    );
    res.json(rows);
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") return res.json([]);
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Get all reviews for Admin Dashboard
app.get("/api/admin/reviews", authenticateToken, async (req, res) => {
  // Security: Check if user is an admin
  if (req.user.role !== "admin") {
    try {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM reviews ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") return res.json([]);
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route GET /api/admin/statistics
 * @description Fetches key performance indicators for the Admin Dashboard.
 * @access Private/Admin
 * @returns {Object} An object containing various statistics.
 */
app.get("/api/admin/statistics", authenticateToken, async (req, res) => {
  // Security: Check if user is an admin
  if (req.user.role !== "admin") {
    // A fallback check just in case.
    try {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  try {
    const [bookingStatsRows] = await pool.execute(`
        SELECT
            COUNT(*) as totalBookings,
            SUM(price * quantity) as totalRevenue,
            SUM(CASE WHEN booking_date >= DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN price * quantity ELSE 0 END) as weeklyRevenue
        FROM bookings
    `);

    const [activeUsersRows] = await pool.execute(
      "SELECT COUNT(*) as activeUsers FROM users WHERE is_blocked = 0 OR is_blocked IS NULL",
    );

    const bookingStats = bookingStatsRows[0];
    const totalBookings = Number(bookingStats.totalBookings) || 0;
    const totalRevenue = Number(bookingStats.totalRevenue) || 0;

    // AOV is Total Revenue / Total Bookings (line items). This represents the average value per booked service.
    const averageOrderValue =
      totalBookings > 0 ? totalRevenue / totalBookings : 0;

    const stats = {
      totalBookings: totalBookings,
      weeklyRevenue: Number(bookingStats.weeklyRevenue) || 0,
      activeUsers: activeUsersRows[0].activeUsers || 0,
      averageOrderValue: averageOrderValue,
    };

    res.json(stats);
  } catch (error) {
    // if bookings table doesn't exist yet
    if (
      error.code === "ER_NO_SUCH_TABLE" &&
      error.message.includes("bookings")
    ) {
      const [activeUsersRows] = await pool.execute(
        "SELECT COUNT(*) as activeUsers FROM users WHERE is_blocked = 0 OR is_blocked IS NULL",
      );
      return res.json({
        totalBookings: 0,
        weeklyRevenue: 0,
        activeUsers: activeUsersRows[0].activeUsers || 0,
        averageOrderValue: 0,
      });
    }
    console.error("Error fetching admin statistics:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Coupons Routes ---

// GET all active coupons for users
app.get("/api/coupons", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT code, description, discount_percent FROM coupons WHERE is_active = 1 ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST to validate a coupon
app.post("/api/coupons/validate", async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: "Coupon code is required." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT discount_percent FROM coupons WHERE code = ? AND is_active = 1",
      [code.toUpperCase()],
    );

    if (rows.length > 0) {
      res.json({
        success: true,
        discount_percent: rows[0].discount_percent,
      });
    } else {
      res
        .status(404)
        .json({ success: false, error: "Invalid or expired coupon code." });
    }
  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Admin Coupon Routes ---

// GET all coupons for admin
app.get("/api/admin/coupons", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM coupons ORDER BY created_at DESC",
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching admin coupons:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST to add a new coupon
app.post("/api/admin/coupons", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  const { code, description, discount_percent } = req.body;
  if (!code || discount_percent === undefined) {
    return res
      .status(400)
      .json({ error: "Code and discount percent are required." });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO coupons (code, description, discount_percent) VALUES (?, ?, ?)",
      [code.toUpperCase(), description, discount_percent],
    );
    const [newCoupon] = await pool.execute(
      "SELECT * FROM coupons WHERE id = ?",
      [result.insertId],
    );
    res.status(201).json(newCoupon[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Coupon code already exists." });
    }
    console.error("Error adding coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT to update a coupon
app.put("/api/admin/coupons/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  const { id } = req.params;
  const { code, description, discount_percent, is_active } = req.body;

  if (!code || discount_percent === undefined) {
    return res
      .status(400)
      .json({ error: "Code and discount percent are required." });
  }

  try {
    await pool.execute(
      "UPDATE coupons SET code = ?, description = ?, discount_percent = ?, is_active = ? WHERE id = ?",
      [code.toUpperCase(), description, discount_percent, is_active, id],
    );
    const [updatedCoupon] = await pool.execute(
      "SELECT * FROM coupons WHERE id = ?",
      [id],
    );
    res.json(updatedCoupon[0]);
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({ error: "Coupon code already exists." });
    }
    console.error("Error updating coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE a coupon
app.delete("/api/admin/coupons/:id", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }
  const { id } = req.params;
  try {
    await pool.execute("DELETE FROM coupons WHERE id = ?", [id]);
    res.json({ message: "Coupon deleted successfully." });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Forgot Password Routes ---
// Mount the separated forgot password router, passing the db pool to it
app.use("/api/forgot-password", forgotPasswordRoutes(pool));

// --- Cart Routes ---

/**
 * @route GET /api/cart/:userId
 * @description Retrieves all active cart items for a specific user.
 * @access Private
 * @param {string} req.params.userId - ID of the user
 * @returns {Array} List of cart items
 */
app.get("/api/cart/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM cart_items WHERE user_id = ?",
      [userId],
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route POST /api/cart/add
 * @description Adds a new service to the user's cart or increments the quantity if it already exists.
 * @access Private
 * @param {Object} req.body.userId, req.body.service
 */
app.post("/api/cart/add", authenticateToken, async (req, res) => {
  const { userId, service } = req.body;

  if (!userId || !service || service.id === undefined) {
    return res
      .status(400)
      .json({ error: "userId and service details are required" });
  }

  try {
    // Check if item already exists in cart for this user
    const [existing] = await pool.execute(
      "SELECT * FROM cart_items WHERE user_id = ? AND service_id = ?",
      [userId, service.id],
    );

    if (existing.length > 0) {
      // Increase quantity if it's already in the cart
      await pool.execute(
        "UPDATE cart_items SET quantity = quantity + 1 WHERE user_id = ? AND service_id = ?",
        [userId, service.id],
      );
    } else {
      // Insert new cart item
      await pool.execute(
        "INSERT INTO cart_items (user_id, service_id, service_name, price, quantity) VALUES (?, ?, ?, ?, ?)",
        [userId, service.id, service.name || "Unknown", service.price || 0, 1],
      );
    }

    // Fetch the updated cart to return to the frontend
    const [updatedCart] = await pool.execute(
      "SELECT * FROM cart_items WHERE user_id = ?",
      [userId],
    );

    res
      .status(200)
      .json({ message: "Service added to cart", cart: updatedCart });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Remove item from Cart
app.delete(
  "/api/cart/remove/:userId/:serviceId",
  authenticateToken,
  async (req, res) => {
    const { userId, serviceId } = req.params;
    try {
      await pool.execute(
        "DELETE FROM cart_items WHERE user_id = ? AND service_id = ?",
        [userId, serviceId],
      );

      // Fetch the updated cart to return to the frontend
      const [updatedCart] = await pool.execute(
        "SELECT * FROM cart_items WHERE user_id = ?",
        [userId],
      );

      res
        .status(200)
        .json({ message: "Service removed from cart", cart: updatedCart });
    } catch (error) {
      console.error("Error removing from cart:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

/**
 * @route POST /api/checkout
 * @description Migrates all items from a user's cart into the bookings table,
 * and subsequently empties their cart, completing the purchase.
 * @access Private
 * @param {string} req.body.userId - ID of the user performing checkout
 */
app.post("/api/checkout", authenticateToken, async (req, res) => {
  const {
    userId,
    address,
    phone,
    scheduleDate,
    scheduleTime,
    paymentMethod,
  } = req.body;

  if (req.user.id.toString() !== userId.toString()) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  if (
    !userId ||
    !address ||
    !phone ||
    !scheduleDate ||
    !scheduleTime ||
    !paymentMethod
  ) {
    return res.status(400).json({ error: "All booking details are required" });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Get current cart items
    const [cartItems] = await connection.execute(
      "SELECT * FROM cart_items WHERE user_id = ?",
      [userId],
    );

    if (cartItems.length === 0) {
      await connection.rollback();
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Get user name to store in the booking for easier retrieval
    const [userRows] = await connection.execute(
      "SELECT name FROM users WHERE id = ?",
      [userId],
    );
    const userName = userRows.length > 0 ? userRows[0].name : "Unknown User";

    // 2. Move items into the bookings table
    const insertQuery = `
      INSERT INTO bookings (
        user_id, service_id, service_name, price, quantity, 
        user_name, address, phone, schedule_date, schedule_time, payment_method
      ) 
      SELECT 
        user_id, service_id, service_name, price, quantity, 
        ?, ?, ?, ?, ?, ? 
      FROM cart_items WHERE user_id = ?
    `;
    await connection.execute(
      insertQuery,
      [userName, address, phone, scheduleDate, scheduleTime, paymentMethod, userId],
    );

    // 3. Clear the user's cart in the database after successful booking
    await connection.execute("DELETE FROM cart_items WHERE user_id = ?", [userId]);

    await connection.commit();

    res
      .status(200)
      .json({ message: "Checkout successful, items moved to bookings" });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("Checkout error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  } finally {
    if (connection) connection.release();
  }
});

// --- Bookings Routes ---

/**
 * @route GET /api/provider/bookings
 * @description Retrieves all bookings for providers to service.
 * @access Private/Provider
 */
app.get("/api/provider/bookings", authenticateToken, async (req, res) => {
  if (req.user.role !== "provider" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Providers only." });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT * FROM bookings ORDER BY booking_date DESC"
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching provider bookings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * @route GET /api/bookings/:userId
 * @description Retrieves a user's booking history.
 * @access Private
 * @param {string} req.params.userId
 */
app.get("/api/bookings/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM bookings WHERE user_id = ?",
      [userId],
    );
    res.json(rows);
  } catch (error) {
    // Gracefully handle missing bookings table
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.json([]);
    }
    console.error("Error fetching bookings:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Reviews Routes ---

// Get latest reviews
app.get("/api/reviews", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT * FROM reviews ORDER BY created_at DESC LIMIT 10",
    );
    res.json(rows);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Add a new review
app.post("/api/reviews", authenticateToken, async (req, res) => {
  const { userId, name, review, rating } = req.body;

  if (!userId || !name || !review) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await pool.execute(
      "INSERT INTO reviews (user_id, name, review, rating) VALUES (?, ?, ?, ?)",
      [userId, name, review, rating || 5],
    );
    res.status(201).json({ message: "Review added successfully" });
  } catch (error) {
    console.error("Error adding review:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Categories Routes ---
app.get("/api/categories", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM categories");
    res.json(rows);
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Category Services Route ---
app.get("/api/categories/:id/services", async (req, res) => {
  try {
    const categoryId = req.params.id;
    const [categoryRows] = await pool.execute(
      "SELECT * FROM categories WHERE id = ?",
      [categoryId],
    );

    if (categoryRows.length === 0) {
      return res.status(404).json({ error: "Category not found" });
    }

    const [serviceRows] = await pool.execute(
      "SELECT * FROM services WHERE category_id = ? AND is_active = 1",
      [categoryId],
    );

    res.json({
      category: categoryRows[0].name,
      image: categoryRows[0].image,
      items: serviceRows.map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price),
        visit: Number(s.visit_price),
      })),
    });
  } catch (error) {
    console.error("Error fetching category services:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Public Services Route ---
app.get("/api/services", async (req, res) => {
  try {
    // Join services with categories so the frontend gets all required information instantly
    const [rows] = await pool.execute(`
      SELECT 
        s.id, s.name, s.price, s.visit_price, 
        c.id as category_id,
        c.name as category, 
        c.image as category_image 
      FROM services s
      JOIN categories c ON s.category_id = c.id WHERE s.is_active = 1
    `);

    // Group by category to match the frontend expected structure
    const groupedServices = rows.reduce((acc, current) => {
      const {
        category_id,
        category,
        category_image,
        id,
        name,
        price,
        visit_price,
      } = current;
      let cat = acc.find((c) => c.category === category);
      if (!cat) {
        cat = { id: category_id, category, image: category_image, items: [] };
        acc.push(cat);
      }
      cat.items.push({ id, name, price, visit: visit_price });
      return acc;
    }, []);

    res.json(groupedServices);
  } catch (error) {
    console.error("Error fetching services:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Popular Services Route ---
app.get("/api/popular-services", async (req, res) => {
  try {
    const [rows] = await pool.execute("SELECT * FROM popular_services");
    res.json(rows);
  } catch (error) {
    if (error.code === "ER_NO_SUCH_TABLE") {
      return res.json([]);
    }
    console.error("Error fetching popular services:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Admin Popular Services Route (Edit popular service) ---
app.put(
  "/api/admin/popular-services/:id",
  authenticateToken,
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const serviceId = req.params.id;
    const { name, price, image_url } = req.body;

    try {
      const [result] = await pool.execute(
        "UPDATE popular_services SET name = ?, price = ?, image_url = ? WHERE id = ?",
        [name, price, image_url, serviceId],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Popular service not found." });
      }

      const [updatedRows] = await pool.execute(
        "SELECT * FROM popular_services WHERE id = ?",
        [serviceId],
      );

      res.json(updatedRows[0]);
    } catch (error) {
      console.error("Error updating popular service:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// --- Admin Popular Services Route (Delete popular service) ---
app.delete(
  "/api/admin/popular-services/:id",
  authenticateToken,
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    try {
      const [result] = await pool.execute(
        "DELETE FROM popular_services WHERE id = ?",
        [req.params.id],
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Popular service not found." });
      }

      res.json({ message: "Popular service deleted successfully." });
    } catch (error) {
      console.error("Error deleting popular service:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

// --- Admin Popular Services Route (Add popular service) ---
app.post("/api/admin/popular-services", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Access denied. Admins only." });
  }

  const { name, price, image_url } = req.body;
  if (!name || !price || !image_url) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const [result] = await pool.execute(
      "INSERT INTO popular_services (name, price, image_url) VALUES (?, ?, ?)",
      [name, price, image_url],
    );

    res.status(201).json({
      message: "Popular service added successfully.",
      id: result.insertId,
    });
  } catch (error) {
    console.error("Error adding popular service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Admin Services Route (Get all services) ---
app.get("/api/admin/services", authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    try {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  try {
    // Defensive check to see if the `is_active` column has been added to the table yet.
    const [columns] = await pool.execute(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = 'services' AND column_name = 'is_active'",
      [process.env.DB_NAME],
    );
    const hasIsActiveColumn = columns.length > 0;

    const query = hasIsActiveColumn
      ? `
        SELECT s.id, s.name, s.price, s.visit_price, s.is_active, c.name as category 
        FROM services s 
        LEFT JOIN categories c ON s.category_id = c.id
        ORDER BY s.id DESC
      `
      : `
        SELECT s.id, s.name, s.price, s.visit_price, 1 as is_active, c.name as category 
        FROM services s 
        LEFT JOIN categories c ON s.category_id = c.id
        ORDER BY s.id DESC
      `;
    const [rows] = await pool.execute(query);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching admin services:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Admin Services Route (Add a new service) ---
app.post("/api/admin/services", authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    try {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  const { category_id, name, price, visit_price } = req.body;
  if (!category_id || !name || !price || !visit_price) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    await pool.execute(
      "INSERT INTO services (category_id, name, price, visit_price) VALUES (?, ?, ?, ?)",
      [category_id, name, price, visit_price],
    );
    res
      .status(201)
      .json({ message: "Service added and linked to category successfully!" });
  } catch (error) {
    console.error("Error adding service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Admin Services Route (Edit a service) ---
app.put("/api/admin/services/:id", authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    try {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  const serviceId = req.params.id;
  const { name, price, visit_price, is_active } = req.body;

  try {
    const [columns] = await pool.execute(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = 'services' AND column_name = 'is_active'",
      [process.env.DB_NAME],
    );
    const hasIsActiveColumn = columns.length > 0;

    let result;
    if (hasIsActiveColumn && is_active !== undefined) {
      const isActiveValue = is_active ? 1 : 0;
      [result] = await pool.execute(
        "UPDATE services SET name = ?, price = ?, visit_price = ?, is_active = ? WHERE id = ?",
        [name, price, visit_price, isActiveValue, serviceId],
      );
    } else {
      [result] = await pool.execute(
        "UPDATE services SET name = ?, price = ?, visit_price = ? WHERE id = ?",
        [name, price, visit_price, serviceId],
      );
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Service not found." });
    }

    res.json({ message: "Service updated successfully." });
  } catch (error) {
    console.error("Error updating service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- Admin Services Route (Delete a service) ---
app.delete("/api/admin/services/:id", authenticateToken, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== "admin") {
    try {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    } catch (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  try {
    const [result] = await pool.execute("DELETE FROM services WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Service not found." });
    }

    res.json({ message: "Service deleted successfully." });
  } catch (error) {
    console.error("Error deleting service:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Store for profile update OTPs
const profileUpdateOtpStore = {};

// Send OTP for Profile Update
app.post(
  "/api/user/:userId/send-update-otp",
  authenticateToken,
  async (req, res) => {
    const { userId } = req.params;

    if (req.user.id.toString() !== userId.toString()) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      const [rows] = await pool.execute(
        "SELECT email FROM users WHERE id = ?",
        [userId],
      );
      if (rows.length === 0)
        return res.status(404).json({ error: "User not found" });

      const userEmail = rows[0].email;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      profileUpdateOtpStore[userId] = {
        otp,
        expires: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
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
    } catch (error) {
      console.error("Error sending update OTP:", error);
      res.status(500).json({ error: "Failed to send OTP" });
    }
  },
);

/**
 * @route PUT /api/user/:userId
 * @description Updates a user's profile details. Requires OTP verification if the email
 * or phone number is being changed and the global setting mandates it.
 * @access Private
 * @param {string} req.body.name, req.body.email, req.body.phone, req.body.otp
 * @returns {Object} JSON with updated user details and a fresh JWT token
 */
app.put("/api/user/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;
  const { name, email, phone, address, otp } = req.body;

  // Security: only allow users to update their own account
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
        if (!otp) {
          return res
            .status(400)
            .json({ error: "OTP is required for changing email or phone" });
        }
        const storedOtpData = profileUpdateOtpStore[userId];
        if (!storedOtpData) {
          return res
            .status(400)
            .json({ error: "OTP not requested or expired" });
        }
        if (Date.now() > storedOtpData.expires) {
          delete profileUpdateOtpStore[userId];
          return res.status(400).json({ error: "OTP has expired" });
        }
        if (storedOtpData.otp !== otp.trim()) {
          return res.status(400).json({ error: "Invalid OTP" });
        }
        // OTP is valid, clear it
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
      settingsRows.length > 0 ? `${settingsRows[0].setting_value}m` : "120m";

    // Generate a fresh token in case the email was modified
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
      if (error.message.includes("phone")) {
        return res.status(409).json({ error: "Phone number already exists" });
      }
      if (error.message.includes("email")) {
        return res.status(409).json({ error: "Email already exists" });
      }
      return res.status(409).json({ error: "A unique field already exists." });
    }
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Delete User Account Route
app.delete("/api/user/:userId", authenticateToken, async (req, res) => {
  const { userId } = req.params;

  // Security: only allow users to delete their own account
  if (req.user.id.toString() !== userId.toString()) {
    return res
      .status(403)
      .json({ error: "Unauthorized to delete this account" });
  }

  try {
    // Delete associated items first to prevent foreign key constraint errors
    await pool.execute("DELETE FROM cart_items WHERE user_id = ?", [userId]);
    await pool.execute("DELETE FROM reviews WHERE user_id = ?", [userId]);
    await pool.execute("DELETE FROM users WHERE id = ?", [userId]);
    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the Node.js server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
