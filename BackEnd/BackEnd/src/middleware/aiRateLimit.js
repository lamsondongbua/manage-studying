const rateLimit = require("express-rate-limit");

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: "Too many AI requests, please focus on studying!",
});

module.exports = {
  aiLimiter,
};
