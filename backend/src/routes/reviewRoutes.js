// backend/src/routes/reviewRoutes.js
import express from "express";
import { verifyFirebaseToken } from "../middlewares/authMiddleware.js";
import * as reviewController from "../controllers/reviewController.js";

const router = express.Router();

router.post("/", verifyFirebaseToken, reviewController.createReview);
router.get("/", reviewController.getAllReviews);
router.get("/:id", reviewController.getReviewById);
router.put("/:id", verifyFirebaseToken, reviewController.updateReview);
router.delete("/:id", verifyFirebaseToken, reviewController.deleteReview);

export default router;
