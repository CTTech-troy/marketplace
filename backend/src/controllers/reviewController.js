// backend/src/controllers/reviewController.js
import { db } from "../config/firebase.js"; // ✅ Uses firebase-admin instance

const reviewsCollection = db.collection("reviews");

// ✅ Create a new review
export const createReview = async (req, res) => {
  try {
    const newReview = {
      userId: req.user?.uid || null, // Make sure req.user is set by auth middleware
      productId: req.body.productId,
      rating: req.body.rating,
      comment: req.body.comment || "",
      createdAt: new Date().toISOString(),
    };

    const docRef = await reviewsCollection.add(newReview);
    res.status(201).json({ id: docRef.id, ...newReview });
  } catch (error) {
    console.error("Create Review Error:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
};

// ✅ Get all reviews
export const getAllReviews = async (req, res) => {
  try {
    const snapshot = await reviewsCollection.get();
    const reviews = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(reviews);
  } catch (error) {
    console.error("Get All Reviews Error:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
};

// ✅ Get review by ID
export const getReviewById = async (req, res) => {
  try {
    const reviewRef = reviewsCollection.doc(req.params.id);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return res.status(404).json({ error: "Review not found" });
    }

    res.json({ id: reviewSnap.id, ...reviewSnap.data() });
  } catch (error) {
    console.error("Get Review By ID Error:", error);
    res.status(500).json({ error: "Failed to fetch review" });
  }
};

// ✅ Update review
export const updateReview = async (req, res) => {
  try {
    const reviewRef = reviewsCollection.doc(req.params.id);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return res.status(404).json({ error: "Review not found" });
    }

    await reviewRef.update(req.body);
    res.json({ message: "Review updated successfully" });
  } catch (error) {
    console.error("Update Review Error:", error);
    res.status(500).json({ error: "Failed to update review" });
  }
};

// ✅ Delete review
export const deleteReview = async (req, res) => {
  try {
    const reviewRef = reviewsCollection.doc(req.params.id);
    const reviewSnap = await reviewRef.get();

    if (!reviewSnap.exists) {
      return res.status(404).json({ error: "Review not found" });
    }

    await reviewRef.delete();
    res.json({ message: "Review deleted successfully" });
  } catch (error) {
    console.error("Delete Review Error:", error);
    res.status(500).json({ error: "Failed to delete review" });
  }
};
