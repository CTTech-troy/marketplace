import { auth, firestore } from '../config/firebase.js';
import nodemailer from "nodemailer";
import fetch from "node-fetch";

// 📌 Google Sign-In
export const googleAuth = async (req, res) => {
  const { idToken, accessToken } = req.body;
  if (!idToken) return res.status(400).json({ error: "ID token required" });

  try {
    const decoded = await auth.verifyIdToken(idToken);

    const userRef = firestore.collection("users").doc(decoded.uid);
    const doc = await userRef.get();

    if (!doc.exists) {
      await userRef.set({
        uid: decoded.uid,
        email: decoded.email,
        firstName: decoded.name ? decoded.name.split(" ")[0] : "",
        lastName: decoded.name ? decoded.name.split(" ").slice(1).join(" ") : "",
        provider: "google",
        verified: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    res.json({ uid: decoded.uid, email: decoded.email, idToken, accessToken });
  } catch (err) {
    console.error("❌ [GoogleAuth] Error:", err);
    res.status(401).json({ error: "Invalid Google token", details: err.message });
  }
};

// 📌 Email/Password Sign-Up
export const signup = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const userRecord = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
    });

    const userDoc = {
      uid: userRecord.uid,
      email: userRecord.email,
      firstName,
      lastName,
      displayName: userRecord.displayName,
      createdAt: new Date().toISOString(),
      verified: false,
    };

    await firestore.collection("users").doc(userRecord.uid).set(userDoc);

    res.status(201).json({ user: userDoc });
  } catch (error) {
    console.error("[Signup] Error:", error);
    if (error.code === "auth/email-already-exists") {
      return res.status(409).json({ error: "Email already in use" });
    }
    if (error.code === "auth/invalid-password") {
      return res.status(400).json({ error: "Invalid password (too weak)" });
    }
    return res.status(500).json({ error: "Failed to create account" });
  }
};

// 📌 Email/Password Login
export const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email & password required" });

  try {
    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      let errorMessage = "Login failed";
      if (data.error?.message) {
        switch (data.error.message) {
          case "EMAIL_NOT_FOUND":
            errorMessage = "Email not found";
            break;
          case "INVALID_PASSWORD":
            errorMessage = "Invalid password";
            break;
          case "USER_DISABLED":
            errorMessage = "This account has been disabled";
            break;
          default:
            errorMessage = data.error.message;
        }
      }
      return res.status(400).json({ error: errorMessage });
    }

    const userSnap = await firestore.collection("users").doc(data.localId).get();
    if (!userSnap.exists) return res.status(404).json({ error: "User record not found" });

    const userData = userSnap.data();
    if (!userData.verified) return res.status(403).json({ error: "Email not verified. Please check your email." });

    res.json({
      message: "Login successful",
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      user: {
        uid: data.localId,
        email: data.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
    });
  } catch (err) {
    console.error("[Login] Error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
};

// 📌 Send verification code
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    await firestore.collection("emailVerifications").doc(email).set({
      code,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Verification Code",
        text: `Your verification code is: ${code}`,
      });
    }

    res.json({ message: "Verification code sent" });
  } catch (err) {
    console.error("[SendVerificationCode] Error:", err);
    res.status(500).json({ error: "Failed to send code", details: err.message });
  }
};

// 📌 Verify code
export const verifyCode = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: "Email & code required" });

  try {
    const doc = await firestore.collection("emailVerifications").doc(email).get();
    if (!doc.exists) return res.status(400).json({ error: "No code found for this email" });

    const data = doc.data();
    const createdAt = data.createdAt.toDate();
    if ((new Date() - createdAt) / 1000 / 60 > 10) return res.status(400).json({ error: "Verification code expired" });
    if (data.code !== code) return res.status(400).json({ error: "Invalid code" });

    const userSnap = await firestore.collection("users").where("email", "==", email).get();
    if (!userSnap.empty) {
      const userDoc = userSnap.docs[0];
      await userDoc.ref.update({ verified: true });
      const user = await auth.getUser(userDoc.id);
      if (!user.emailVerified) await auth.updateUser(userDoc.id, { emailVerified: true });
    }

    await firestore.collection("emailVerifications").doc(email).delete();
    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("[VerifyCode] Error:", err);
    res.status(500).json({ error: "Verification failed", details: err.message });
  }
};

// 📌 Get Profile
export const getProfile = async (req, res) => {
  try {
    const userDoc = await firestore.collection("users").doc(req.user.uid).get();
    if (!userDoc.exists) return res.status(404).json({ error: "User not found" });
    const userData = userDoc.data();
    delete userData.password;
    res.json({ user: userData });
  } catch (err) {
    console.error("[GetProfile] Error:", err);
    res.status(500).json({ error: "Failed to fetch profile" });
  }
};

// 📌 Update Profile
export const updateProfile = async (req, res) => {
  const { firstName, lastName } = req.body;
  if (!firstName || !lastName) return res.status(400).json({ error: "First and last name required" });

  try {
    await firestore.collection("users").doc(req.user.uid).update({
      firstName,
      lastName,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await auth.updateUser(req.user.uid, { displayName: `${firstName} ${lastName}` });
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error("[UpdateProfile] Error:", err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};

// 📌 Session
export const session = async (req, res) => {
  try {
    const header = req.headers.authorization || '';
    const match = header.match(/Bearer (.+)/);
    const idToken = match ? match[1] : req.body?.idToken || req.query?.idToken;

    if (!idToken) return res.status(400).json({ error: 'ID token required' });

    const decoded = await auth.verifyIdToken(idToken);
    const uid = decoded.uid;

    const userSnap = await firestore.collection('users').doc(uid).get();
    const user = userSnap.exists ? userSnap.data() : null;

    return res.json({ user, auth: decoded });
  } catch (err) {
    console.error('[authController.session] error:', err);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
