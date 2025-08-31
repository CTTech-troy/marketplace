// src/models/WalletTransaction.js
const mongoose = require('mongoose');

const walletTransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User ', required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  amount: { type: Number, required: true },
  reason: { type: String, enum: ['sale', 'purchase', 'withdrawal'], required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WalletTransaction', walletTransactionSchema);