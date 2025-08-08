const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const app = express();
const PORT = process.env.PORT || 5000;

// Load Firebase service account
const serviceAccount = require('./firebaseServiceKey.json');

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://dashboard-51e42-default-rtdb.firebaseio.com', // optional for Firestore only
});

const db = admin.firestore();

app.use(cors());
app.use(express.json());

/**
 * ✅ GET /api/products
 * Fetch all products from Firestore
 */
app.get('/api/products', async (req, res) => {
  try {
    const productsRef = db.collection('products');
    const snapshot = await productsRef.get();

    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * ✅ GET /api/messages
 * Fetch all chat messages
 */
app.get('/api/messages', async (req, res) => {
  try {
    const messagesRef = db.collection('messages').orderBy('timestamp', 'asc');
    const snapshot = await messagesRef.get();

    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * ✅ POST /api/messages
 * Send a new chat message
 */
app.post('/api/messages', async (req, res) => {
  const { sender, content } = req.body;

  if (!sender || !content) {
    return res.status(400).json({ error: 'Sender and content are required' });
  }

  try {
    const messagesRef = db.collection('messages');

    const newMessage = {
      sender,
      content,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await messagesRef.add(newMessage);
    res.status(201).json({ id: docRef.id, ...newMessage });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * ❌ 404 Catch-All Route
 */
app.use((req, res) => {
  res.status(404).json({
    error: '❌ Route not found',
    path: req.originalUrl,
  });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
