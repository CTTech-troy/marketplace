// src/models/Order.js
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'completed', 'canceled'], default: 'pending' },
  isAnonymous: { type: Boolean, default: false },
  chatId: { type: String }, // Firestore chatId as string
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);