// backend/src/routes/walletRoutes.js
import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import {
  getWalletBalance,
  creditWallet,
  listTransactions,
  initializeWalletFunding,
  verifyMonnifyPayment,
} from "../controllers/walletController.js";

const router = express.Router();

// ✅ Each route now has a proper function as handler
router.get("/", verifyFirebaseToken, getWalletBalance);
router.post("/credit", verifyFirebaseToken, creditWallet);
router.get("/transactions", verifyFirebaseToken, listTransactions);
router.post("/fund", verifyFirebaseToken, initializeWalletFunding);
router.post("/verify-payment", verifyFirebaseToken, verifyMonnifyPayment);

export default router;
