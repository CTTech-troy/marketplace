// api/products.js
const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { admin, db } = require("../firebaseAdmin.js");

/**
 * GET /api/products
 * Returns products belonging to the authenticated user only.
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const q = db.collection("products").where("ownerId", "==", uid);
    const snap = await q.get();
    const products = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ success: true, products });
  } catch (err) {
    console.error("products.get error:", err && (err.stack || err));
    return res.status(500).json({ error: "Failed to fetch products" });
  }
});

/**
 * POST /api/products
 * Create a product for the authenticated user (ownerId set from auth UID).
 */
router.post("/", authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const {
      title = "",
      description = "",
      price = 0,
      media = [],
      location = "",
      category = "product",
      tags = [],
      isVisible = true,
    } = req.body || {};

    const now = admin.firestore.Timestamp.now();

    const product = {
      ownerId: uid,
      title,
      description,
      price: Number(price) || 0,
      media: Array.isArray(media) ? media : (typeof media === "string" ? media.split(",").map(s => s.trim()) : []),
      location,
      category,
      tags: Array.isArray(tags) ? tags : (typeof tags === "string" ? tags.split(",").map(s => s.trim()) : []),
      isVisible: Boolean(isVisible),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await db.collection("products").add(product);
    const created = { id: docRef.id, ...product };

    return res.status(201).json({ success: true, product: created });
  } catch (err) {
    console.error("products.post error:", err && (err.stack || err));
    return res.status(500).json({ error: "Failed to create product" });
  }
});

/**
 * (Optional) DELETE /api/products/:id
 * Allow owner to delete their product
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const id = req.params.id;
    const ref = db.collection("products").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "Product not found" });
    const data = snap.data();
    if (data.ownerId !== uid) return res.status(403).json({ error: "Forbidden" });

    await ref.delete();
    return res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error("products.delete error:", err && (err.stack || err));
    return res.status(500).json({ error: "Failed to delete product" });
  }
});

module.exports = router;
