const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const verifyFirebaseToken = require('../middlewares/authMiddleware');

// Create product/service (auth required)
router.post('/', verifyFirebaseToken, productController.createProduct);

// Get all products with optional filters
router.get('/', productController.getProducts);

// Get product details by ID
router.get('/:id', productController.getProductById);

module.exports = router;