// api/signup.js
const express = require("express");
const { admin, auth, db } = require("../firebaseAdmin.js");
const { buildUserData } = require("../utils/userData");

const router = express.Router();

// helper to generate 4-digit code
function generateCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

router.post("/", async (req, res) => {
  const { username, email, password, role, phone } = req.body;
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "username, email and password are required" });
  }
  if (typeof password !== "string" || password.length < 6) {
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });
  }

  try {
    // ✅ create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username,
    });

    const uid = userRecord.uid;
    const now = admin.firestore.Timestamp.now();

    // generate 4-digit verification code
    const verificationCode = generateCode();

    // ✅ allow either "buyer" or "seller" (default = buyer)
    const userData = buildUserData(userRecord, {
      uid,
      username,
      email,
      phone: phone || userRecord.phoneNumber || null,
      role: role === "seller" ? "seller" : "buyer",
      isVerified: false,
      createdAt: now,
      updatedAt: now,
    });

    // attach verification code/expiry separately
    await db.collection("users").doc(uid).set(
      {
        ...userData,
        verificationCode,
        verificationExpires: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 10 * 60 * 1000)
        ),
      },
      { merge: true }
    );

    // 🔹 send code (here you could use Nodemailer, SendGrid, or SMS)
    console.log(`Verification code for ${email}: ${verificationCode}`);

    return res.status(201).json({
      message: "Signup successful. A 4-digit code was sent to your email.",
      user: { ...userData, verificationCode: undefined },
    });
  } catch (err) {
    console.error("Signup error:", err && (err.stack || err));
    const code = err && err.code;
    if (typeof code === "string" && code.startsWith("auth/")) {
      return res.status(400).json({ error: err.message || code });
    }
    return res
      .status(500)
      .json({ error: err && err.message ? err.message : "Signup failed" });
  }
});

module.exports = router;
