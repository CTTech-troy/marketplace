const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const verifyFirebaseToken = require('../middlewares/authMiddleware');

// Leave a review (auth required)
router.post('/', verifyFirebaseToken, reviewController.leaveReview);

// Get reviews for a product
router.get('/:productId', reviewController.getReviewsByProduct);

module.exports = router;