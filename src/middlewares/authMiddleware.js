import { jwt, User, winston, ApiError, asyncHandler } from '../lib.js';

export default asyncHandler(async (req) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) throw new ApiError(401, 'No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.tokenVersion !== decoded.tokenVersion) {
        throw new ApiError(401, 'Invalid or expired token');
    }
    winston.info(`User ${user.email} authenticated`);
    return { userId: decoded.id };
});