const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');

exports.getWalletBalance = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User  not found' });
    res.json({ walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
};

exports.withdrawFunds = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User  not found' });

    if (user.walletBalance < amount) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    // Debit wallet
    user.walletBalance -= amount;
    await user.save();

    await WalletTransaction.create({
      userId: user._id,
      type: 'debit',
      amount,
      reason: 'withdrawal'
    });

    // TODO: Integrate with payout system or bank transfer

    res.json({ message: 'Withdrawal successful', walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ error: 'Withdrawal failed' });
  }
};