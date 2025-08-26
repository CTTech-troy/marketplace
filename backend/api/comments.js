const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { admin, db } = require("../firebaseAdmin.js");

/**
 * POST /api/comments
 * Body: { productId, text }
 * Creates a comment under products/{productId}/comments with commenter info pulled from users collection.
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { productId, text } = req.body || {};

    if (!productId || !text || typeof text !== "string" || !text.trim()) {
      return res.status(400).json({ error: "productId and non-empty text are required" });
    }

    // fetch basic user profile for display
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};
    const commenterName = userData.username || userData.email || "User";
    const commenterAvatar = (userData.profile && userData.profile.profilePic) || userData.profilePic || null;

    const now = admin.firestore.Timestamp.now();
    const comment = {
      commenterId: uid,
      commenterName,
      commenterAvatar,
      text: text.trim(),
      createdAt: now,
      updatedAt: now,
    };

    const commentsRef = db.collection("products").doc(productId).collection("comments");
    const added = await commentsRef.add(comment);

    // increment commentsCount on product (best-effort)
    const productRef = db.collection("products").doc(productId);
    await productRef.set({ commentsCount: admin.firestore.FieldValue.increment(1), updatedAt: now }, { merge: true });

    const created = { id: added.id, ...comment };
    return res.status(201).json({ success: true, comment: created });
  } catch (err) {
    console.error("comments.post error:", err && (err.stack || err));
    return res.status(500).json({ error: "Failed to create comment" });
  }
});

/**
 * GET /api/comments/product/:productId
 * Returns comments for a product ordered by createdAt ascending.
 */
router.get("/product/:productId", authenticate, async (req, res) => {
  try {
    const productId = req.params.productId;
    if (!productId) return res.status(400).json({ error: "productId is required" });

    const commentsRef = db
      .collection("products")
      .doc(productId)
      .collection("comments")
      .orderBy("createdAt", "asc");

    const snap = await commentsRef.get();
    const comments = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ success: true, comments });
  } catch (err) {
    console.error("comments.get error:", err && (err.stack || err));
    return res.status(500).json({ error: "Failed to fetch comments" });
  }
});

module.exports = router;