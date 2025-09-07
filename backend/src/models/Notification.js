// src/models/Notification.js
import admin from 'firebase-admin';

const db = admin.firestore();
const notificationsCol = db.collection('notifications');

const toDoc = (snap) => {
  if (!snap || !snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

const create = async (data) => {
  const now = admin.firestore.Timestamp.now();
  const payload = {
    userId: data.userId || null,
    type: data.type || 'message',
    message: data.message || '',
    isRead: data.isRead || false,
    createdAt: data.createdAt || now,
    updatedAt: data.updatedAt || now,
    ...data
  };

  if (data.id) {
    await notificationsCol.doc(data.id).set(payload, { merge: true });
    const snap = await notificationsCol.doc(data.id).get();
    return toDoc(snap);
  } else {
    const docRef = await notificationsCol.add(payload);
    const snap = await docRef.get();
    return toDoc(snap);
  }
};

const findById = async (id) => {
  const snap = await notificationsCol.doc(id).get();
  return toDoc(snap);
};

const find = async (filter = {}, { limit = 50, orderBy = 'createdAt', desc = true } = {}) => {
  let q = notificationsCol;
  if (filter.userId) q = q.where('userId', '==', filter.userId);
  if (filter.isRead !== undefined) q = q.where('isRead', '==', filter.isRead);
  q = q.orderBy(orderBy, desc ? 'desc' : 'asc').limit(limit);
  const snaps = await q.get();
  return snaps.docs.map(toDoc);
};

const updateOne = async (filter = {}, update = {}) => {
  let id = filter.id || filter._id || update.id || null;
  if (!id && filter.userId) {
    // try to find one
    const results = await find(filter, { limit: 1 });
    if (!results.length) return { matchedCount: 0, modifiedCount: 0 };
    id = results[0].id;
  }
  if (!id) return { matchedCount: 0, modifiedCount: 0 };

  const updates = update.$set ? update.$set : update;
  updates.updatedAt = admin.firestore.Timestamp.now();
  await notificationsCol.doc(id).set(updates, { merge: true });
  return { matchedCount: 1, modifiedCount: 1 };
};

const markRead = async (id) => {
  await notificationsCol.doc(id).set({ isRead: true, updatedAt: admin.firestore.Timestamp.now() }, { merge: true });
  const snap = await notificationsCol.doc(id).get();
  return toDoc(snap);
};

const deleteOne = async (filter = {}) => {
  let id = filter.id || filter._id || null;
  if (!id && filter.userId) {
    const results = await find(filter, { limit: 1 });
    if (!results.length) return { deletedCount: 0 };
    id = results[0].id;
  }
  if (!id) return { deletedCount: 0 };
  await notificationsCol.doc(id).delete();
  return { deletedCount: 1 };
};

export default {
  create,
  findById,
  find,
  updateOne,
  markRead,
  deleteOne
};