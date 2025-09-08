// backend/src/middlewares/authMiddleware.js
import { auth } from "../config/firebase.js";

export const verifyFirebaseToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      console.error("❌ Missing Authorization header");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const decodedToken = await auth.verifyIdToken(token);
    req.user = { uid: decodedToken.uid, email: decodedToken.email };

    console.log("✅ Firebase token verified for UID:", decodedToken.uid);
    next();
  } catch (error) {
    console.error("❌ Auth Middleware Error:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }
};
