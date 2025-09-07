import { admin } from "../config/firebase.js";
const db = admin.firestore();
const walletTxCol = db.collection("walletTransactions");

const toDoc = (snap) => {
  if (!snap || !snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

const create = async (data) => {
  const now = admin.firestore.Timestamp.now();
  const payload = {
    userId: data.userId,
    type: data.type || "credit",
    amount: data.amount || 0,
    reason: data.reason || "",
    status: data.status || "pending",
    createdAt: now,
    updatedAt: now,
  };
  const docRef = await walletTxCol.add(payload);
  const snap = await docRef.get();
  return toDoc(snap);
};

const find = async (filter = {}) => {
  let q = walletTxCol;
  if (filter.userId) q = q.where("userId", "==", filter.userId);
  const snaps = await q.orderBy("createdAt", "desc").get();
  return snaps.docs.map(toDoc);
};

export default { create, find };
