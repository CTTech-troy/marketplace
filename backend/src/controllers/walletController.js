import { admin } from "../config/firebase.js";
import axios from "axios";
import monnify from "../config/monnify.js";

const db = admin.firestore();
const usersCol = db.collection("users");
const walletTxCol = db.collection("walletTransactions");
const profilesCol = db.collection("profiles");

// ------------------- Helpers -------------------

// Get user doc by uid
const getUserDoc = async (uid) => {
  const snap = await usersCol.doc(uid).get();
  if (!snap.exists) throw new Error("User not found");
  return snap;
};

// Get profile doc by uid
const getProfileDoc = async (uid) => {
  const snap = await profilesCol.doc(uid).get();
  if (!snap.exists) throw new Error("Profile not found");
  return snap;
};

// ------------------- Wallet Controllers -------------------

// Get wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    console.log("🔎 Fetching wallet balance for UID:", req.user.uid);
    const userSnap = await getUserDoc(req.user.uid);
    const user = userSnap.data();
    res.json({ walletBalance: user.walletBalance ?? 0 });
  } catch (err) {
    console.error("❌ Error fetching wallet balance:", err.message);
    res.status(404).json({ error: err.message });
  }
};

// Credit wallet
export const creditWallet = async (req, res) => {
  try {
    console.log("💳 Credit wallet request:", req.body);
    const { amount, reason } = req.body;
    if (!amount || amount <= 0)
      return res.status(400).json({ error: "Invalid amount" });

    const userSnap = await getUserDoc(req.user.uid);
    const user = userSnap.data();
    const newBalance = (user.walletBalance ?? 0) + amount;

    // Update user & profile balances
    await usersCol.doc(req.user.uid).update({
      walletBalance: newBalance,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    await profilesCol.doc(req.user.uid).update({
      walletBalance: newBalance,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    // Add transaction record
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

// Debit wallet
export const debitWallet = async (req, res) => {
  try {
    console.log("💸 Debit wallet request:", req.body);
    const { amount, reason } = req.body;

    const userSnap = await getUserDoc(req.user.uid);
    const user = userSnap.data();

    if ((user.walletBalance ?? 0) < amount)
      return res.status(400).json({ error: "Insufficient balance" });

    const newBalance = (user.walletBalance ?? 0) - amount;

    await usersCol.doc(req.user.uid).update({
      walletBalance: newBalance,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    await profilesCol.doc(req.user.uid).update({
      walletBalance: newBalance,
      updatedAt: admin.firestore.Timestamp.now(),
    });

    const now = admin.firestore.Timestamp.now();
    await walletTxCol.add({
      userId: req.user.uid,
      type: "debit",
      amount,
      reason,
      status: "completed",
      createdAt: now,
      updatedAt: now,
    });

    res.json({ message: "Wallet debited", walletBalance: newBalance });
  } catch (err) {
    console.error("❌ Error debiting wallet:", err.message);
    res.status(500).json({ error: "Failed to debit wallet" });
  }
};

// List wallet transactions
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

// ------------------- Monnify Integration -------------------

// Get Monnify access token
const getMonnifyAccessToken = async () => {
  const token = Buffer.from(
    `${monnify.apiKey}:${monnify.apiSecret}`
  ).toString("base64");

  const res = await axios.post(
    `${monnify.baseUrl}/auth/login`,
    {},
    { headers: { Authorization: `Basic ${token}` } }
  );

  return res.data.response.accessToken;
};

// Initialize Monnify wallet funding
export const initializeWalletFunding = async (req, res) => {
  try {
    console.log("💰 Wallet funding request received:", req.body);

    const { amount } = req.body;
    if (!amount || amount <= 0) {
      console.log("❌ Invalid amount in request body:", amount);
      return res.status(400).json({ error: "Invalid amount" });
    }

    const userSnap = await getUserDoc(req.user.uid);
    const user = userSnap.data();

    const accessToken = await getMonnifyAccessToken();
    console.log("✅ Monnify Access Token acquired");

    const paymentData = {
      amount,
      currencyCode: "NGN",
      contractCode: monnify.contractCode,
      customerEmail: user.email,
      paymentReference: `WALLET-${req.user.uid}-${Date.now()}`,
      redirectUrl: `${process.env.FRONTEND_URL}/wallet/funding-success`,
      paymentDescription: "Wallet funding",
    };

    console.log("📤 Sending init request to Monnify:", paymentData);

    const response = await axios.post(
      `${monnify.baseUrl}/payments/init-transaction`,
      paymentData,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    console.log("✅ Monnify response:", response.data);

    res.json({
      paymentUrl: response.data.response.checkoutUrl,
      reference: paymentData.paymentReference,
    });
  } catch (err) {
    console.error("❌ Monnify Init Error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to initialize Monnify payment" });
  }
};

// Verify Monnify payment
export const verifyMonnifyPayment = async (req, res) => {
  try {
    console.log("🔎 Verifying payment:", req.body);

    const { paymentReference } = req.body;
    if (!paymentReference)
      return res.status(400).json({ error: "Payment reference required" });

    const accessToken = await getMonnifyAccessToken();

    const response = await axios.get(
      `${monnify.baseUrl}/transactions/${paymentReference}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const tx = response.data.response;
    console.log("✅ Monnify verification response:", tx);

    if (tx.paymentStatus === "PAID") {
      const userSnap = await usersCol
        .where("email", "==", tx.customer.email)
        .limit(1)
        .get();

      if (userSnap.empty) throw new Error("User not found");

      const userId = userSnap.docs[0].id;
      const user = userSnap.docs[0].data();
      const newBalance = (user.walletBalance ?? 0) + tx.amountPaid;

      await usersCol.doc(userId).update({
        walletBalance: newBalance,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      await profilesCol.doc(userId).update({
        walletBalance: newBalance,
        updatedAt: admin.firestore.Timestamp.now(),
      });

      const now = admin.firestore.Timestamp.now();
      await walletTxCol.add({
        userId,
        type: "credit",
        amount: tx.amountPaid,
        reason: "Monnify deposit",
        status: "completed",
        createdAt: now,
        updatedAt: now,
      });

      return res.json({
        message: "Wallet funded successfully",
        walletBalance: newBalance,
      });
    }

    res.status(400).json({ error: "Payment not completed" });
  } catch (err) {
    console.error("❌ Payment verification error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to verify Monnify payment" });
  }
};
