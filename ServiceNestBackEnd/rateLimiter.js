const rateLimit = require("express-rate-limit");

const strictRateLimiter = rateLimit({
  windowMs: 120 * 60 * 1000, // 2hrs refresh time
  max: 5,
  message: { error: "Too many requests, please try again after 2 hours" }, // Limit each IP to 5 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Differentiate users by their auth token (if logged in) to prevent blocking everyone on the same IP
    const authHeader = req.headers["authorization"];
    if (authHeader) return authHeader.split(" ")[1];

    // Differentiate by email for login/register routes where tokens don't exist yet
    if (req.body && req.body.email) return req.body.email.trim().toLowerCase();

    return req.ip; // Fallback to IP address
  },
});

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes refresh time
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const authHeader = req.headers["authorization"];
    if (authHeader) return authHeader.split(" ")[1];

    if (req.body && req.body.email) return req.body.email.trim().toLowerCase();

    return req.ip;
  },
});

module.exports = { strictRateLimiter, globalLimiter };
