// src/models/User.js
import { firestore, admin } from "../config/firebase.js";

const usersCol = firestore.collection("users");
const profilesCol = firestore.collection("profiles");
const walletsCol = firestore.collection("wallets");
const userStatsCol = firestore.collection("userStats");

export async function createUserWithProfile(uid, email, displayName = "", photoURL = null) {
  const now = admin.firestore.FieldValue.serverTimestamp();

  const userRef = usersCol.doc(uid);
  const profileRef = profilesCol.doc(uid);
  const walletRef = walletsCol.doc(uid);
  const statsRef = userStatsCol.doc(uid);

  const [userSnap, profileSnap, walletSnap, statsSnap] = await Promise.all([
    userRef.get(), profileRef.get(), walletRef.get(), statsRef.get()
  ]);

  const batch = firestore.batch();

  // Create user doc (no wallet balance here anymore)
  if (!userSnap.exists) {
    batch.set(userRef, {
      uid,
      email,
      username: null,
      role: "buyer",
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create profile doc
  if (!profileSnap.exists) {
    batch.set(profileRef, {
      displayName,
      bio: "",
      location: null,
      profilePic: photoURL,
      isAnonymous: false,
      followers: 0,
      following: 0,
      amountMade: 0,
      mediaCount: 0,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create wallet doc (balance stored here only)
  if (!walletSnap.exists) {
    batch.set(walletRef, {
      uid,
      balance: 0,
      currency: "NGN",
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create stats doc
  if (!statsSnap.exists) {
    batch.set(statsRef, {
      followers: 0,
      following: 0,
      totalSales: 0,
      posted: 0,
      updatedAt: now,
    });
  }

  await batch.commit();
  return { uid, email };
}

export default createUserWithProfile;
