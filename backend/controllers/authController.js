import { auth, db } from '../firebaseAdmin.js';

// Google Authentication Controller
export const googleSignIn = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'No ID token provided' });
  }

  try {
    // Verify the Google ID token
    const decodedToken = await auth.verifyIdToken(idToken);
    const { uid, email, name, picture } = decodedToken;

    // Check if user already exists
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create new user in Firestore
      await userRef.set({
        email,
        name: name || '',
        avatar: picture || '',
        createdAt: new Date().toISOString(),
      });
    }

    // Respond with success + user info
    return res.status(200).json({ success: true, user: { uid, email, name, picture } });
  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ error: error.message });
  }
};