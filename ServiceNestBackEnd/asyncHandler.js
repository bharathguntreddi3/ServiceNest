/**
 * Wraps async Express route handlers to automatically catch errors
 * and pass them to the global error handling middleware via next().
 */

// (fn) => (req, res, next)  fn returns another function
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
