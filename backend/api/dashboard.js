const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { db } = require("../firebaseAdmin.js");

/**
 * GET /api/dashboard
 * Fetch the logged-in user's profile + related collections
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;

    // Fetch user document
    const userSnap = await db.collection("users").doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = userSnap.data();

    if (!user || user.isVerified !== true) {
      return res.status(403).json({
        error: "Account not verified. Complete 2FA to access dashboard.",
      });
    }

    // Fetch all related collections for this user
    const [
      productsSnap,
      ordersSnap,
      messagesSnap,
      walletSnap,
      reviewsSnap,
      notificationsSnap,
      allUsersSnap,
    ] = await Promise.all([
      db.collection("products").where("ownerId", "==", uid).get(),
      db.collection("orders").where("buyerId", "==", uid).get(),
      db.collection("messages").where("participants", "array-contains", uid).get(),
      db.collection("walletTransactions").where("userId", "==", uid).get(),
      db.collection("reviews").where("userId", "==", uid).get(),
      db.collection("notifications").where("userId", "==", uid).get(),
      db.collection("users").get(), // fetch all users
    ]);

    // Exclude current user from the user list
    const otherUsers = allUsersSnap.docs
      .filter((d) => d.id !== uid)
      .map((d) => ({ id: d.id, ...d.data() }));

    // Format results
    const collections = {
      currentUser: {
        id: uid,
        username: user.username || user.email || "User",
        avatar: user.avatar || null,
        ...user,
      },
      users: otherUsers, // ✅ filtered list
      products: productsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      orders: ordersSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      messages: messagesSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      walletTransactions: walletSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      reviews: reviewsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      notifications: notificationsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
    };

    console.log("Fetched Collections:", collections);

    return res.json({ success: true, collections });
  } catch (err) {
    console.error("dashboard error:", err && (err.stack || err));
    return res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
