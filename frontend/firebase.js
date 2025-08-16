// firebaseClient.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- add Firestore

const firebaseConfig = {
  apiKey: "AIzaSyDcJiJ88E9h14cHMmROlZQKhui6ifSVbI0",
  authDomain: "cttech-c3806.firebaseapp.com",
  databaseURL: "https://cttech-c3806-default-rtdb.firebaseio.com",
  projectId: "cttech-c3806",
  storageBucket: "cttech-c3806.firebasestorage.app",
  messagingSenderId: "510121902173",
  appId: "1:510121902173:web:3dd4b71fe0386ab16f8db4",
  measurementId: "G-MBC0E5Q96G"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app); 
export const googleProvider = new GoogleAuthProvider();

export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return { idToken, user: result.user };
}
