// src/models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
  title: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  media: [String], // URLs to videos/images
  location: String,
  category: { type: String, enum: ['product', 'service'], required: true },
  tags: [String],
  isVisible: { type: Boolean, default: true },
  isAnonymous: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);