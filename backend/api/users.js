const express = require("express");
const { db, admin } = require("../firebaseAdmin.js");
const authenticate = require("../middleware/auth"); // ✅ import it
const router = express.Router();


// GET /api/users -> list users (first 200, excluding current user)
router.get("/", authenticate, async (req, res) => {
  try {
    const uid = req.user.uid; // logged-in user
    const usersSnap = await db.collection("users").limit(200).get();

    const users = usersSnap.docs
      .filter((d) => d.id !== uid) // exclude self
      .map((d) => ({ id: d.id, ...d.data() }));

    return res.json({ count: users.length, users });
  } catch (err) {
    console.error("Failed to list users:", err);
    return res.status(500).json({ error: "Failed to list users" });
  }
});
// Public: GET /api/users/:id - returns a sanitized public profile
router.get("/:id", async (req, res) => {
  try {
    const uid = req.params.id;
    if (!uid) return res.status(400).json({ error: "user id required" });

    const snap = await db.collection("users").doc(uid).get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });

    const user = snap.data() || {};

    // sanitize sensitive fields (do NOT expose walletBalance, amountMadeFromSales, verification fields, etc.)
    const safe = {
      _id: user._id || uid,
      username: user.username || "",
      email: user.email || null, // optional to expose
      profile: user.profile || {},
      followersCount: user.followersCount || 0,
      followingCount: user.followingCount || 0,
      createdAt: user.createdAt || null,
      isVerified: !!user.isVerified,
    };

    return res.json({ success: true, user: safe });
  } catch (err) {
    console.error("users.getById error:", err && (err.stack || err));
    return res.status(500).json({ error: "Failed to load user" });
  }
});
// DELETE /api/users/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("users").doc(id).delete();
    console.log("Deleted user:", id);
    return res.json({ ok: true, id });
  } catch (err) {
    console.error("Failed to delete user:", id, err);
    return res.status(500).json({ error: "Delete failed" });
  }
});

// PATCH /api/users/:id/disable
router.patch("/:id/disable", async (req, res) => {
  const { id } = req.params;
  try {
    const ref = db.collection("users").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });

    const current = snap.data();
    const newStatus = current.status === "Disabled" ? "Active" : "Disabled";

    await ref.update({
      status: newStatus,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const updated = (await ref.get()).data();
    return res.json({ ok: true, id, status: newStatus, user: updated });
  } catch (err) {
    console.error("Failed to update status for user:", id, err);
    return res.status(500).json({ error: "Update failed" });
  }
});

// POST /api/users/follow
router.post("/follow", async (req, res) => {
  const { followerId, targetUsername } = req.body;
  if (!followerId || !targetUsername) {
    return res.status(400).json({ error: "Missing followerId or targetUsername" });
  }

  try {
    const q = await db.collection("users")
      .where("username", "==", targetUsername)
      .limit(1)
      .get();

    if (q.empty) return res.status(404).json({ error: "Target user not found" });

    const targetDoc = q.docs[0];
    const targetId = targetDoc.id;

    if (targetId === followerId) {
      return res.status(400).json({ error: "Cannot follow yourself" });
    }

    const followDocId = `${followerId}_${targetId}`;
    const followRef = db.collection("follows").doc(followDocId);
    const followerRef = db.collection("users").doc(followerId);
    const targetRef = db.collection("users").doc(targetId);

    const result = await db.runTransaction(async (tx) => {
      const followSnap = await tx.get(followRef);
      const fSnap = await tx.get(followerRef);
      const tSnap = await tx.get(targetRef);

      if (!fSnap.exists) throw new Error("Follower not found");
      if (!tSnap.exists) throw new Error("Target not found");

      const followerData = fSnap.data();
      const targetData = tSnap.data();

      let action;
      let newFollowing = followerData.followingCount || 0;
      let newFollowers = targetData.followersCount || 0;

      if (followSnap.exists) {
        // Unfollow
        tx.delete(followRef);
        newFollowing = Math.max(0, newFollowing - 1);
        newFollowers = Math.max(0, newFollowers - 1);
        action = "unfollowed";
      } else {
        // Follow
        tx.set(followRef, {
          followerId,
          targetId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        newFollowing++;
        newFollowers++;
        action = "followed";
      }

      tx.update(followerRef, {
        followingCount: newFollowing,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      tx.update(targetRef, {
        followersCount: newFollowers,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return { action, follower: { id: followerId, followingCount: newFollowing }, target: { id: targetId, followersCount: newFollowers } };
    });

    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error("Follow error:", err);
    if (err.message && err.message.includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: "Follow failed" });
  }
});

// GET /api/users/search
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  const meId = req.query.meId || null;
  if (!q) return res.json({ count: 0, users: [] });

  try {
    const snap = await db.collection("users")
      .where("username", ">=", q)
      .where("username", "<=", q + "\uf8ff")
      .limit(10)
      .get();

    let users = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        username: data.username,
        email: data.email,
        profilePic: data.profile?.profilePic || data.profilePic || null,
      };
    });

    // Exclude self if meId is provided
    if (meId) {
      users = users.filter((u) => u.id !== meId);
    }

    if (meId && users.length) {
      const ids = users.map((u) => u.id);
      if (ids.length <= 10) {
        const followsSnap = await db.collection("follows")
          .where("followerId", "==", meId)
          .where("targetId", "in", ids)
          .get();

        const followedSet = new Set(followsSnap.docs.map((d) => d.data().targetId));
        users.forEach((u) => { u.isFollowing = followedSet.has(u.id); });
      }
    }

    return res.json({ count: users.length, users });
  } catch (err) {
    console.error("User search error:", err);
    return res.status(500).json({ error: "Search failed" });
  }
});

// GET /api/users/:id/followers
router.get("/:id/followers", async (req, res) => {
  const { id } = req.params;
  try {
    const followsSnap = await db.collection("follows").where("targetId", "==", id).get();
    if (followsSnap.empty) return res.json({ count: 0, users: [] });

    const followerIds = followsSnap.docs.map((d) => d.data().followerId).filter(Boolean);

    // Fetch safely (chunk into groups of 10 because of Firestore 'in' limit)
    const chunks = [];
    for (let i = 0; i < followerIds.length; i += 10) {
      chunks.push(followerIds.slice(i, i + 10));
    }

    let users = [];
    for (const chunk of chunks) {
      const snap = await db.collection("users").where(admin.firestore.FieldPath.documentId(), "in", chunk).get();
      users = users.concat(snap.docs.map((s) => {
        const d = s.data();
        return {
          id: s.id,
          username: d.username,
          email: d.email,
          profilePic: d.profile?.profilePic || d.profilePic || null,
          followersCount: d.followersCount || 0,
          followingCount: d.followingCount || 0,
          createdAt: d.createdAt || d.updatedAt || null,
        };
      }));
    }

    return res.json({ count: users.length, users });
  } catch (err) {
    console.error("Failed to fetch followers for", id, err);
    return res.status(500).json({ error: "Failed to fetch followers" });
  }
});

module.exports = router;
