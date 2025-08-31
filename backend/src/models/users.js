// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUID: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  profile: {
    bio: String,
    location: String,
    profilePic: String,
    isAnonymous: { type: Boolean, default: false }
  },
  walletBalance: { type: Number, default: 0 },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User ' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User ' }],
  amountMadeFromSales: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User ', userSchema);
