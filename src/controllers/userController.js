import { User, Match, Message, Like, winston, ApiError, ApiResponse, asyncHandler, pubsub } from '../lib.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

/**
 * @swagger
 * /api/users/profiles:
 *   get:
 *     summary: Get user profiles based on filters
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: number
 *         description: Max distance in km (default: 50)
 *       - in: query
 *         name: minAge
 *         schema:
 *           type: integer
 *         description: Min age (default: 18)
 *       - in: query
 *         name: maxAge
 *         schema:
 *           type: integer
 *         description: Max age (default: 100)
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Gender (default: all)
 *       - in: query
 *         name: preferences
 *         schema:
 *           type: string
 *         description: Preference (default: all)
 *     responses:
 *       200:
 *         description: Profiles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const getProfiles = asyncHandler(async (req) => {
  const { lat, lng, maxDistance = 50, minAge = 18, maxAge = 100, gender, interests, preferences, ethnicity, education, smoking } = req.query;
  const user = await User.findById(req.userId);
  if (!user) throw new ApiError(404, 'User not found');

  const query = {
    _id: { $ne: req.userId },
    hiatus: false,
    location: { $near: { $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] }, $maxDistance: maxDistance * 1000 } },
    age: { $gte: minAge, $lte: maxAge },
  };
  if (gender) query.gender = gender;
  if (interests) query.interests = { $in: interests.split(',') };
  if (preferences) query.preferences = preferences;
  if (ethnicity) query.ethnicity = ethnicity;
  if (education) query.education = education;
  if (smoking !== undefined) query.smoking = smoking === 'true';

  const profiles = await User.find(query).limit(10);
  return new ApiResponse(200, profiles, 'Profiles retrieved successfully');
});

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               bio: { type: string, maxLength: 100 }
 *               prompt: { type: string, maxLength: 50 }
 *               lat: { type: number }
 *               lng: { type: number }
 *               age: { type: number, minimum: 18 }
 *               gender: { type: string, enum: [male, female, nonbinary] }
 *               interests: { type: string }
 *               preferences: { type: string, enum: [long-term, casual, intimacy] }
 *               ethnicity: { type: string }
 *               education: { type: string }
 *               smoking: { type: boolean }
 *               photo: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const updateProfile = asyncHandler(async (req) => {
  const user = await User.findById(req.userId);
  if (!user) throw new ApiError(404, 'User not found');

  const { name, bio, prompt, lat, lng, age, gender, interests, preferences, ethnicity, education, smoking } = req.body;
  const file = req.file;

  if (name) user.name = name;
  if (bio) user.bio = bio;
  if (prompt) user.prompt = prompt;
  if (lat && lng) user.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
  if (age) user.age = parseInt(age);
  if (gender) user.gender = gender;
  if (interests) user.interests = interests.split(',');
  if (preferences) user.preferences = preferences;
  if (ethnicity) user.ethnicity = ethnicity;
  if (education) user.education = education;
  if (smoking !== undefined) user.smoking = smoking === 'true';
  if (file) {
    const photoURL = await uploadToCloudinary(file.path, { public_id: `${user.email}-${Date.now()}` });
    user.photoURL = photoURL;
  }

  await user.save();
  winston.info(`Profile updated for user ${req.userId}`);
  return new ApiResponse(200, user, 'Profile updated successfully');
});

/**
 * @swagger
 * /api/users/profile:
 *   delete:
 *     summary: Delete user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const deleteProfile = asyncHandler(async (req) => {
  const user = await User.findById(req.userId);
  if (!user) throw new ApiError(404, 'User not found');

  await Message.deleteMany({ $or: [{ sender: req.userId }, { receiver: req.userId }] });
  await Match.deleteMany({ users: req.userId });
  await Like.deleteMany({ $or: [{ liker: req.userId }, { likee: req.userId }] });
  await Confession.deleteMany({ sender: req.userId });
  await SafetyReport.deleteMany({ $or: [{ userId: req.userId }, { reportedUserId: req.userId }] });
  await User.updateMany({ maybeLikes: req.userId }, { $pull: { maybeLikes: req.userId } });

  await User.deleteOne({ _id: req.userId });
  winston.info(`Profile deleted for user ${req.userId}`);
  return new ApiResponse(200, null, 'Profile deleted successfully');
});

/**
 * @swagger
 * /api/users/like:
 *   post:
 *     summary: Like or mark a user profile as maybe
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
 *               direction: { type: string, enum: [right, up] }
 *     responses:
 *       200:
 *         description: Profile liked or marked as maybe, possible match created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const likeProfile = asyncHandler(async (req) => {
  const { targetId, direction } = req.body;
  const likerId = req.userId;

  if (!['right', 'up'].includes(direction)) throw new ApiError(400, 'Invalid direction. Use "right" or "up"');
  if (likerId === targetId) throw new ApiError(400, 'Cannot like yourself');
  const target = await User.findById(targetId);
  if (!target) throw new ApiError(404, 'Target user not found');

  const user = await User.findById(likerId);

  if (direction === 'right') {
    const existingLike = await Like.findOne({ liker: likerId, likee: targetId });
    if (existingLike) throw new ApiError(400, 'Already liked this profile');

    const like = new Like({ liker: likerId, likee: targetId, isSuperLike: false });
    await like.save();
    user.lastSwipeAction = { direction: 'right', targetId, timestamp: new Date() };
    await user.save();
    winston.info(`User ${likerId} liked ${targetId}`);

    const mutualLike = await Like.findOne({ liker: targetId, likee: likerId });
    if (mutualLike) {
      const existingMatch = await Match.findOne({ users: { $all: [likerId, targetId] } });
      if (!existingMatch) {
        const match = new Match({ users: [likerId, targetId] });
        await match.save();
        pubsub.publish('MATCH_CREATED', { matchCreated: match });
        winston.info(`Match created between ${likerId} and ${targetId}`);
        return new ApiResponse(200, { match, isMatch: true }, 'Match created!');
      }
      return new ApiResponse(200, { match: existingMatch, isMatch: true }, 'Match already exists');
    }
    return new ApiResponse(200, { like, isMatch: false }, 'Profile liked');
  } else if (direction === 'up') {
    if (user.maybeLikes.includes(targetId)) throw new ApiError(400, 'Already marked as maybe');
    user.maybeLikes.push(targetId);
    user.lastSwipeAction = { direction: 'up', targetId, timestamp: new Date() };
    await user.save();
    winston.info(`User ${likerId} marked ${targetId} as maybe`);
    return new ApiResponse(200, { maybe: targetId }, 'Profile marked as maybe');
  }
});

/**
 * @swagger
 * /api/users/maybe-likes:
 *   get:
 *     summary: Get user's maybe likes list
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Maybe likes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const getMaybeLikes = asyncHandler(async (req) => {
  const user = await User.findById(req.userId).populate('maybeLikes', 'name photoURL bio age gender');
  if (!user) throw new ApiError(404, 'User not found');
  return new ApiResponse(200, user.maybeLikes, 'Maybe likes retrieved successfully');
});

/**
 * @swagger
 * /api/users/undo:
 *   post:
 *     summary: Undo the last swipe action
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Last swipe undone successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const undoLastSwipe = asyncHandler(async (req) => {
  const user = await User.findById(req.userId);
  if (!user) throw new ApiError(404, 'User not found');
  const { direction, targetId, timestamp } = user.lastSwipeAction || {};

  if (!direction || !targetId || !timestamp) throw new ApiError(400, 'No recent swipe to undo');
  if (Date.now() - new Date(timestamp) > 24 * 60 * 60 * 1000) throw new ApiError(400, 'Undo period expired (24 hours)');

  if (direction === 'right') {
    const like = await Like.findOneAndDelete({ liker: req.userId, likee: targetId });
    if (!like) throw new ApiError(400, 'Like not found to undo');
    winston.info(`User ${req.userId} undid like for ${targetId}`);
  } else if (direction === 'up') {
    user.maybeLikes = user.maybeLikes.filter(id => id.toString() !== targetId.toString());
    winston.info(`User ${req.userId} undid maybe for ${targetId}`);
  }

  user.lastSwipeAction = { direction: null, targetId: null, timestamp: null };
  await user.save();

  const undoneUser = await User.findById(targetId);
  return new ApiResponse(200, { undoneUser }, 'Last swipe undone successfully');
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
  const likesGiven = await Like.countDocuments({ liker: req.userId });
  const likesReceived = await Like.countDocuments({ likee: req.userId });
  const superLikesGiven = await Like.countDocuments({ liker: req.userId, isSuperLike: true });
  const matches = await Match.countDocuments({ users: req.userId });

  const sentMessages = messages.filter(m => m.sender.toString() === req.userId.toString());
  const receivedMessages = messages.filter(m => m.receiver.toString() === req.userId.toString());
  const avgResponseTime = receivedMessages.length
    ? receivedMessages.reduce((sum, m) => sum + (m.read ? new Date(m.readAt || m.timestamp) - new Date(m.timestamp) : 0), 0) / receivedMessages.length
    : 0;
  const ghostedCount = sentMessages.filter(m => !m.read && (Date.now() - new Date(m.timestamp)) > 5 * 24 * 60 * 60 * 1000).length;

  const stats = {
    views: user.views,
    likesGiven,
    likesReceived,
    superLikesGiven,
    matches,
    avgResponseTime: avgResponseTime / (1000 * 60),
    ghostedCount,
  };
  return new ApiResponse(200, stats, 'Stats retrieved successfully');
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