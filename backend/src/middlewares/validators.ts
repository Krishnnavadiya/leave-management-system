import { body } from 'express-validator';
import { LeaveType } from '../config/enums';

export const loginValidator = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

export const leaveApplicationValidator = [
  body('leaveType')
    .isIn(Object.values(LeaveType))
    .withMessage(`Must be one of the following types: ${Object.values(LeaveType).join(', ')}`),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 5, max: 200 })
    .withMessage('Reason must be between 5 and 200 characters'),
];

export const reviewLeaveValidator = [
  body('comment')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Comment must not exceed 200 characters'),
];
