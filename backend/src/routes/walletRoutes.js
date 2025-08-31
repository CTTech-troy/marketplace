const express = require('express');
const router = express.Router();
const walletController = require('../controllers/walletController');
const verifyFirebaseToken = require('../middlewares/authMiddleware');

// Get wallet balance
router.get('/', verifyFirebaseToken, walletController.getWalletBalance);

// Withdraw funds from wallet
router.post('/withdraw', verifyFirebaseToken, walletController.withdrawFunds);

module.exports = router;