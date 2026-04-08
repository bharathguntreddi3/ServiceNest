const express = require("express");
const pool = require("./db");
const authenticateToken = require("./authMiddleware");
const asyncHandler = require("./asyncHandler");

const router = express.Router();

// routes for the cart items and

/**
 * @route GET /cart/:userId
 * @description Retrieves all active cart items for a specific user.
 * @access Private
 */
router.get("/cart/:userId", authenticateToken, asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const [rows] = await pool.execute(
      "SELECT * FROM cart_items WHERE user_id = ?",
      [userId],
    );
    res.json(rows);
  }),
);

/**
 * @route POST /cart/add
 * @description Adds a new service to the user's cart or increments the quantity if it already exists.
 * @access Private
 */
router.post("/cart/add", authenticateToken, asyncHandler(async (req, res) => {
    const { userId, service } = req.body;
    if (!userId || !service || service.id === undefined) {
      return res
        .status(400)
        .json({ error: "userId and service details are required" });
    }

    const [existing] = await pool.execute(
      "SELECT * FROM cart_items WHERE user_id = ? AND service_id = ?",
      [userId, service.id],
    );
    if (existing.length > 0) {
      await pool.execute(
        "UPDATE cart_items SET quantity = quantity + 1 WHERE user_id = ? AND service_id = ?",
        [userId, service.id],
      );
    } else {
      await pool.execute(
        "INSERT INTO cart_items (user_id, service_id, service_name, price, quantity) VALUES (?, ?, ?, ?, ?)",
        [userId, service.id, service.name || "Unknown", service.price || 0, 1],
      );
    }
    const [updatedCart] = await pool.execute(
      "SELECT * FROM cart_items WHERE user_id = ?",
      [userId],
    );
    res
      .status(200)
      .json({ message: "Service added to cart", cart: updatedCart });
  }),
);

/**
 * @route PUT /cart/decrement
 * @description Decrements the quantity of a cart item, or removes it entirely if the quantity drops below 1.
 * @access Private
 */
router.put("/cart/decrement", authenticateToken, asyncHandler(async (req, res) => {
    const { userId, serviceId } = req.body;
    if (!userId || !serviceId) {
      return res
        .status(400)
        .json({ error: "userId and serviceId are required" });
    }

    const [existing] = await pool.execute(
      "SELECT quantity FROM cart_items WHERE user_id = ? AND service_id = ?",
      [userId, serviceId],
    );
    if (existing.length > 0) {
      if (existing[0].quantity > 1) {
        await pool.execute(
          "UPDATE cart_items SET quantity = quantity - 1 WHERE user_id = ? AND service_id = ?",
          [userId, serviceId],
        );
      } else {
        await pool.execute(
          "DELETE FROM cart_items WHERE user_id = ? AND service_id = ?",
          [userId, serviceId],
        );
      }
    }
    const [updatedCart] = await pool.execute(
      "SELECT * FROM cart_items WHERE user_id = ?",
      [userId],
    );
    res.status(200).json({ message: "Quantity decreased", cart: updatedCart });
  }),
);

/**
 * @route DELETE /cart/remove/:userId/:serviceId
 * @description Completely removes a specific service from a user's cart.
 * @access Private
 */
router.delete("/cart/remove/:userId/:serviceId", authenticateToken, asyncHandler(async (req, res) => {
    const { userId, serviceId } = req.params;
    await pool.execute(
      "DELETE FROM cart_items WHERE user_id = ? AND service_id = ?",
      [userId, serviceId],
    );
    const [updatedCart] = await pool.execute(
      "SELECT * FROM cart_items WHERE user_id = ?",
      [userId],
    );
    res
      .status(200)
      .json({ message: "Service removed from cart", cart: updatedCart });
  }),
);

/**
 * @route POST /checkout
 * @description Migrates all items from a user's cart into the bookings table,
 * and subsequently empties their cart, completing the purchase.
 * @access Private
 */
router.post("/checkout", authenticateToken, asyncHandler(async (req, res) => {
    const {
      userId,
      address,
      phone,
      scheduleDate,
      scheduleTime,
      paymentMethod,
    } = req.body;
    if (req.user.id.toString() !== userId.toString())
      return res.status(403).json({ error: "Unauthorized access" });
    if (
      !userId ||
      !address ||
      !phone ||
      !scheduleDate ||
      !scheduleTime ||
      !paymentMethod
    )
      return res
        .status(400)
        .json({ error: "All booking details are required" });

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [cartItems] = await connection.execute(
        "SELECT * FROM cart_items WHERE user_id = ?",
        [userId],
      );
      if (cartItems.length === 0) {
        await connection.rollback();
        return res.status(400).json({ error: "Cart is empty" });
      }

      const [userRows] = await connection.execute(
        "SELECT name FROM users WHERE id = ?",
        [userId],
      );
      const userName = userRows.length > 0 ? userRows[0].name : "Unknown User";

      const insertQuery = `
      INSERT INTO bookings (user_id, service_id, service_name, price, quantity, user_name, address, phone, schedule_date, schedule_time, payment_method) 
      SELECT user_id, service_id, service_name, price, quantity, ?, ?, ?, ?, ?, ? FROM cart_items WHERE user_id = ?
    `;
      await connection.execute(insertQuery, [
        userName,
        address,
        phone,
        scheduleDate,
        scheduleTime,
        paymentMethod,
        userId,
      ]);
      await connection.execute("DELETE FROM cart_items WHERE user_id = ?", [
        userId,
      ]);
      await connection.commit();

      res
        .status(200)
        .json({ message: "Checkout successful, items moved to bookings" });
    } catch (error) {
      if (connection) await connection.rollback();
      throw error; // Let the global error handler handle this!
    } finally {
      if (connection) connection.release();
    }
  }),
);

/**
 * @route GET /provider/bookings
 * @description Retrieves all bookings for providers to service.
 * @access Private/Provider or Admin
 */
router.get("/provider/bookings", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "provider" && req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied. Providers only." });
    const [rows] = await pool.execute(
      "SELECT * FROM bookings ORDER BY booking_date DESC",
    );
    res.json(rows);
  }),
);

/**
 * @route PUT /provider/bookings/:bookingId/status
 * @description Updates the status of a specific booking (e.g., 'Completed', 'Cancelled').
 * @access Private/Provider or Admin
 */
router.put("/provider/bookings/:bookingId/status", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "provider" && req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied. Providers only." });
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status is required." });

    const [result] = await pool.execute(
      "UPDATE bookings SET status = ? WHERE id = ?",
      [status, req.params.bookingId],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Booking not found." });
    const [updatedBookingRows] = await pool.execute(
      "SELECT * FROM bookings WHERE id = ?",
      [req.params.bookingId],
    );
    res.json(updatedBookingRows[0]);
  }),
);

/**
 * @route PUT /provider/bookings/:bookingId/reschedule
 * @description Updates the scheduled time of a specific booking.
 * @access Private/Provider or Admin
 */
router.put("/provider/bookings/:bookingId/reschedule", authenticateToken, asyncHandler(async (req, res) => {
    if (req.user.role !== "provider" && req.user.role !== "admin")
      return res.status(403).json({ error: "Access denied. Providers only." });
    const { newTime } = req.body;
    if (!newTime)
      return res.status(400).json({ error: "New time is required." });

    const [result] = await pool.execute(
      "UPDATE bookings SET schedule_time = ? WHERE id = ?",
      [newTime, req.params.bookingId],
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Booking not found." });
    res.json({ message: "Booking time updated successfully" });
  }),
);

/**
 * @route GET /bookings/:userId
 * @description Retrieves a user's entire booking history.
 * @access Private
 */
router.get("/bookings/:userId", authenticateToken, asyncHandler(async (req, res) => {
    try {
      const [rows] = await pool.execute(
        "SELECT * FROM bookings WHERE user_id = ?",
        [req.params.userId],
      );
      res.json(rows);
    } catch (error) {
      // We keep a specific try/catch here because we're conditionally handling a unique ER_NO_SUCH_TABLE error
      if (error.code === "ER_NO_SUCH_TABLE") return res.json([]);
      throw error;
    }
  }),
);

/**
 * @route DELETE /bookings/:userId/:bookingId
 * @description Cancels a pending booking for a user. Cancellations are only allowed up to 2 hours before the scheduled time.
 * @access Private
 */
router.delete("/bookings/:userId/:bookingId", authenticateToken, asyncHandler(async (req, res) => {
    const { userId, bookingId } = req.params;
    if (req.user.id.toString() !== userId.toString())
      return res.status(403).json({ error: "Unauthorized access" });

    const [rows] = await pool.execute(
      "SELECT schedule_date, schedule_time, status FROM bookings WHERE id = ? AND user_id = ?",
      [bookingId, userId],
    );
    if (rows.length === 0)
      return res.status(404).json({ error: "Booking not found." });
    const booking = rows[0];
    if (booking.status === "Completed" || booking.status === "Cancelled")
      return res
        .status(400)
        .json({
          error: "Cannot cancel a completed or already cancelled booking.",
        });

    if (booking.schedule_date && booking.schedule_time) {
      const [timePart, modifier] = booking.schedule_time
        .split(" - ")[0]
        .split(" ");
      let [hours, minutes] = timePart.split(":").map(Number);
      if (modifier === "PM" && hours < 12) hours += 12;
      if (modifier === "AM" && hours === 12) hours = 0;
      const scheduleDateTime = new Date(booking.schedule_date);
      scheduleDateTime.setHours(hours, minutes, 0, 0);
      if (
        new Date() >= new Date(scheduleDateTime.getTime() - 2 * 60 * 60 * 1000)
      ) {
        return res
          .status(400)
          .json({
            error:
              "Cancellations are only allowed up to 2 hours before the scheduled time.",
          });
      }
    }
    const [result] = await pool.execute(
      "DELETE FROM bookings WHERE id = ? AND user_id = ?",
      [bookingId, userId],
    );
    if (result.affectedRows === 0)
      return res.status(400).json({ error: "Failed to delete booking." });
    res.json({ message: "Booking cancelled successfully" });
  }),
);

module.exports = router;
