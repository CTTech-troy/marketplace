// backend/src/controllers/authController.js
import { admin, auth, firestore } from "../config/firebase.js";
import nodemailer from "nodemailer";
import { createUserWithProfile } from "../models/users.js";

// ----------------------- Nodemailer Setup -----------------------
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.error("⚠️ Missing SMTP credentials! Set EMAIL_USER and EMAIL_PASS in .env");
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

async function sendMail({ to, subject, text }) {
  try {
    await transporter.sendMail({
      from: `"My App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
  } catch (err) {
    console.error("Failed to send email:", err);
    console.log(`Email fallback: ${text}`);
  }
}

// ----------------------- OTP Utility -----------------------
const OTP_COLLECTION = "emailVerifications";
const OTP_EXPIRY_MINUTES = 5;

async function generateOTP(email) {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await firestore.collection(OTP_COLLECTION).doc(email).set({
    code,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
  });

  return code;
}

// ----------------------- Password Reset Utility -----------------------
const RESET_PASSWORD_COLLECTION = "passwordResets";
const RESET_EXPIRY_MINUTES = 15;

async function generateResetToken(email) {
  const token = Math.random().toString(36).substr(2, 32);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + RESET_EXPIRY_MINUTES * 60 * 1000);

  await firestore.collection(RESET_PASSWORD_COLLECTION).doc(token).set({
    email,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt,
  });

  return token;
}

// ----------------------- Signup -----------------------
export async function signup(req, res) {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ error: "All fields required" });

    try {
      await auth.getUserByEmail(email);
      return res.status(400).json({ error: "Email already registered" });
    } catch {
      // user not found -> continue
    }

    const newUser = await auth.createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
      emailVerified: false,
    });

    // ✅ Create users/{uid}, profiles/{uid}, wallets/{uid}, userStats/{uid}
    await createUserWithProfile(newUser.uid, email, `${firstName} ${lastName}`, null);

    // ✅ Merge instead of overwrite, preserving role, walletBalance, etc.
    await firestore.collection("users").doc(newUser.uid).set(
      {
        firstName,
        lastName,
        email,
        provider: "password",
        verified: false,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true } // ✅ preserves fields created by createUserWithProfile
    );

    const otp = await generateOTP(email);
    await sendMail({
      to: email,
      subject: "Your Verification Code",
      text: `Your OTP is: ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
    });

    res.status(201).json({ message: "Signup successful. OTP sent to email.", email });
  } catch (err) {
    console.error("Signup Error:", err);
    res.status(500).json({ error: "Signup failed" });
  }
}

// ----------------------- Verify OTP -----------------------
export async function verifyOtp(req, res) {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ error: "Email & OTP required" });

    const otpDoc = await firestore.collection(OTP_COLLECTION).doc(email).get();
    if (!otpDoc.exists) return res.status(400).json({ error: "OTP not found" });

    const otpData = otpDoc.data();
    if (otpData.expiresAt && new Date() > otpData.expiresAt.toDate()) {
      await firestore.collection(OTP_COLLECTION).doc(email).delete();
      return res.status(400).json({ error: "OTP expired" });
    }

    if (otpData.code !== code) return res.status(400).json({ error: "Incorrect OTP" });

    const usersSnap = await firestore.collection("users").where("email", "==", email).limit(1).get();
    if (usersSnap.empty) return res.status(404).json({ error: "User not found" });

    const userDoc = usersSnap.docs[0];
    await userDoc.ref.update({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await auth.updateUser(userDoc.id, { emailVerified: true });
    await firestore.collection(OTP_COLLECTION).doc(email).delete();

    res.json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("OTP Verification Error:", err);
    res.status(500).json({ error: "OTP verification failed" });
  }
}

// ----------------------- Resend OTP -----------------------
export async function resendOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const usersSnap = await firestore.collection("users").where("email", "==", email).limit(1).get();
    if (usersSnap.empty) return res.status(404).json({ error: "User not found" });

    const otp = await generateOTP(email);
    await sendMail({
      to: email,
      subject: "Your Verification Code",
      text: `Your OTP is: ${otp}. It will expire in ${OTP_EXPIRY_MINUTES} minutes.`,
    });

    res.json({ message: "OTP resent successfully", email });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    res.status(500).json({ error: "Failed to resend OTP" });
  }
}

// ----------------------- Forgot Password -----------------------
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const usersSnap = await firestore.collection("users").where("email", "==", email).limit(1).get();
    if (usersSnap.empty) return res.status(404).json({ error: "User not found" });

    const token = await generateResetToken(email);
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await sendMail({
      to: email,
      subject: "Reset Your Password",
      text: `Click the link to reset your password: ${resetLink}.\nThis link expires in ${RESET_EXPIRY_MINUTES} minutes.`,
    });

    res.json({ message: "Password reset link sent", email });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Failed to send password reset email" });
  }
}

// ----------------------- Reset Password -----------------------
export async function resetPassword(req, res) {
  try {
    const { token, newPassword, confirmPassword } = req.body;
    if (!token || !newPassword || !confirmPassword)
      return res.status(400).json({ error: "All fields required" });

    if (newPassword !== confirmPassword)
      return res.status(400).json({ error: "Passwords do not match" });

    const tokenDoc = await firestore.collection(RESET_PASSWORD_COLLECTION).doc(token).get();
    if (!tokenDoc.exists) return res.status(400).json({ error: "Invalid or expired token" });

    const tokenData = tokenDoc.data();
    if (tokenData.expiresAt.toDate() < new Date()) {
      await firestore.collection(RESET_PASSWORD_COLLECTION).doc(token).delete();
      return res.status(400).json({ error: "Token expired" });
    }

    const usersSnap = await firestore.collection("users").where("email", "==", tokenData.email).limit(1).get();
    if (usersSnap.empty) return res.status(404).json({ error: "User not found" });

    const userDoc = usersSnap.docs[0];
    await auth.updateUser(userDoc.id, { password: newPassword });
    await firestore.collection(RESET_PASSWORD_COLLECTION).doc(token).delete();

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
}

// ----------------------- Email/Password Login -----------------------
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
    } catch {
      return res.status(404).json({ error: "User not found" });
    }

    const userSnap = await firestore.collection("users").where("email", "==", email).limit(1).get();
    if (userSnap.empty) return res.status(404).json({ error: "User not found" });

    const userData = userSnap.docs[0].data();
    if (!userData.verified) return res.status(401).json({ error: "Email not verified" });

    const token = await auth.createCustomToken(userRecord.uid);

    res.json({ message: "Login successful", uid: userRecord.uid, email: userRecord.email, token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

// ----------------------- Google Signup/Login -----------------------
export async function googleAuth(req, res) {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: "ID token required" });

    const decoded = await auth.verifyIdToken(idToken);
    const userRef = firestore.collection("users").doc(decoded.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      // Create minimal user doc (merged later)
      await userRef.set(
        {
          uid: decoded.uid,
          email: decoded.email,
          firstName: decoded.name?.split(" ")[0] || "",
          lastName: decoded.name?.split(" ").slice(1).join(" ") || "",
          provider: "google",
          verified: true,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // ✅ Ensure profile, wallet, stats exist
      await createUserWithProfile(decoded.uid, decoded.email, decoded.name ?? "", decoded.picture ?? null);
    }

    res.json({ message: "Google signup/verify successful", uid: decoded.uid });
  } catch (err) {
    console.error("Google Auth Error:", err);
    res.status(401).json({ error: "Invalid Google token" });
  }
}
