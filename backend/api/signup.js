// api/signup.js
const express = require("express");
const { admin, auth, db } = require("../firebaseAdmin.js");
const { buildUserData } = require("../utils/userData");
const nodemailer = require("nodemailer");

const router = express.Router();

function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Configure nodemailer transporter (use your email credentials)
const transporter = nodemailer.createTransport({
  service: "gmail", // e.g., Gmail
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/", async (req, res) => {
  const { username, email, password, role, phone } = req.body;

  const authHeader = req.headers.authorization || "";
  let uid;
  let userRecord;

  try {
    if (authHeader.startsWith("Bearer ")) {
      // Existing Google OAuth user
      const idToken = authHeader.split(" ")[1];
      const decoded = await admin.auth().verifyIdToken(idToken);
      uid = decoded.uid;
      userRecord = await admin.auth().getUser(uid);
    } else {
      // Manual signup
      if (!username || !email || !password) {
        return res.status(400).json({ error: "username, email and password are required" });
      }
      if (typeof password !== "string" || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check if username already exists in Firestore
      const usernameSnap = await db.collection("users").where("username", "==", username).get();
      if (!usernameSnap.empty) {
        return res.status(400).json({ error: "Username is already taken" });
      }

      // Create user in Firebase Auth
      userRecord = await auth.createUser({
        email,
        password,
        displayName: username,
      });
      uid = userRecord.uid;
    }

    // Build consistent Firestore user object
    const now = admin.firestore.Timestamp.now();
    const verificationCode = generateCode();

    const userData = buildUserData(userRecord, {
      uid,
      username: username || userRecord.displayName || "",
      email: email || userRecord.email || "",
      phone: phone || userRecord.phoneNumber || null,
      role: role === "seller" ? "seller" : "buyer",
      isVerified: false,
      createdAt: now,
      updatedAt: now,
      products: [],
      orders: [],
      messages: [],
      walletTransactions: [],
      reviews: [],
      notifications: [],
      Comments: [],
    });

    // Save/merge to Firestore
    await db.collection("users").doc(uid).set(
      {
        ...userData,
        verificationCode,
        verificationExpires: admin.firestore.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      },
      { merge: true }
    );

    // Send verification code via email for manual signup
    if (!authHeader.startsWith("Bearer ")) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: userData.email,
        subject: "Your Verification Code",
        text: `Your 4-digit verification code is: ${verificationCode}`,
      });
    }

    console.log(`Verification code for ${userData.email}: ${verificationCode}`);

    return res.status(201).json({
      message: "Signup successful. A 4-digit code was sent to your email (if configured).",
      user: { ...userData, verificationCode: undefined },
    });
  } catch (err) {
    console.error("Signup error:", err);
    const code = err && err.code;
    if (typeof code === "string" && code.startsWith("auth/")) {
      return res.status(400).json({ error: err.message || code });
    }
    return res.status(500).json({ error: err.message || "Signup failed" });
  }
});

module.exports = router;
