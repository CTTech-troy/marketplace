import express from 'express';
import * as productControllerMod from '../controllers/productController.js';
import * as authMod from '../middlewares/authMiddleware.js';

const router = express.Router();

// normalize exports (support both named and default exports)
const productController = productControllerMod.default ?? productControllerMod;
const verifyCandidate = authMod.verifyFirebaseToken ?? authMod.default ?? authMod;
const verifyFirebaseToken = typeof verifyCandidate === 'function' ? verifyCandidate : verifyCandidate.verifyFirebaseToken ?? verifyCandidate;

// helper to ensure handler is a function
const ensureFn = (fn, name) => {
  if (typeof fn !== 'function') {
    throw new TypeError(`${name} must be a function. Got: ${typeof fn}`);
  }
  return fn;
};

// resolve handlers
const listProducts = ensureFn(productController.listProducts ?? productController.default?.listProducts, 'productController.listProducts');
const createProduct = ensureFn(productController.createProduct ?? productController.default?.createProduct, 'productController.createProduct');
const getProduct = ensureFn(productController.getProduct ?? productController.default?.getProduct, 'productController.getProduct');
const updateProduct = ensureFn(productController.updateProduct ?? productController.default?.updateProduct, 'productController.updateProduct');
const deleteProduct = ensureFn(productController.deleteProduct ?? productController.default?.deleteProduct, 'productController.deleteProduct');

if (verifyFirebaseToken) {
  if (typeof verifyFirebaseToken !== 'function') {
    throw new TypeError('verifyFirebaseToken middleware must be a function');
  }
}

// routes
router.get('/', listProducts);
router.post('/', verifyFirebaseToken, createProduct);
router.get('/:id', getProduct);
router.put('/:id', verifyFirebaseToken, updateProduct);
router.delete('/:id', verifyFirebaseToken, deleteProduct);

export default router;