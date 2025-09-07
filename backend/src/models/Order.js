// src/models/Order.js
import { admin, firestore } from "../config/firebase.js"; // ✅ Named import

const db = admin.firestore();
const ordersCol = db.collection('orders');

const toDoc = (snap) => {
  if (!snap || !snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

const create = async (data) => {
  const now = admin.firestore.Timestamp.now();
  const payload = {
    userId: data.userId || null,
    productId: data.productId || null,
    status: data.status || 'pending',
    amount: data.amount || 0,
    createdAt: now,
    updatedAt: now,
    ...data,
  };

  const docRef = await ordersCol.add(payload);
  const snap = await docRef.get();
  return toDoc(snap);
};

const findById = async (id) => {
  const snap = await ordersCol.doc(id).get();
  return toDoc(snap);
};

const find = async (filter = {}, { limit = 50, orderBy = 'createdAt', desc = true } = {}) => {
  let q = ordersCol;
  if (filter.userId) q = q.where('userId', '==', filter.userId);
  if (filter.status) q = q.where('status', '==', filter.status);
  q = q.orderBy(orderBy, desc ? 'desc' : 'asc').limit(limit);
  const snaps = await q.get();
  return snaps.docs.map(toDoc);
};

const updateOne = async (id, updates) => {
  updates.updatedAt = admin.firestore.Timestamp.now();
  await ordersCol.doc(id).set(updates, { merge: true });
  const snap = await ordersCol.doc(id).get();
  return toDoc(snap);
};

const deleteOne = async (id) => {
  await ordersCol.doc(id).delete();
  return { deletedCount: 1 };
};

export default {
  create,
  findById,
  find,
  updateOne,
  deleteOne,
};
