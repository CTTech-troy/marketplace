const express = require("express");
const { db } = require("../firebaseAdmin.js");

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ status: "ok", route: "/api/login", method: "GET" });
});

router.post("/", async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) return res.status(400).json({ error: "Missing fields" });

  try {
    const usersRef = db.collection("users");
    let q = await usersRef.where("email", "==", usernameOrEmail).limit(1).get();
    if (q.empty) {
      q = await usersRef.where("username", "==", usernameOrEmail).limit(1).get();
      if (q.empty) return res.status(404).json({ error: "User not found" });
    }

    const doc = q.docs[0];
    const user = doc.data();

    // NOTE: password verification is not implemented in this demo.
    // Replace with real password hash check before production.
    console.log("Login successful for user:", user._id || user.username || usernameOrEmail);
    return res.status(200).json({ status: "ok", action: "login", user });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: err.message || "Login failed" });
  }
});

module.exports = router;
