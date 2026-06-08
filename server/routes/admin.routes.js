import express from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  assignRole,
  getRoles,
  getRules,
  createRule,
  updateRule,
  deleteRule,
  getAuditLogs,
  getAllAttendance,
} from '../controllers/adminController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { requireRole, requireRoles } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/users', verifyToken, requireRole('admin'), getUsers);
router.post('/users', verifyToken, requireRole('admin'), createUser);
router.patch('/users/:id', verifyToken, requireRole('admin'), updateUser);
router.delete('/users/:id', verifyToken, requireRole('admin'), deleteUser);
router.patch('/users/:id/role', verifyToken, requireRole('admin'), assignRole);

router.get('/roles', verifyToken, requireRole('admin'), getRoles);

router.get('/rules', verifyToken, requireRole('admin'), getRules);
router.post('/rules', verifyToken, requireRole('admin'), createRule);
router.put('/rules/:id', verifyToken, requireRole('admin'), updateRule);
router.delete('/rules/:id', verifyToken, requireRole('admin'), deleteRule);

router.get('/audit-logs', verifyToken, requireRole('admin'), getAuditLogs);
router.get('/attendance', verifyToken, requireRoles(['admin', 'hr']), getAllAttendance);

export default router;
