import { getFirestore, collection, query, where, limit, getDocs, doc, runTransaction } from "firebase/firestore";
import { app } from '../../firebase'; // your firebase client init

const db = getFirestore(app);

export async function searchUsers(q) {
  if (!q) return [];
  const qref = query(collection(db, "users"), where("username", ">=", q), where("username", "<=", q + "\uf8ff"), limit(10));
  const snap = await getDocs(qref);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function toggleFollow(meId, targetId) {
  const followsRef = doc(db, `follows/${meId}_${targetId}`);
  return runTransaction(db, async (tx) => {
    const fSnap = await tx.get(followsRef);
    const followerRef = doc(db, "users", meId);
    const targetRef = doc(db, "users", targetId);
    const [followerSnap, targetSnap] = await Promise.all([tx.get(followerRef), tx.get(targetRef)]);
    if (!followerSnap.exists() || !targetSnap.exists()) throw new Error("User missing");
    let action;
    if (fSnap.exists()) {
      tx.delete(followsRef);
      tx.update(followerRef, { followingCount: Math.max(0, (followerSnap.data().followingCount||0) - 1) });
      tx.update(targetRef, { followersCount: Math.max(0, (targetSnap.data().followersCount||0) - 1) });
      action = "unfollowed";
    } else {
      tx.set(followsRef, { followerId: meId, targetId, createdAt: new Date() });
      tx.update(followerRef, { followingCount: (followerSnap.data().followingCount||0) + 1 });
      tx.update(targetRef, { followersCount: (targetSnap.data().followersCount||0) + 1 });
      action = "followed";
    }
    return { action };
  });
}