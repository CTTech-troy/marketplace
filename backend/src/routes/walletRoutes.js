import express from "express";
import * as walletController from "../controllers/walletController.js";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Wallet endpoints
router.get("/", verifyFirebaseToken, walletController.getWalletBalance);
router.post("/credit", verifyFirebaseToken, walletController.creditWallet);
router.post("/debit", verifyFirebaseToken, walletController.debitWallet);
router.get("/transactions", verifyFirebaseToken, walletController.listTransactions);

// Monnify
router.post("/fund", verifyFirebaseToken, walletController.initializeWalletFunding);
router.post("/verify", verifyFirebaseToken, walletController.verifyMonnifyPayment);

export default router;
