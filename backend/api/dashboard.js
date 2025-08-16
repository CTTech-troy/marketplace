const express = require("express");
const { db } = require("../firebaseAdmin.js");

const router = express.Router();

// POST /api/users/fetch
// body: { ids: ["uid1","uid2", ...] }
router.post("/fetch", async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Provide an array of user ids in body.ids" });
  }

  try {
    // fetch documents in parallel
    const snaps = await Promise.all(ids.map((id) => db.collection("users").doc(id).get()));

    const users = snaps.map((snap, i) => {
      if (!snap.exists) {
        console.warn(`User not found: ${ids[i]}`);
        return { id: ids[i], found: false };
      }
      const data = snap.data();
      console.log("User details for", ids[i], data);
      return { id: ids[i], found: true, data };
    });

    return res.json({ count: users.length, users });
  } catch (err) {
    console.error("Failed to fetch user details:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: err.message || "Failed to fetch users" });
  }
});

// GET /api/users/:id  — fetch single user and log
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const snap = await db.collection("users").doc(id).get();
    if (!snap.exists) {
      console.warn(`User not found: ${id}`);
      return res.status(404).json({ error: "User not found" });
    }
    const data = snap.data();
    console.log("User details for", id, data);
    return res.json({ user: data });
  } catch (err) {
    console.error("Failed to fetch user:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: err.message || "Failed to fetch user" });
  }
});

module.exports = router;