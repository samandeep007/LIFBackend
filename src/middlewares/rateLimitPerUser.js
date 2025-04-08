import rateLimit from 'express-rate-limit';
import { authMiddleware } from '../lib.js';

export default rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator: async (req) => {
        try {
            const { userId } = await authMiddleware(req);
            return userId;
        } catch (err) {
            return req.ip;
        }
    },
    message: 'Too many requests from this user, please try again later.',
});