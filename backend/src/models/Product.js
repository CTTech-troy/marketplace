// src/models/Product.js
import { admin, firestore } from "../config/firebase.js"; // ✅ Named import

const db = admin.firestore();
const productsCol = db.collection('products');

const toDoc = (snap) => {
  if (!snap || !snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

const create = async (data) => {
  const now = admin.firestore.Timestamp.now();
  const payload = {
    name: data.name || '',
    description: data.description || '',
    price: data.price || 0,
    stock: data.stock || 0,
    category: data.category || '',
    createdAt: now,
    updatedAt: now,
    ...data,
  };

  const docRef = await productsCol.add(payload);
  const snap = await docRef.get();
  return toDoc(snap);
};

const findById = async (id) => {
  const snap = await productsCol.doc(id).get();
  return toDoc(snap);
};

const find = async (filter = {}, { limit = 50, orderBy = 'createdAt', desc = true } = {}) => {
  let q = productsCol;
  if (filter.category) q = q.where('category', '==', filter.category);
  if (filter.price) q = q.where('price', '<=', filter.price);
  q = q.orderBy(orderBy, desc ? 'desc' : 'asc').limit(limit);
  const snaps = await q.get();
  return snaps.docs.map(toDoc);
};

const updateOne = async (id, updates) => {
  updates.updatedAt = admin.firestore.Timestamp.now();
  await productsCol.doc(id).set(updates, { merge: true });
  const snap = await productsCol.doc(id).get();
  return toDoc(snap);
};

const deleteOne = async (id) => {
  await productsCol.doc(id).delete();
  return { deletedCount: 1 };
};

export default {
  create,
  findById,
  find,
  updateOne,
  deleteOne,
};
