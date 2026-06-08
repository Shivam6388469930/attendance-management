import express from 'express';
import { clockIn, clockOut, getToday, getHistory } from '../controllers/attendanceController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All authenticated users can view their own attendance; only employees clock in/out
router.post('/clock-in', verifyToken, requireRoles(['employee']), clockIn);
router.post('/clock-out', verifyToken, requireRoles(['employee']), clockOut);
router.get('/today', verifyToken, requireRoles(['employee', 'hr', 'admin']), getToday);
router.get('/history', verifyToken, requireRoles(['employee', 'hr', 'admin']), getHistory);

export default router;
