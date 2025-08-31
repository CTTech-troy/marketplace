// backend/src/middlewares/authMiddleware.js
import { auth } from "../config/firebase.js";

export default async function verifyFirebaseToken(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/Bearer (.+)/);
    const idToken = match ? match[1] : req.body?.idToken || req.query?.idToken;

    if (!idToken) {
      return res.status(401).json({ error: "No ID token provided" });
    }

    const decoded = await auth.verifyIdToken(idToken);
    // Attach decoded token to request object
    req.user = decoded;

    next();
  } catch (err) {
    console.error("❌ [AuthMiddleware] Invalid token:", err);
    res.status(401).json({ error: "Invalid or expired token" });
  }
}
