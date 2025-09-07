// src/models/Review.js
import { db } from "../firebase.js";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  serverTimestamp,
  doc,
} from "firebase/firestore";

const reviewsCollection = collection(db, "reviews");

/**
 * Create a new review
 * @param {Object} reviewData - { productId, reviewerId, rating, comment }
 */
export async function createReview(reviewData) {
  const { productId, reviewerId, rating, comment = "" } = reviewData;

  if (rating < 1 || rating > 5) {
    throw new Error("Rating must be between 1 and 5");
  }

  return await addDoc(reviewsCollection, {
    productId,
    reviewerId,
    rating,
    comment,
    createdAt: serverTimestamp(),
  });
}

/**
 * Get all reviews for a product
 * @param {string} productId
 */
export async function getReviewsByProduct(productId) {
  const q = query(reviewsCollection, where("productId", "==", productId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get all reviews by a reviewer
 * @param {string} reviewerId
 */
export async function getReviewsByReviewer(reviewerId) {
  const q = query(reviewsCollection, where("reviewerId", "==", reviewerId));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

/**
 * Get a single review by ID
 * @param {string} reviewId
 */
export async function getReviewById(reviewId) {
  const reviewRef = doc(db, "reviews", reviewId);
  const snapshot = await getDoc(reviewRef);

  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}
