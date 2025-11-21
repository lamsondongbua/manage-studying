const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

const {
  register,
  login,
  logout,
  profile,
  refresh,
  googleLogin,
  forgotPassword,
  verifyOTP,
  resetPassword,
} = require("../controllers/authController");

// Basic
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/profile", auth, profile);
router.post("/refresh", refresh);

// Google Login
router.post("/google", googleLogin);

// Forgot Password
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

module.exports = router;
