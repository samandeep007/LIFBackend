import { body, validationResult } from 'express-validator';
import { winston, ApiError } from '../lib.js';

export default function validateInput(method) {
    switch (method) {
        case 'register':
            return [
                body('email').isEmail().normalizeEmail(),
                body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
                body('name').trim().notEmpty().withMessage('Name is required'),
                body('phone').isMobilePhone().withMessage('Invalid phone number').notEmpty().withMessage('Phone is required'),
                body('prompt').trim().notEmpty().withMessage('Prompt is required').isLength({ max: 50 }),
                (req, res, next) => {
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        winston.warn(`Validation failed: ${JSON.stringify(errors.array())}`);
                        throw new ApiError(400, errors.array()[0].msg);
                    }
                    next();
                },
            ];
        case 'login':
            return [
                body('email').isEmail().normalizeEmail(),
                body('password').notEmpty().withMessage('Password is required'),
                (req, res, next) => {
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        winston.warn(`Validation failed: ${JSON.stringify(errors.array())}`);
                        throw new ApiError(400, errors.array()[0].msg);
                    }
                    next();
                },
            ];
        case 'reportSuspicious':
            return [
                body('reportedUserId').isMongoId().withMessage('Invalid user ID'),
                body('reason').trim().notEmpty().withMessage('Reason is required'),
                body('location').optional().trim(),
                (req, res, next) => {
                    const errors = validationResult(req);
                    if (!errors.isEmpty()) {
                        winston.warn(`Validation failed: ${JSON.stringify(errors.array())}`);
                        throw new ApiError(400, errors.array()[0].msg);
                    }
                    next();
                },
            ];
        default:
            return [];
    }
}