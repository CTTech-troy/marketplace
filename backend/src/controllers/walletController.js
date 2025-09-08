// backend/src/controllers/walletController.js
import { admin } from "../config/firebase.js";
import monnifyService from "../services/monnifyService.js";

const db = admin.firestore();
const walletsCol = db.collection("wallets");
const walletTxCol = db.collection("walletTransactions");
const usersCol = db.collection("users");

const getWalletDoc = async (uid) => {
  const snap = await walletsCol.doc(uid).get();
  if (!snap.exists) throw new Error("Wallet not found");
  return snap;
};

// ✅ Get wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    console.log("🔎 Fetching wallet balance for UID:", req.user.uid);
    const walletSnap = await getWalletDoc(req.user.uid);
    const wallet = walletSnap.data();
    res.json({ walletBalance: wallet.balance ?? 0 });
  } catch (err) {
    console.error("❌ Error fetching wallet balance:", err.message);
    res.status(404).json({ error: err.message });
  }
};

// ✅ Credit wallet manually
export const creditWallet = async (req, res) => {
  try {
    console.log("💳 Credit wallet request:", req.body);
    const { amount, reason } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ error: "Invalid amount" });

    const walletSnap = await getWalletDoc(req.user.uid);
    const wallet = walletSnap.data();
    const newBalance = (wallet.balance ?? 0) + amount;

    await walletsCol.doc(req.user.uid).update({
      balance: newBalance,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    const now = admin.firestore.Timestamp.now();
    await walletTxCol.add({
      userId: req.user.uid,
      type: "credit",
      amount,
      reason,
      status: "completed",
      createdAt: now,
      updatedAt: now,
    });

    res.json({ message: "Wallet credited", walletBalance: newBalance });
  } catch (err) {
    console.error("❌ Error crediting wallet:", err.message);
    res.status(500).json({ error: "Failed to credit wallet" });
  }
};

// ✅ List transactions
export const listTransactions = async (req, res) => {
  try {
    console.log("📜 Listing transactions for:", req.user.uid);
    const snaps = await walletTxCol
      .where("userId", "==", req.user.uid)
      .orderBy("createdAt", "desc")
      .get();

    const transactions = snaps.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json({ transactions });
  } catch (err) {
    console.error("❌ Error listing transactions:", err.message);
    res.status(500).json({ error: "Failed to list transactions" });
  }
};

// ✅ Initialize wallet funding (Monnify)
export const initializeWalletFunding = async (req, res) => {
  try {
    const { amount } = req.body;
    const amountNum = Number(amount);
    if (!amountNum || amountNum <= 0) {
      console.error("❌ Invalid amount provided:", amount);
      return res.status(400).json({ error: "Invalid amount" });
    }

    const userSnap = await usersCol.doc(req.user.uid).get();
    if (!userSnap.exists) {
      console.error("❌ User not found for UID:", req.user.uid);
      return res.status(404).json({ error: "User not found" });
    }

    const user = userSnap.data();

    const payload = {
      amount: amountNum,
      customerName: user.name || "Anonymous",
      customerEmail: user.email,
      paymentReference: `WALLET-${req.user.uid}-${Date.now()}`,
      currencyCode: "NGN",
      redirectUrl: `${process.env.FRONTEND_URL}/wallet/funding-success`,
      paymentDescription: "Wallet Funding",
    };

    console.log("📤 Sending payload to Monnify:", payload);

    const response = await monnifyService.initializeTransaction(payload);

    if (!response.requestSuccessful) {
      console.error("❌ Monnify Init Failed:", response.responseMessage);
      return res.status(400).json({
        error: response.responseMessage || "Monnify rejected request",
      });
    }

    res.json({
      paymentUrl: response.responseBody.checkoutUrl,
      reference: response.responseBody.paymentReference,
    });
  } catch (err) {
    console.error("❌ Monnify Funding Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// ✅ Verify Monnify payment
export const verifyMonnifyPayment = async (req, res) => {
  try {
    const { paymentReference } = req.body;
    if (!paymentReference)
      return res.status(400).json({ error: "Payment reference required" });

    const response = await monnifyService.verifyTransaction(paymentReference);
    console.log("🔎 Monnify Verify Response:", response);

    if (response.requestSuccessful && response.responseBody.paymentStatus === "PAID") {
      const walletSnap = await getWalletDoc(req.user.uid);
      const wallet = walletSnap.data();
      const newBalance = (wallet.balance ?? 0) + response.responseBody.amountPaid;

      await walletsCol.doc(req.user.uid).update({
        balance: newBalance,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      const now = admin.firestore.Timestamp.now();
      await walletTxCol.add({
        userId: req.user.uid,
        type: "credit",
        amount: response.responseBody.amountPaid,
        reason: "Monnify Deposit",
        status: "completed",
        createdAt: now,
        updatedAt: now,
      });

      return res.json({
        message: "Wallet funded successfully",
        walletBalance: newBalance,
      });
    }

    res.status(400).json({
      error: response.responseBody.paymentStatus || "Payment not completed yet",
    });
  } catch (err) {
    console.error("❌ Payment Verification Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
