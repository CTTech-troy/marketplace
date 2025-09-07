import admin from 'firebase-admin';

const db = admin.firestore();
const productsCol = db.collection('products');

const toDoc = (snap) => {
  if (!snap || !snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

export const listProducts = async (req, res) => {
  try {
    const snaps = await productsCol.get();
    const products = snaps.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.json({ products });
  } catch (err) {
    console.error('listProducts', err);
    return res.status(500).json({ error: 'Failed to list products' });
  }
};

export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const snap = await productsCol.doc(id).get();
    const product = toDoc(snap);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    return res.json({ product });
  } catch (err) {
    console.error('getProduct', err);
    return res.status(500).json({ error: 'Failed to get product' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const data = req.body || {};
    data.createdAt = admin.firestore.Timestamp.now();
    data.updatedAt = data.createdAt;
    // if you want firebaseUID as id, use req.user?.uid or data.id
    const docRef = await productsCol.add(data);
    const snap = await docRef.get();
    return res.status(201).json({ product: toDoc(snap) });
  } catch (err) {
    console.error('createProduct', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    updates.updatedAt = admin.firestore.Timestamp.now();
    await productsCol.doc(id).set(updates, { merge: true });
    const snap = await productsCol.doc(id).get();
    return res.json({ product: toDoc(snap) });
  } catch (err) {
    console.error('updateProduct', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await productsCol.doc(id).delete();
    return res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error('deleteProduct', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
};

// default export for route imports expecting "default"
export default {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
};