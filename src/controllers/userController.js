import { User, Match, Message, winston, ApiError, ApiResponse, asyncHandler } from '../lib.js';

/**
 * @swagger
 * /api/users/profiles:
 *   get:
 *     summary: Get filtered user profiles
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *         description: Max distance in km (default: 50)
 *       - in: query
 *         name: minAge
 *         schema:
 *           type: number
 *         description: Min age (default: 18)
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: number
 *         description: Max age (default: 100)
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, nonbinary, all]
 *         description: Gender (default: all)
 *       - in: query
 *         name: interests
 *         schema:
 *           type: string
 *         description: Comma-separated interests
 *       - in: query
 *         name: preferences
 *         schema:
 *           type: string
 *           enum: [long-term, casual, intimacy, all]
 *         description: Preference (default: all)
 *       - in: query
 *         name: ethnicity
 *         schema:
 *           type: string
 *         description: Ethnicity
 *       - in: query
 *         name: education
 *         schema:
 *           type: string
 *         description: Education level
 *       - in: query
 *         name: smoking
 *         schema:
 *           type: boolean
 *         description: Smoking preference
 *     responses:
 *       200:
 *         description: Profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const getProfiles = asyncHandler(async (req) => {
  const {
    lat, lng, maxDistance = 50, minAge = 18, maxAge = 100, gender = 'all',
    interests, preferences = 'all', ethnicity, education, smoking,
  } = req.query;

  if (!lat || !lng) throw new ApiError(400, 'Latitude and longitude are required');

  const query = {
    _id: { $ne: req.userId },
    hiatus: false,
    location: {
      $near: {
        $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        $maxDistance: parseFloat(maxDistance) * 1000, // km to meters
      },
    },
    age: { $gte: parseInt(minAge), $lte: parseInt(maxAge) },
  };

  if (gender !== 'all') query.gender = gender;
  if (interests) query.interests = { $in: interests.split(',') };
  if (preferences !== 'all') query.preferences = preferences;
  if (ethnicity) query.ethnicity = ethnicity;
  if (education) query.education = education;
  if (smoking !== undefined) query.smoking = smoking === 'true';

  const users = await User.find(query).sort({ boostedUntil: -1 });
  const currentUser = await User.findById(req.userId);
  currentUser.views += 1;
  await currentUser.save();
  return new ApiResponse(200, users, 'Profiles retrieved successfully');
});

/**
 * @swagger
 * /api/users/swipe:
 *   post:
 *     summary: Swipe on a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetId: { type: string }
 *               direction: { type: string, enum: [right, left, up] }
 *     responses:
 *       200:
 *         description: Swipe successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const swipe = asyncHandler(async (req) => {
  const { targetId, direction } = req.body;
  if (!['right', 'left', 'up'].includes(direction)) throw new ApiError(400, 'Invalid swipe direction');
  const user = await User.findById(req.userId);
  const target = await User.findById(targetId);
  if (!target) throw new ApiError(404, 'Target user not found');

  if (direction === 'right') {
    target.swipesRight += 1;
    const reverseSwipe = await Match.findOne({ users: [targetId, req.userId] });
    if (reverseSwipe) {
      await Match.create({ users: [req.userId, targetId] });
      winston.info(`Match created between ${req.userId} and ${targetId}`);
      return new ApiResponse(200, { match: true }, 'Swipe successful, match created');
    }
  } else if (direction === 'left') {
    target.swipesLeft += 1;
    user.skippedMatches.push(targetId);
  } else if (direction === 'up') {
    user.maybeSwipes.push(targetId);
  }
  await user.save();
  await target.save();
  return new ApiResponse(200, { match: false }, 'Swipe successful');
});

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const getStats = asyncHandler(async (req) => {
  const user = await User.findById(req.userId);
  const messages = await Message.find({ $or: [{ sender: req.userId }, { receiver: req.userId }] });

  const sentMessages = messages.filter(m => m.sender.toString() === req.userId.toString());
  const receivedMessages = messages.filter(m => m.receiver.toString() === req.userId.toString());
  const avgResponseTime = receivedMessages.length
    ? receivedMessages.reduce((sum, m) => sum + (m.read ? new Date(m.readAt || m.timestamp) - new Date(m.timestamp) : 0), 0) / receivedMessages.length
    : 0;
  const ghostedCount = sentMessages.filter(m => !m.read && (Date.now() - new Date(m.timestamp)) > 5 * 24 * 60 * 60 * 1000).length;

  const stats = {
    views: user.views,
    swipesRight: user.swipesRight,
    swipesLeft: user.swipesLeft,
    superLikes: user.superLikesReceived,
    avgResponseTime: avgResponseTime / (1000 * 60),
    ghostedCount,
  };
  return new ApiResponse(200, stats, 'Stats retrieved successfully');
});

/**
 * @swagger
 * /api/users/undo:
 *   post:
 *     summary: Undo the last swipe
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Swipe undone successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const undoSwipe = asyncHandler(async (req) => {
  const user = await User.findById(req.userId);
  const lastSkipped = user.skippedMatches.pop();
  await user.save();
  winston.info(`User ${req.userId} undid swipe for ${lastSkipped}`);
  const undoneUser = lastSkipped ? await User.findById(lastSkipped) : null;
  return new ApiResponse(200, { undoneUser }, 'Swipe undone successfully');
});

/**
 * @swagger
 * /api/users/hiatus:
 *   post:
 *     summary: Toggle hiatus mode
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Hiatus toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const toggleHiatus = asyncHandler(async (req) => {
  const user = await User.findById(req.userId);
  user.hiatus = !user.hiatus;
  await user.save();
  winston.info(`User ${req.userId} toggled hiatus to ${user.hiatus}`);
  return new ApiResponse(200, user.hiatus, `Hiatus ${user.hiatus ? 'enabled' : 'disabled'} successfully`);
});

/**
 * @swagger
 * /api/users/superlike:
 *   post:
 *     summary: Super like a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               targetId: { type: string }
 *     responses:
 *       200:
 *         description: Super like successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const superLike = asyncHandler(async (req) => {
  const { targetId } = req.body;
  const target = await User.findById(targetId);
  if (!target) throw new ApiError(404, 'Target user not found');
  target.superLikesReceived += 1;
  await target.save();
  winston.info(`User ${req.userId} super-liked ${targetId}`);
  return new ApiResponse(200, true, 'Super like successful');
});

/**
 * @swagger
 * /api/users/boost:
 *   post:
 *     summary: Boost user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile boosted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const boostProfile = asyncHandler(async (req) => {
  const user = await User.findById(req.userId);
  user.boostedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  winston.info(`User ${req.userId} boosted profile`);
  return new ApiResponse(200, true, 'Profile boosted successfully');
});