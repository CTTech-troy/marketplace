// backend/src/middlewares/authMiddleware.js
import { auth } from "../config/firebase.js";

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    // Verify Firebase ID token
    const decodedToken = await auth.verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

// Optional default export
export default { verifyFirebaseToken };
