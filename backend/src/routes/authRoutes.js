import express from "express";
import {
  googleAuth,
  signup,
  login,
  sendVerificationCode,
  verifyCode,
  getProfile,
  updateProfile,
  session
} from "../controllers/authController.js";
import verifyFirebaseToken from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/google", googleAuth);
router.post("/signup", signup);
router.post("/login", login);
router.post("/send-code", sendVerificationCode);
router.post("/verify-code", verifyCode);
router.get("/profile", verifyFirebaseToken, getProfile);
router.put("/profile", verifyFirebaseToken, updateProfile);
router.post("/session", session);

router.get("/me", verifyFirebaseToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
