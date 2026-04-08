const jwt = require("jsonwebtoken");
const pool = require("./db");
const asyncHandler = require("./asyncHandler");

// Authentication middleware

const authenticateToken = asyncHandler(async (req, res, next) => {
  // reads the header from the request token
  // JWT - specific data
  // Bearer Token - A security scheme/protocol
  // server generates a JWT and for future requests, then browser for any future requests it sends a bearer token
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Access denied. No token provided." });

  let decodedUser;
  try {
    // validates token signature
    decodedUser = jwt.verify(
      token,
      process.env.JWT_SECRET || "default_secret_key",
    );
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }

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
  req.user = decodedUser;
  next();
});

module.exports = authenticateToken;
