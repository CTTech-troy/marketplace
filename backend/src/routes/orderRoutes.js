const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const verifyFirebaseToken = require('../middlewares/authMiddleware');

// Initiate Monnify payment checkout
router.post('/checkout', verifyFirebaseToken, orderController.checkout);

// Confirm order after payment success
router.post('/confirm', verifyFirebaseToken, orderController.confirmOrder);

// Get order details by ID
router.get('/:id', verifyFirebaseToken, orderController.getOrderById);

module.exports = router;