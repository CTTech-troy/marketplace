const express = require('express');
const router = express.Router();
const axios = require('axios');
const { admin, db } = require('../firebaseAdmin');

// POST /api/login
router.post('/', async (req, res) => {
  try {
    const { identifier, password } = req.body || {};
    if (!identifier || !password) {
      return res.status(400).json({ error: 'identifier and password are required' });
    }

    // determine email
    let email = null;
    if (identifier.includes('@')) {
      email = identifier;
    } else {
      // lookup by phone in users collection
      const phoneVal = identifier;
      const queries = [
        db.collection('users').where('phone', '==', phoneVal).limit(1),
        db.collection('users').where('profile.phone', '==', phoneVal).limit(1),
        db.collection('users').where('profile.phoneNumber', '==', phoneVal).limit(1),
      ];
      for (const q of queries) {
        const snap = await q.get();
        if (!snap.empty) {
          const data = snap.docs[0].data() || {};
          email = data.email || (data.profile && data.profile.email) || null;
          break;
        }
      }
      if (!email) return res.status(404).json({ error: 'No user found for provided phone number' });
    }

    const apiKey = process.env.FIREBASE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Server not configured: FIREBASE_API_KEY missing' });

    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
    let authResp;
    try {
      authResp = await axios.post(signInUrl, { email, password, returnSecureToken: true }, { timeout: 10000 });
    } catch (err) {
      const msg = err?.response?.data || err?.message || String(err);
      if (err?.response?.data?.error?.message === 'EMAIL_NOT_FOUND' || err?.response?.data?.error?.message === 'INVALID_PASSWORD') {
        return res.status(400).json({ error: 'Invalid credentials' });
      }
      return res.status(400).json({ error: 'Authentication failed', details: msg });
    }

    const { idToken, localId } = authResp.data || {};
    if (!idToken) return res.status(500).json({ error: 'Failed to retrieve idToken' });

    // Ensure Firestore user doc exists and contains basic profile
    try {
      const userRef = db.collection('users').doc(localId);
      const snap = await userRef.get();
      if (!snap.exists) {
        // fetch auth profile and create doc
        const authUser = await admin.auth().getUser(localId);
        const now = admin.firestore.Timestamp.now();
        const userData = {
          _id: localId,
          username: authUser.displayName || '',
          email: authUser.email || email,
          phone: authUser.phoneNumber || null,
          profile: { bio: '', location: '', profilePic: '' },
          role: 'buyer',
          followersCount: 0,
          followingCount: 0,
          amountMadeFromSales: 0,
          walletBalance: 0,
          createdAt: now,
          updatedAt: now,
          authProvider: 'firebase',
          isVerified: false,
        };
        await userRef.set(userData);
      } else {
        // update email/phone if missing
        const data = snap.data() || {};
        const updates = {};
        const authUser = await admin.auth().getUser(localId).catch(() => null);
        if (authUser) {
          if (authUser.email && authUser.email !== data.email) updates.email = authUser.email;
          if (authUser.displayName && (!data.username || data.username !== authUser.displayName)) updates.username = authUser.displayName;
          if (authUser.phoneNumber && (!data.phone || data.phone !== authUser.phoneNumber)) updates.phone = authUser.phoneNumber;
        }
        if (Object.keys(updates).length) {
          updates.updatedAt = admin.firestore.Timestamp.now();
          await userRef.set(updates, { merge: true });
        }
      }
    } catch (err) {
      console.warn('login: failed to ensure user doc exists', err && (err.stack || err.message || err));
    }

    // fetch user doc to return verification status
    let userDoc = null;
    try {
      const snap = await db.collection('users').doc(localId).get();
      if (snap.exists) userDoc = snap.data();
    } catch (err) {
      console.error('login: failed to read user doc', err && (err.stack || err.message || err));
    }

    const isVerified = userDoc && userDoc.isVerified === true;
    const user = userDoc || { _id: localId, email };

    return res.json({
      success: true,
      idToken,
      user,
      isVerified,
    });
  } catch (err) {
    console.error('login error:', err && (err.stack || err));
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;