// routes/userRoutes.js
import express from 'express';
import * as userController from '../controllers/userController.js';

const router = express.Router();

router.get('/', userController.getAllUsers);             // GET /api/users
router.get('/:id', userController.getUserById);         // GET /api/users/:id
router.get('/profile', userController.getUserProfile);  // Optional, requires auth
router.patch('/:id/disable', userController.disableUser); // PATCH to toggle status
router.delete('/:id', userController.deleteUser);         // DELETE user

export default router;
