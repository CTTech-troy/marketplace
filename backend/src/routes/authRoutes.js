import express from "express";
import {
  signup,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  login,
  googleAuth,
} from "../controllers/authController.js";

const router = express.Router();

// ----------------------- Auth Routes -----------------------

// Signup with email/password
router.post("/signup", signup);

// Verify OTP
router.post("/verify-otp", verifyOtp);

// Resend OTP
router.post("/resend-otp", resendOtp);

// Forgot password → sends reset link
router.post("/forgot-password", forgotPassword);

// Reset password → use token from email
router.post("/reset-password", resetPassword);

// Login with email/password
router.post("/login", login);

// Google signup/login
router.post("/google", googleAuth);

export default router;
