import { Message, Confession, User, winston, pubsub, ApiError, ApiResponse, asyncHandler, notificationController, mongoose } from '../lib.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message (text or image)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               receiverId: { type: string }
 *               text: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const sendMessage = asyncHandler(async (req) => {
  const { receiverId, text } = req.body;
  const file = req.file; // Expect file from multipart/form-data

  if (!text?.trim() && !file) throw new ApiError(400, 'Message must contain text or an image');

  let mediaURL;
  if (file) {
    mediaURL = await uploadToCloudinary(file.path, { folder: 'lif_messages' });
  }

  const message = new Message({
    sender: req.userId,
    receiver: receiverId,
    text: text || '',
    mediaURL,
  });
  await message.save();
  winston.info(`Message sent from ${req.userId} to ${receiverId}${file ? ' with image' : ''}`);
  pubsub.publish('MESSAGE_RECEIVED', { messageReceived: message });

  const sender = await User.findById(req.userId);
  await notificationController.createNotification({
    userId: receiverId,
    type: 'message',
    message: `New message from ${sender.name}${file ? ' (with image)' : ''}`,
  });

  return new ApiResponse(200, message, 'Message sent successfully');
});

/**
 * @swagger
 * /api/messages/conversation/{userId}:
 *   get:
 *     summary: Get conversation with a user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const getConversation = asyncHandler(async (req) => {
  const messages = await Message.find({
    $or: [
      { sender: req.userId, receiver: req.params.userId },
      { sender: req.params.userId, receiver: req.userId },
    ],
  }).sort('timestamp');
  return new ApiResponse(200, messages, 'Conversation retrieved successfully');
});

/**
 * @swagger
 * /api/messages/inbox:
 *   get:
 *     summary: Get all conversations for the user (inbox)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Inbox retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const getInbox = asyncHandler(async (req) => {
  const userId = req.userId;
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [{ sender: mongoose.Types.ObjectId(userId) }, { receiver: mongoose.Types.ObjectId(userId) }],
      },
    },
    {
      $sort: { timestamp: -1 },
    },
    {
      $group: {
        _id: {
          $cond: [{ $eq: ['$sender', mongoose.Types.ObjectId(userId)] }, '$receiver', '$sender'],
        },
        lastMessage: { $first: '$text' },
        lastMediaURL: { $first: '$mediaURL' }, // Include last image if present
        timestamp: { $first: '$timestamp' },
        unreadCount: {
          $sum: { $cond: [{ $and: [{ $eq: ['$receiver', mongoose.Types.ObjectId(userId)] }, { $eq: ['$read', false] }] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user',
      },
    },
    { $unwind: '$user' },
    {
      $project: {
        userId: '$_id',
        name: '$user.name',
        photoURL: '$user.photoURL',
        lastMessage: 1,
        lastMediaURL: 1,
        timestamp: 1,
        unreadCount: 1,
      },
    },
  ]);
  return new ApiResponse(200, conversations, 'Inbox retrieved successfully');
});

/**
 * @swagger
 * /api/messages/conversation/{userId}:
 *   delete:
 *     summary: Delete a conversation with a user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const deleteConversation = asyncHandler(async (req) => {
  const { userId: otherUserId } = req.params;
  await Message.deleteMany({
    $or: [
      { sender: req.userId, receiver: otherUserId },
      { sender: otherUserId, receiver: req.userId },
    ],
  });
  winston.info(`Conversation between ${req.userId} and ${otherUserId} deleted`);
  return new ApiResponse(200, null, 'Conversation deleted successfully');
});

/**
 * @swagger
 * /api/messages/conversation/{userId}/read:
 *   put:
 *     summary: Mark messages from a user as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages marked as read
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const markMessagesRead = asyncHandler(async (req) => {
  const { userId: senderId } = req.params;
  await Message.updateMany(
    { sender: senderId, receiver: req.userId, read: false },
    { read: true, readAt: new Date() }
  );
  winston.info(`Messages from ${senderId} to ${req.userId} marked as read`);
  return new ApiResponse(200, null, 'Messages marked as read');
});

/**
 * @swagger
 * /api/messages/confession:
 *   post:
 *     summary: Send a confession to a random user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text: { type: string }
 *     responses:
 *       200:
 *         description: Confession sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const sendConfession = asyncHandler(async (req) => {
  const { text } = req.body;
  if (!text.trim()) throw new ApiError(400, 'Confession text cannot be empty');
  const confession = new Confession({ text, sender: req.userId });
  await confession.save();

  const users = await User.find({ _id: { $ne: req.userId }, hiatus: false });
  const randomUser = users[Math.floor(Math.random() * users.length)];
  const message = new Message({ sender: req.userId, receiver: randomUser._id, text, isConfession: true });
  await message.save();
  winston.info(`Confession sent from ${req.userId} to ${randomUser._id}`);
  pubsub.publish('MESSAGE_RECEIVED', { messageReceived: message });

  const sender = await User.findById(req.userId);
  await notificationController.createNotification({
    userId: randomUser._id,
    type: 'confession',
    message: `New confession from ${sender.name}`,
  });

  return new ApiResponse(200, true, 'Confession sent successfully');
});

/**
 * @swagger
 * /api/messages/safety-guidelines:
 *   get:
 *     summary: Get safety guidelines
 *     tags: [Messages]
 *     responses:
 *       200:
 *         description: Safety guidelines retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const getSafetyGuidelines = asyncHandler(() => {
  const guidelines = [
    "What’s your favorite way to spend a weekend?",
    "Are you comfortable sharing your location for safety?",
    "What’s your plan if we meet in person?",
  ];
  return new ApiResponse(200, guidelines, 'Safety guidelines retrieved successfully');
});