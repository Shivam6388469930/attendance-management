import express from 'express';
import { login, logout, getMe, refreshToken, updateProfile, changePassword } from '../controllers/authController.js';
import { validateLogin } from '../utils/validators.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', validateLogin, login);
router.post('/logout', verifyToken, logout);
router.get('/me', verifyToken, getMe);
router.post('/refresh-token', refreshToken);
router.patch('/profile', verifyToken, updateProfile);
router.post('/change-password', verifyToken, changePassword);

export default router;
