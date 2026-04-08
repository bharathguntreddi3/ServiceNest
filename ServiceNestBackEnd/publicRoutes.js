const express = require("express");
const pool = require("./db");
const authenticateToken = require("./authMiddleware");
const asyncHandler = require("./asyncHandler");

const router = express.Router();

// Public routes after logging in and the landing page

router.get("/status", asyncHandler(async (req, res) => {
    const [rows] = await pool.execute("SELECT 1 as status");
    res.json({ message: "Database connection is active", data: rows });
  }),
);

router.get( "/settings", asyncHandler(async (req, res) => {
    const [rows] = await pool.execute("SELECT * FROM settings");
    const settings = rows.reduce((acc, row) => {
      let value = row.setting_value;
      if (value === "true") value = true;
      else if (value === "false") value = false;
      else if (
        !isNaN(Number(value)) &&
        Number.isFinite(Number(value)) &&
        !/^\+\d{10,}$/.test(value)
      )
        value = Number(value);
      acc[row.setting_key] = value;
      return acc;
    }, {});
    res.json(settings);
  }),
);

router.get( "/coupons", asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
      "SELECT code, description, discount_percent FROM coupons WHERE is_active = 1 ORDER BY created_at DESC",
    );
    res.json(rows);
  }),
);

router.post("/coupons/validate", asyncHandler(async (req, res) => {
    const { code } = req.body;
    if (!code)
      return res.status(400).json({ error: "Coupon code is required." });

    const [rows] = await pool.execute(
      "SELECT discount_percent FROM coupons WHERE code = ? AND is_active = 1",
      [code.toUpperCase()],
    );
    if (rows.length > 0)
      res.json({ success: true, discount_percent: rows[0].discount_percent });
    else
      res
        .status(404)
        .json({ success: false, error: "Invalid or expired coupon code." });
  }),
);

router.get("/reviews", asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(
      "SELECT * FROM reviews ORDER BY created_at DESC LIMIT 10",
    );
    res.json(rows);
  }),
);

router.post("/reviews", authenticateToken, asyncHandler(async (req, res) => {
    const { userId, name, review, rating } = req.body;
    if (!userId || !name || !review)
      return res.status(400).json({ error: "Missing required fields" });

    await pool.execute(
      "INSERT INTO reviews (user_id, name, review, rating) VALUES (?, ?, ?, ?)",
      [userId, name, review, rating || 5],
    );
    res.status(201).json({ message: "Review added successfully" });
  }),
);

router.get("/categories", asyncHandler(async (req, res) => {
    const [rows] = await pool.execute("SELECT * FROM categories");
    res.json(rows);
  }),
);

router.get("/categories/:id/services", asyncHandler(async (req, res) => {
    const [categoryRows] = await pool.execute(
      "SELECT * FROM categories WHERE id = ?",
      [req.params.id],
    );
    if (categoryRows.length === 0)
      return res.status(404).json({ error: "Category not found" });
    const [serviceRows] = await pool.execute(
      "SELECT * FROM services WHERE category_id = ? AND is_active = 1",
      [req.params.id],
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
  }),
);

router.get("/services", asyncHandler(async (req, res) => {
    const [rows] = await pool.execute(`
      SELECT s.id, s.name, s.price, s.visit_price, c.id as category_id, c.name as category, c.image as category_image 
      FROM services s JOIN categories c ON s.category_id = c.id WHERE s.is_active = 1
    `);
    const groupedServices = rows.reduce((acc, current) => {
      let cat = acc.find((c) => c.category === current.category);
      if (!cat) {
        cat = {
          id: current.category_id,
          category: current.category,
          image: current.category_image,
          items: [],
        };
        acc.push(cat);
      }
      cat.items.push({
        id: current.id,
        name: current.name,
        price: current.price,
        visit: current.visit_price,
      });
      return acc;
    }, []);
    res.json(groupedServices);
  }),
);

router.get("/popular-services", asyncHandler(async (req, res) => {
    try {
      const [rows] = await pool.execute("SELECT * FROM popular_services");
      res.json(rows);
    } catch (error) {
      if (error.code === "ER_NO_SUCH_TABLE") return res.json([]);
      throw error;
    }
  }),
);

module.exports = router;
