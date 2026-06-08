import { body, validationResult } from 'express-validator';

export const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

export const validateClockInOut = [
  (req, res, next) => {
    // No body validation needed for clock-in/out
    next();
  },
];

export const validateCorrectionRequest = [
  body('attendance_record_id').isInt(),
  body('request_type').isIn(['missed_in', 'missed_out', 'wrong_in', 'wrong_out']),
  body('date').isISO8601(),
  body('corrected_time').isISO8601(),
  body('reason').isLength({ min: 5 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];