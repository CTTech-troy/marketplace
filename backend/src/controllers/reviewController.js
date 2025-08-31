const Review = require('../models/Review');

exports.leaveReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating) return res.status(400).json({ error: 'Product ID and rating required' });

    const review = new Review({
      productId,
      reviewerId: req.user._id,
      rating,
      comment
    });

    await review.save();
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ error: 'Failed to leave review' });
  }
};

exports.getReviewsByProduct = async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};