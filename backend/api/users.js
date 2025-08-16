const express = require("express");
const { db } = require("../firebaseAdmin.js");

const router = express.Router();

// GET /api/users -> list users (first 200)
router.get("/", async (req, res) => {
  try {
    const usersSnap = await db.collection("users").limit(200).get();
    const users = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ count: users.length, users });
  } catch (err) {
    console.error("Failed to list users:", err);
    return res.status(500).json({ error: err.message || "Failed to list users" });
  }
});

// DELETE /api/users/:id -> delete user document
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await db.collection("users").doc(id).delete();
    console.log("Deleted user:", id);
    return res.json({ ok: true, id });
  } catch (err) {
    console.error("Failed to delete user:", id, err);
    return res.status(500).json({ error: err.message || "Delete failed" });
  }
});

// PATCH /api/users/:id/disable -> set status to Disabled (or toggle)
router.patch("/:id/disable", async (req, res) => {
  const { id } = req.params;
  try {
    const ref = db.collection("users").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "User not found" });
    const current = snap.data();
    const newStatus = (current.status === "Disabled") ? "Active" : "Disabled";
    await ref.update({ status: newStatus, updatedAt: new Date() });
    console.log(`Set status for ${id} -> ${newStatus}`);
    const updated = (await ref.get()).data();
    return res.json({ ok: true, id, status: newStatus, user: updated });
  } catch (err) {
    console.error("Failed to update status for user:", id, err);
    return res.status(500).json({ error: err.message || "Update failed" });
  }
});

/*
 Follow/unfollow implementation
 - uses a root collection "follows" with doc id `${followerId}_${targetId}`
 - POST /api/users/follow with { followerId, targetUsername }
   toggles follow: creates follow doc and increments counts OR deletes and decrements.
*/
router.post("/follow", async (req, res) => {
  const { followerId, targetUsername } = req.body;
  if (!followerId || !targetUsername) return res.status(400).json({ error: "Missing followerId or targetUsername" });

  try {
    // find target user by username
    const q = await db.collection("users").where("username", "==", targetUsername).limit(1).get();
    if (q.empty) return res.status(404).json({ error: "Target user not found" });
    const targetDoc = q.docs[0];
    const targetId = targetDoc.id;

    if (targetId === followerId) return res.status(400).json({ error: "Cannot follow yourself" });

    const followDocId = `${followerId}_${targetId}`;
    const followRef = db.collection("follows").doc(followDocId);
    const followerRef = db.collection("users").doc(followerId);
    const targetRef = db.collection("users").doc(targetId);

    // check existence and toggle inside transaction
    const result = await db.runTransaction(async (tx) => {
      const [followSnap, fSnap, tSnap] = await Promise.all([tx.get(followRef), tx.get(followerRef), tx.get(targetRef)]);
      if (!fSnap.exists) throw new Error("Follower not found");
      if (!tSnap.exists) throw new Error("Target not found");

      const followerData = fSnap.data();
      const targetData = tSnap.data();

      let action;
      let newFollowing = followerData.followingCount || 0;
      let newFollowers = targetData.followersCount || 0;

      if (followSnap.exists) {
        // unfollow: delete follow doc, decrement counts (min 0)
        tx.delete(followRef);
        newFollowing = Math.max(0, newFollowing - 1);
        newFollowers = Math.max(0, newFollowers - 1);
        tx.update(followerRef, { followingCount: newFollowing, updatedAt: new Date() });
        tx.update(targetRef, { followersCount: newFollowers, updatedAt: new Date() });
        action = "unfollowed";
      } else {
        // follow: create doc and increment counts
        tx.set(followRef, { followerId, targetId, createdAt: new Date() });
        newFollowing = (followerData.followingCount || 0) + 1;
        newFollowers = (targetData.followersCount || 0) + 1;
        tx.update(followerRef, { followingCount: newFollowing, updatedAt: new Date() });
        tx.update(targetRef, { followersCount: newFollowers, updatedAt: new Date() });
        action = "followed";
      }

      return {
        action,
        follower: { id: followerId, followingCount: newFollowing },
        target: { id: targetId, followersCount: newFollowers },
      };
    });

    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error("Follow error:", err && err.stack ? err.stack : err);
    if (err.message && err.message.toLowerCase().includes("not found")) {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message || "Follow failed" });
  }
});

/*
 Search with optional meId -> returns isFollowing flag per result
 GET /api/users/search?q=...&meId=<myId>
*/
router.get("/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  const meId = req.query.meId || null;
  if (!q) return res.json({ count: 0, users: [] });

  try {
    const start = q;
    const end = q + "\uf8ff";
    const snap = await db.collection("users")
      .where("username", ">=", start)
      .where("username", "<=", end)
      .limit(10)
      .get();

    const users = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        username: data.username,
        email: data.email,
        profilePic: data.profile?.profilePic || data.profilePic || null,
      };
    });

    if (meId && users.length) {
      const ids = users.map(u => u.id);
      // Firestore 'in' supports up to 10
      const followsSnap = await db.collection("follows")
        .where("followerId", "==", meId)
        .where("targetId", "in", ids)
        .get()
        .catch(() => ({ empty: true }));
      const followedSet = new Set();
      if (followsSnap && !followsSnap.empty) {
        followsSnap.docs.forEach(d => {
          const data = d.data();
          followedSet.add(data.targetId);
        });
      }
      // attach isFollowing
      users.forEach(u => { u.isFollowing = followedSet.has(u.id); });
    }

    return res.json({ count: users.length, users });
  } catch (err) {
    console.error("User search error:", err && err.stack ? err.stack : err);
    return res.status(500).json({ error: err.message || "Search failed" });
  }
});

// GET /api/users/:id/followers
// returns full user docs of followers (array)
router.get("/:id/followers", async (req, res) => {
  const { id } = req.params;
  try {
    const followsSnap = await db.collection("follows").where("targetId", "==", id).get();
    if (followsSnap.empty) return res.json({ count: 0, users: [] });

    const followerIds = followsSnap.docs.map((d) => d.data().followerId).filter(Boolean);
    // fetch each follower doc (safe around Firestore 'in' limits)
    const snaps = await Promise.all(followerIds.map((fid) => db.collection("users").doc(fid).get()));
    const users = snaps
      .filter((s) => s.exists)
      .map((s) => {
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
      });

    return res.json({ count: users.length, users });
  } catch (err) {
    console.error("Failed to fetch followers for", id, err);
    return res.status(500).json({ error: err.message || "Failed to fetch followers" });
  }
});

module.exports = router;