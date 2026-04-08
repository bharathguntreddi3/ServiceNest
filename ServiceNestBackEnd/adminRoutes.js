/* eslint-disable no-unused-vars */
const express = require("express");
const pool = require("./db");
const authenticateToken = require("./authMiddleware");   // JWT middleware
const asyncHandler = require("./asyncHandler");

const adminRouter = express.Router();

// Below routes are for the admin dashboard
// In every route check the authenticateToken, to ensure that the user is legit and the token is not tampered
// Only admins should see the admin Dashboard

// Settings API takes key-values, and stores in settings table
adminRouter.put("/settings", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const settings = req.body;
    const connection = await pool.getConnection();

    try {
      // start sql transaction to ensure all run accordingly 
      await connection.beginTransaction();
      for (const key in settings) {
        // check it has its own property rather than inherited
        if (Object.hasOwnProperty.call(settings, key)) {
          const value = String(settings[key]);
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
        throw error; // Forwarded to global error handler
    } finally {
        connection.release();
    }
  }),
);

adminRouter.get("/users", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin") {
        return res.status(403).json({ error: "Access denied. Admins only." });
      }
    }

    try {
      const [rows] = await pool.execute(`
        SELECT
            u.id, u.name, u.email, u.role, u.is_blocked, u.created_at, u.last_login,
            COALESCE(b_stats.total_bookings, 0) AS total_bookings,
            COALESCE(b_stats.total_spent, 0) AS total_spent,
            b_stats.last_booking_date
        FROM users u
        LEFT JOIN (
            SELECT user_id, COUNT(*) AS total_bookings, SUM(price * quantity) AS total_spent, MAX(booking_date) AS last_booking_date
            FROM bookings GROUP BY user_id
        ) AS b_stats ON u.id = b_stats.user_id
        ORDER BY u.id DESC
      `);
      res.json(rows);
    } catch (error) {
      if (
        error.code === "ER_NO_SUCH_TABLE" &&
        error.message.includes("bookings")
      ) {
        const [rows] = await pool.execute(
          "SELECT id, name, email, role, is_blocked, created_at, last_login FROM users ORDER BY id DESC",
        );
        // default values if bookings doesn't exist
        const usersWithDefaults = rows.map((user) => ({
          ...user,
          total_bookings: 0,
          total_spent: 0,
          last_booking_date: null,
        }));
        return res.json(usersWithDefaults);
      }
      throw error;
    }
  }),
);

adminRouter.put("/users/:id", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin")
        return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { id } = req.params;
    const { name, email, role, is_blocked } = req.body;

    if (is_blocked !== undefined) {
      const isBlockedValue = is_blocked === true || is_blocked === 1 || is_blocked === "true" || is_blocked === "1" 
      ? 1 : 0;
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
  }),
);

adminRouter.delete("/users/:id", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin")
        return res.status(403).json({ error: "Access denied. Admins only." });
    }

    const { id } = req.params;
    await pool.execute("DELETE FROM cart_items WHERE user_id = ?", [id]);
    await pool.execute("DELETE FROM reviews WHERE user_id = ?", [id]);
    try {
      await pool.execute("DELETE FROM bookings WHERE user_id = ?", [id]);
    } catch (e) {
      //  ignore if missing
    }
    await pool.execute("DELETE FROM users WHERE id = ?", [id]);
    res.json({ message: "User deleted successfully" });
  }),
);

adminRouter.get("/bookings", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin")
        return res.status(403).json({ error: "Access denied. Admins only." });
    }

    try {
      const [rows] = await pool.execute(`
        SELECT b.*, u.name as user_name FROM bookings b JOIN users u ON b.user_id = u.id ORDER BY b.booking_date DESC
      `);
      res.json(rows);
    } catch (error) {
        if (error.code === "ER_NO_SUCH_TABLE") return res.json([]);
        throw error;
      }
  }),
);

adminRouter.get("/reviews", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin")
        return res.status(403).json({ error: "Access denied. Admins only." });
    }

    try {
      const [rows] = await pool.execute(
        "SELECT * FROM reviews ORDER BY created_at DESC",
      );
      res.json(rows);
    } catch (error) {
      if (error.code === "ER_NO_SUCH_TABLE") return res.json([]);
      throw error;
    }
  }),
);

adminRouter.get("/statistics", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin")
        return res.status(403).json({ error: "Access denied. Admins only." });
    }

    try {
      const [bookingStatsRows] = await pool.execute(`
        SELECT COUNT(*) as totalBookings, SUM(price * quantity) as totalRevenue, SUM(CASE WHEN booking_date >= DATE_SUB(NOW(), INTERVAL 1 WEEK) THEN price * quantity ELSE 0 END) as weeklyRevenue
        FROM bookings
      `);
      const [activeUsersRows] = await pool.execute(
        "SELECT COUNT(*) as activeUsers FROM users WHERE is_blocked = 0 OR is_blocked IS NULL",
      );
      const [providerRows] = await pool.execute(
        "SELECT COUNT(*) as totalProviders FROM users WHERE role = 'provider' AND (is_blocked = 0 OR is_blocked IS NULL)",
      );

      const bookingStats = bookingStatsRows[0];
      const totalBookings = Number(bookingStats.totalBookings) || 0;
      const totalRevenue = Number(bookingStats.totalRevenue) || 0;
      const averageOrderValue =
        totalBookings > 0 ? totalRevenue / totalBookings : 0;

      res.json({
        totalBookings: totalBookings,
        weeklyRevenue: Number(bookingStats.weeklyRevenue) || 0,
        activeUsers: activeUsersRows[0].activeUsers || 0,
        averageOrderValue: averageOrderValue,
        totalProviders: providerRows[0].totalProviders || 0,
      });
    } catch (error) {
      if (
        error.code === "ER_NO_SUCH_TABLE" &&
        error.message.includes("bookings")
      ) {
        const [activeUsersRows] = await pool.execute(
          "SELECT COUNT(*) as activeUsers FROM users WHERE is_blocked = 0 OR is_blocked IS NULL",
        );
        const [providerRows] = await pool.execute(
          "SELECT COUNT(*) as totalProviders FROM users WHERE role = 'provider' AND (is_blocked = 0 OR is_blocked IS NULL)",
        );
        return res.json({
          totalBookings: 0,
          weeklyRevenue: 0,
          activeUsers: activeUsersRows[0].activeUsers || 0,
          averageOrderValue: 0,
          totalProviders: providerRows[0].totalProviders || 0,
        });
      }
      throw error;
    }
  }),
);

adminRouter.get("/coupons", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied. Admins only." });
    const [rows] = await pool.execute(
      "SELECT * FROM coupons ORDER BY created_at DESC",
    );
    res.json(rows);
  }),
);

adminRouter.post("/coupons", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied. Admins only." });
    const { code, description, discount_percent } = req.body;
    if (!code || discount_percent === undefined)
      return res
        .status(400)
        .json({ error: "Code and discount percent are required." });

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
      if (error.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "Coupon code already exists." });
      throw error;
    }
  }),
);

adminRouter.put("/coupons/:id", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied. Admins only." }
    );
    const { id } = req.params;
    const { code, description, discount_percent, is_active } = req.body;

    if (!code || discount_percent === undefined){
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
      if (error.code === "ER_DUP_ENTRY")
        return res.status(409).json({ error: "Coupon code already exists." });
      throw error;
    }
  }),
);

adminRouter.delete("/coupons/:id", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin"){
      return res.status(403).json({ error: "Access denied. Admins only." });
    }
    await pool.execute("DELETE FROM coupons WHERE id = ?", [req.params.id]);
    res.json({ message: "Coupon deleted successfully." });
  }),
);

adminRouter.put("/popular-services/:id", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin"){
      return res.status(403).json({ error: "Access denied. Admins only." });
    }
    const { name, price, image_url } = req.body;
    const [result] = await pool.execute(
      "UPDATE popular_services SET name = ?, price = ?, image_url = ? WHERE id = ?",
      [name, price, image_url, req.params.id],
    );
    if (result.affectedRows === 0){
      return res.status(404).json({ error: "Popular service not found." });
    }
    const [updatedRows] = await pool.execute(
      "SELECT * FROM popular_services WHERE id = ?",
      [req.params.id],
    );
    res.json(updatedRows[0]);
  }),
);

adminRouter.delete("/popular-services/:id", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin"){
      return res.status(403).json({ error: "Access denied. Admins only." });
    }
    const [result] = await pool.execute(
      "DELETE FROM popular_services WHERE id = ?",
      [req.params.id],
    );
    if (result.affectedRows === 0){
      return res.status(404).json({ error: "Popular service not found." });
    }
    res.json({ message: "Popular service deleted successfully." });
  }),
);

adminRouter.post("/popular-services", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin"){
      return res.status(403).json({ error: "Access denied. Admins only." });
    }
    const { name, price, image_url } = req.body;
    if (!name || !price || !image_url){
      return res.status(400).json({ error: "All fields are required" });
    }
    const [result] = await pool.execute(
      "INSERT INTO popular_services (name, price, image_url) VALUES (?, ?, ?)",
      [name, price, image_url],
    );
    res
      .status(201)
      .json({
        message: "Popular service added successfully.",
        id: result.insertId,
      });
  }),
);

adminRouter.get("/services", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin")
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    const [columns] = await pool.execute(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = 'services' AND column_name = 'is_active'",
      [process.env.DB_NAME],
    );
    const hasIsActiveColumn = columns.length > 0;
    const query = hasIsActiveColumn
      ? `SELECT s.id, s.name, s.price, s.visit_price, s.is_active, c.name as category FROM services s LEFT JOIN categories c ON s.category_id = c.id ORDER BY s.id DESC`
      : `SELECT s.id, s.name, s.price, s.visit_price, 1 as is_active, c.name as category FROM services s LEFT JOIN categories c ON s.category_id = c.id ORDER BY s.id DESC`;
    const [rows] = await pool.execute(query);
    res.json(rows);
  }),
);

adminRouter.post("/services", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin")
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    const { category_id, name, price, visit_price } = req.body;
    if (!category_id || !name || !price || !visit_price)
      return res.status(400).json({ error: "All fields are required" });

    await pool.execute(
      "INSERT INTO services (category_id, name, price, visit_price) VALUES (?, ?, ?, ?)",
      [category_id, name, price, visit_price],
    );
    res
      .status(201)
      .json({ message: "Service added and linked to category successfully!" });
  }),
);

adminRouter.put("/services/:id", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin")
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    const { name, price, visit_price, is_active } = req.body;
    const [columns] = await pool.execute(
      "SELECT 1 FROM information_schema.columns WHERE table_schema = ? AND table_name = 'services' AND column_name = 'is_active'",
      [process.env.DB_NAME],
    );

    let result;
    if (columns.length > 0 && is_active !== undefined) {
      [result] = await pool.execute(
        "UPDATE services SET name = ?, price = ?, visit_price = ?, is_active = ? WHERE id = ?",
        [name, price, visit_price, is_active ? 1 : 0, req.params.id],
      );
    } else {
      [result] = await pool.execute(
        "UPDATE services SET name = ?, price = ?, visit_price = ? WHERE id = ?",
        [name, price, visit_price, req.params.id],
      );
    }
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Service not found." });
    res.json({ message: "Service updated successfully." });
  }),
);

adminRouter.delete("/services/:id", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "admin") {
      const [adminCheck] = await pool.execute(
        "SELECT role FROM users WHERE id = ?",
        [req.user.id],
      );
      if (adminCheck.length === 0 || adminCheck[0].role !== "admin")
        return res.status(403).json({ error: "Access denied. Admins only." });
    }
    const [result] = await pool.execute("DELETE FROM services WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Service not found." });
    res.json({ message: "Service deleted successfully." });
  }),
);

module.exports = adminRouter;