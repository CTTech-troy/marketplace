const express = require("express");
const router = express.Router();
const { admin, db } = require("../firebaseAdmin.js");

/**
 * Helper: verify Authorization header Bearer token and return uid or null
 */
async function getRequesterUid(req) {
  try {
    const h = req.headers.authorization || "";
    const m = h.match(/^Bearer\s+(.+)$/i);
    if (!m) return null;
    const token = m[1];
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded && decoded.uid ? decoded.uid : null;
  } catch (err) {
    // invalid token -> treat as unauthenticated
    return null;
  }
}

/**
 * GET /api/user/:id
 * Public sanitized profile. If requester is owner (valid token) include extra non-sensitive fields.
 */
router.get("/:id", async (req, res) => {
  const uid = req.params.id;
  if (!uid) return res.status(400).json({ error: "user id required" });

  try {
    const requesterUid = await getRequesterUid(req);

    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });

    const user = snap.data() || {};

    // public safe fields
    const profile = {
      id: uid,
      username: user.username || user.displayName || "",
      avatar: (user.profile && user.profile.profilePic) || user.avatar || null,
      bio: user.bio || (user.profile && user.profile.bio) || "",
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      createdAt: user.createdAt || null,
      isVerified: !!user.isVerified,
    };

    // If requester is owner, include some extra non-sensitive fields (still hide balances)
    if (requesterUid && requesterUid === uid) {
      profile.email = user.email || null;
      profile.profile = user.profile || {};
      profile.isOwner = true;
    } else {
      profile.isOwner = false;
    }

    return res.json({ success: true, user: profile });
  } catch (err) {
    console.error("[userprofile] GET /api/user/:id error:", err && (err.stack || err.message || err));
    return res.status(500).json({ error: "Failed to load user profile", detail: err && err.message });
  }
});

/**
 * GET /api/user/:id/products
 * Returns products for the given user.
 * - Public callers: only products with isVisible === true
 * - Owner (valid token matching :id): returns all their products
 */
router.get("/:id/products", async (req, res) => {
  const ownerId = req.params.id;
  if (!ownerId) return res.status(400).json({ error: "ownerId required" });

  try {
    const requesterUid = await getRequesterUid(req);
    const isOwner = requesterUid && requesterUid === ownerId;

    // Build query: if not owner, filter by isVisible true
    let q = db.collection("products").where("ownerId", "==", ownerId);
    if (!isOwner) q = q.where("isVisible", "==", true);

    // Prefer ordering by createdAt if present, fallback without ordering on error
    try {
      q = q.orderBy("createdAt", "desc");
      const snap = await q.get();
      const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return res.json({ success: true, products });
    } catch (orderErr) {
      console.warn("[userprofile] ordering failed, falling back to unordered query:", orderErr && orderErr.message);
      const snap = await db.collection("products")
        .where("ownerId", "==", ownerId)
        .get();
      let products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      if (!isOwner) products = products.filter((p) => p.isVisible === true);
      return res.json({ success: true, products });
    }
  } catch (err) {
    console.error("[userprofile] GET /:id/products error:", err && (err.stack || err.message || err));
    return res.status(500).json({ error: "Failed to fetch user's products", detail: err && err.message });
  }
});

module.exports = router;