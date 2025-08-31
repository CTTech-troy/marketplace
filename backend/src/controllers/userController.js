const User = require('../models/User');

exports.getUser Profile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) return res.status(404).json({ error: 'User  not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile