const express = require("express");
const { auth, db } = require("../firebaseAdmin.js");

const router = express.Router();

// sanity check
router.get("/", (req, res) => {
  res.json({ ok: true, route: "/api/google-auth" });
});

router.post("/", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "No ID token provided" });

  console.log("Received ID Token:", idToken && idToken.slice ? idToken.slice(0, 40) + "..." : idToken);

  try {
    // Verify token with Firebase Auth
    const decoded = await admin.auth().verifyIdToken(idToken);
    console.log("Decoded Token:", decoded);

    const uid = decoded.uid;
    const email = decoded.email || null;
    const name = decoded.name || (email ? email.split("@")[0] : "unknown");
    const photo = decoded.picture || null;

    // Try to find user in Firestore
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (userDoc.exists) {
      // User present -> treat as login
      const existing = userDoc.data();
      console.log("User exists in Firestore, logging in:", uid);
      return res.status(200).json({ status: "ok", action: "login", user: existing });
    }

    // User not present -> create account
    console.log("User not found in Firestore, creating:", uid);
    const now = new Date();
    const userData = {
      _id: uid,
      username: name,
      email,
      passwordHash: "",
      profile: {
        bio: "",
        location: "",
        profilePic: photo || "https://via.placeholder.com/150",
        isAnonymous: false,
      },
      role: "buyer",
      followersCount: 0,
      followingCount: 0,
      amountMadeFromSales: 0,
      walletBalance: 0,
      createdAt: now,
      updatedAt: now,
    };

    await userRef.set(userData);

    // initialize optional subcollections (non-fatal)
    const subcollections = ["products","orders","walletTransactions","messages","reviews","notifications","stories"];
    for (const col of subcollections) {
      try {
        await userRef.collection(col).doc("_init").set({ init: true });
      } catch (e) {
        console.warn(`Failed to init ${col} for ${uid}:`, e.message || e);
      }
    }

    const createdDoc = await userRef.get();
    console.log("User created in Firestore:", uid);
    return res.status(201).json({ status: "ok", action: "created", user: createdDoc.data() });
  } catch (error) {
    console.error("❌ Google Auth Error:", error && error.stack ? error.stack : error);
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
});

module.exports = router;
