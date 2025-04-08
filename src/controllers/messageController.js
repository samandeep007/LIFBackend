import { Message, Confession, User, winston, pubsub, ApiError, ApiResponse, asyncHandler, notificationController } from '../lib.js';

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
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
 *               receiverId: { type: string }
 *               text: { type: string }
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
  if (!text.trim()) throw new ApiError(400, 'Message text cannot be empty');
  const message = new Message({ sender: req.userId, receiver: receiverId, text });
  await message.save();
  winston.info(`Message sent from ${req.userId} to ${receiverId}`);
  pubsub.publish('MESSAGE_RECEIVED', { messageReceived: message });

  const sender = await User.findById(req.userId);
  await notificationController.createNotification({
    userId: receiverId,
    type: 'message',
    message: `New message from ${sender.name}`,
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