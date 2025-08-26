const express = require("express");
const router = express.Router();
let db;
let admin;
try {
  const fbAdmin = require("../firebaseAdmin.js");
  if (fbAdmin && fbAdmin.db) {
    db = fbAdmin.db;
    admin = fbAdmin.admin || require("firebase-admin");
  } else {
    admin = require("firebase-admin");
    db = admin.firestore();
  }
} catch (err) {
  // last-resort fallback
  admin = require("firebase-admin");
  db = admin.firestore();
}

// GET /api/notifications/:userId
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // avoid composite index requirement by querying only with where()
    const snap = await db.collection("notifications")
      .where("user_id", "==", userId)
      .limit(500) // limit to reasonable number
      .get();

    const notifications = snap.docs.map(d => {
      const data = d.data();
      return { id: d.id, ...data };
    });

    // normalize timestamp to milliseconds and sort descending by created_at
    const toMillis = (v) => {
      if (!v) return 0;
      if (typeof v.toMillis === "function") return v.toMillis(); // Firestore Timestamp
      const t = new Date(v);
      return isNaN(t.getTime()) ? 0 : t.getTime();
    };

    notifications.sort((a, b) => toMillis(b.created_at) - toMillis(a.created_at));

    const unreadCount = notifications.filter(n => !n.is_read).length;
    return res.json({ notifications, unreadCount });
  } catch (err) {
    console.error("notifications.get error:", err && (err.stack || err));
    return res.status(500).json({ error: err.message || "Failed to fetch notifications" });
  }
});

// POST /api/notifications
router.post("/", async (req, res) => {
  try {
    const { user_id, title, message, type = "system", meta = {} } = req.body;
    if (!user_id || !title || !message) return res.status(400).json({ error: "Missing fields" });

    const createdAt = (admin && admin.firestore && admin.firestore.Timestamp)
      ? admin.firestore.Timestamp.now()
      : new Date();

    const docRef = db.collection("notifications").doc();
    const data = { user_id, title, message, type, is_read: false, created_at: createdAt, meta };
    await docRef.set(data);
    const io = req.app.get("io");
    if (io) io.to(`user:${user_id}`).emit("notification", { id: docRef.id, ...data });
    return res.status(201).json({ notification: { id: docRef.id, ...data } });
  } catch (err) {
    console.error("notifications.post error:", err);
    return res.status(500).json({ error: err.message || "Failed to create notification" });
  }
});

// PATCH /api/notifications/:id/read
router.patch("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;
    await db.collection("notifications").doc(id).update({ is_read: true });
    return res.json({ ok: true });
  } catch (err) {
    console.error("notifications.patch error:", err);
    return res.status(500).json({ error: err.message || "Failed to mark read" });
  }
});

module.exports = router;