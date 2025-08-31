const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyFirebaseToken = require('../middlewares/authMiddleware');

// Get current user profile
router.get('/me', verifyFirebaseToken, userController.getUser Profile);

// Additional user routes can be added here (follow/unfollow, update profile, etc.)

module.exports = router;