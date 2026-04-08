/* eslint-disable no-unused-vars */
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
const pool = require("./db");
const forgotPasswordRoutes = require("./forgotPasswordRoutes");
const authRoutes = require("./authRoutes");
const adminRoutes = require("./adminRoutes");
const shopRoutes = require("./shopRoutes");
const publicRoutes = require("./publicRoutes");

const app = express();
const port = process.env.PORT;

// Enable CORS so that our FrontEnd can communicate with this API
app.use(cors({ origin: "http://localhost:5173" }));

// Middleware to parse JSON request bodies
app.use(express.json());

// Forgot Password Routes
// Mount the separated forgot password router, passing the db pool to it
app.use("/api/forgot-password", forgotPasswordRoutes(pool));

app.use("/api", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api", shopRoutes);
app.use("/api", publicRoutes);

/**
 * Global Error Handling Middleware
 * Catches any errors thrown (or passed to next()) in the routes.
 */
app.use((err, req, res, next) => {
  console.error("Global Error Caught:", err);
  const statusCode = err.status || 500;
  res
    .status(statusCode)
    .json({ error: err.message || "Internal Server Error" });
});

// Start the Node.js server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
