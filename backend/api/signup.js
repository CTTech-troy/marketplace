// api/signup.js
const express = require("express");
const { db, auth } = require("../firebaseAdmin.js");

const router = express.Router();

router.post("/", async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: "Missing fields" });
  if (typeof password !== "string" || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    // check if user already exists in Firebase Auth
    try {
      const existingAuth = await auth.getUserByEmail(email);
      if (existingAuth && existingAuth.uid) {
        return res.status(409).json({ error: "Email is already registered. Try logging in." });
      }
    } catch (err) {
      // getUserByEmail throws if not found — ignore that case
      if (err.code && err.code !== "auth/user-not-found") {
        console.warn("getUserByEmail error:", err.message || err);
      }
    }

    // also check Firestore by email (defensive)
    const usersRef = db.collection("users");
    const q = await usersRef.where("email", "==", email).limit(1).get();
    if (!q.empty) return res.status(409).json({ error: "Email is already registered. Try logging in." });

    // create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: username,
    });

    const uid = userRecord.uid;
    const now = new Date();
    const userData = {
      _id: uid,
      username,
      email,
      // password is stored in Firebase Auth; don't store raw password here
      passwordHash: "",
      profile: { bio: "", location: "", profilePic: "", isAnonymous: false },
      role: "buyer",
      followersCount: 0,
      followingCount: 0,
      amountMadeFromSales: 0,
      walletBalance: 0,
      createdAt: now,
      updatedAt: now,
      authProvider: "firebase",
    };

    // store in Firestore using uid as document id
    await usersRef.doc(uid).set(userData);

    // respond with created user (sanitized)
    const returned = { ...userData };
    delete returned.passwordHash;
    return res.status(201).json({ message: "Signup successful. User created and logged.", user: returned });
  } catch (err) {
    console.error("Signup error:", err && err.stack ? err.stack : err);
    // translate common firebase auth errors
    if (err.code && err.code.startsWith("auth/")) {
      return res.status(400).json({ error: err.message || "Auth error" });
    }
    return res.status(500).json({ error: err.message || "Signup failed" });
  }
});

module.exports = router;
