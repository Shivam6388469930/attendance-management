import express from 'express';
import {
  createCorrectionRequest,
  getMyCorrections,
  getAllCorrections,
  approveCorrection,
  rejectCorrection,
} from '../controllers/correctionController.js';
import { verifyToken } from '../middleware/authMiddleware.js';
import { validateCorrectionRequest } from '../utils/validators.js';
import { requireRoles } from "../middleware/roleMiddleware.js";
const router = express.Router();

router.post('/', verifyToken, requireRoles(['employee']), validateCorrectionRequest, createCorrectionRequest);
router.get('/mine', verifyToken, requireRoles(['employee']), getMyCorrections);
router.get('/', verifyToken, requireRoles(['hr', 'admin']), getAllCorrections);
router.patch('/:id/approve', verifyToken, requireRoles(['hr', 'admin']), approveCorrection);
router.patch('/:id/reject', verifyToken, requireRoles(['hr', 'admin']), rejectCorrection);

export default router;