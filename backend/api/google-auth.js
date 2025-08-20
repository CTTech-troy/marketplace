const express = require("express");
const { auth, db } = require("../firebaseAdmin.js");

const router = express.Router();

// Client should send { idToken } where idToken is Google/Firebase ID token obtained on client.
router.post("/", async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "idToken is required" });

  try {
    // verify id token (this works for Firebase-issued tokens; if it's raw Google token, verify with Google or create firebase credential on client)
    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email;
    const name = decoded.name || decoded.displayName || decoded.email?.split("@")[0];
    const photo = decoded.picture || "";

    // Ensure user record exists in Firestore
    const userRef = db.collection("users").doc(uid);
    const snap = await userRef.get();
    if (!snap.exists) {
      const now = new Date();
      const userData = {
        _id: uid,
        username: name,
        email,
        profile: {
          profilePic: photo || "",
          bio: "",
          location: "",
          isAnonymous: false,
        },
        role: "buyer",
        followersCount: 0,
        followingCount: 0,
        amountMadeFromSales: 0,
        walletBalance: 0,
        createdAt: now,
        updatedAt: now,
        authProvider: "google",
      };
      await userRef.set(userData);
    }

    // return user doc and custom token if client wants to sign-in via custom token
    const userDoc = await userRef.get();
    const user = userDoc.exists ? userDoc.data() : null;
    const customToken = await auth.createCustomToken(uid);

    return res.json({ message: "Google auth processed", user, token: customToken });
  } catch (err) {
    console.error("Google auth error:", err && (err.stack || err));
    return res.status(400).json({ error: err && err.message ? err.message : "Google auth failed" });
  }
});

module.exports = router;