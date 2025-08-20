const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/auth');
const { admin, db } = require('../firebaseAdmin');
const { buildUserData } = require("../utils/userData");

router.post('/', authenticate, async (req, res) => {
  try {
    const uid = req.user.uid;
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });

    const userRef = db.collection('users').doc(uid);
    let snap = await userRef.get();

    // if user doc missing, attempt to create from auth profile (this covers client-side signup flow)
    if (!snap.exists) {
      try {
        const authUser = await admin.auth().getUser(uid);
        const userData = buildUserData(authUser, { isVerified: false });
        await userRef.set(userData);
        snap = await userRef.get();
      } catch (err) {
        console.warn('confirm: cannot create missing user doc', err && (err.stack || err.message || err));
      }
    }

    if (!snap.exists) return res.status(404).json({ error: 'User not found' });
    const data = snap.data() || {};

    // require verificationCode & expires
    if (!data.verificationCode) return res.status(400).json({ error: 'No active verification code' });

    const expiresAtMillis = (data.verificationExpires && typeof data.verificationExpires.toMillis === 'function')
      ? data.verificationExpires.toMillis()
      : (typeof data.verificationExpires === 'number' ? data.verificationExpires : null);

    if (expiresAtMillis && expiresAtMillis < Date.now()) return res.status(400).json({ error: 'Code expired' });

    if (String(data.verificationCode) !== String(code)) return res.status(400).json({ error: 'Invalid code' });

    // mark verified and remove code fields
    await userRef.set({
      isVerified: true,
      verifiedAt: admin.firestore.Timestamp.now(),
      verificationCode: admin.firestore.FieldValue.delete(),
      verificationExpires: admin.firestore.FieldValue.delete(),
      updatedAt: admin.firestore.Timestamp.now(),
    }, { merge: true });

    // backfill auth profile
    try {
      const authUser = await admin.auth().getUser(uid);
      const updates = {};
      if (authUser.email && authUser.email !== data.email) updates.email = authUser.email;
      if (authUser.displayName && (!data.username || data.username !== authUser.displayName)) updates.username = authUser.displayName;
      if (authUser.phoneNumber && (!data.phone || data.phone !== authUser.phoneNumber)) updates.phone = authUser.phoneNumber;
      if (Object.keys(updates).length > 0) {
        await userRef.set(updates, { merge: true });
      }
    } catch (err) {
      console.warn('confirm: failed to backfill auth profile', err && (err.stack || err.message || err));
    }

    const updatedSnap = await userRef.get();
    return res.json({ success: true, message: 'Verified successfully', user: updatedSnap.data() });
  } catch (err) {
    console.error('confirm error:', err && (err.stack || err));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;