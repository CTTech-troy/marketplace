import express from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import * as orderController from '../controllers/orderController.js';

const router = express.Router();

// Routes
router.post('/', authMiddleware.verifyFirebaseToken, orderController.createOrder);
router.get('/', authMiddleware.verifyFirebaseToken, orderController.listOrders);
router.get('/:id', authMiddleware.verifyFirebaseToken, orderController.getOrder);
router.post('/checkout', authMiddleware.verifyFirebaseToken, orderController.checkout);
router.post('/confirm', authMiddleware.verifyFirebaseToken, orderController.confirmOrder);

export default router;