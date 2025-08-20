// firebase.js (for Vite)
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// prefer VITE_ (exposed by Vite) but allow older names as fallback
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.FIREBASE_API_KEY || import.meta.env.REACT_APP_FIREBASE_API_KEY || "";
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.FIREBASE_AUTH_DOMAIN || import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "";
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.FIREBASE_PROJECT_ID || import.meta.env.REACT_APP_FIREBASE_PROJECT_ID || "";
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || import.meta.env.FIREBASE_STORAGE_BUCKET || import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "";
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || import.meta.env.FIREBASE_MESSAGING_SENDER_ID || import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "";
const appId = import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.FIREBASE_APP_ID || import.meta.env.REACT_APP_FIREBASE_APP_ID || "";

const config = { apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId };

if (!config.apiKey || !config.projectId) {
  console.error("[firebase] Missing VITE_FIREBASE_* env vars. Check frontend/.env");
  throw new Error("Missing Firebase Vite env vars (VITE_FIREBASE_API_KEY / VITE_FIREBASE_PROJECT_ID)");
}

const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, db, googleProvider };
