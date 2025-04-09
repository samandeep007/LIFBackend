import { authController, userController, messageController, safetyController, notificationController, callController, User, Notification, Call, Like, Match, authMiddleware, validateInput, pubsub, ApiError } from '../lib.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { withFilter } from 'graphql-subscriptions';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../public/temp')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});
const upload = multer({ storage });

const handleError = (err) => {
  if (err instanceof ApiError) {
    return { statusCode: err.statusCode, success: false, message: err.message, data: null };
  }
  return { statusCode: 500, success: false, message: 'Internal server error', data: null };
};

export default {
  Query: {
    profiles: async (_, args, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.getProfiles({ userId, query: args });
      } catch (err) {
        return handleError(err);
      }
    },
    stats: async (_, __, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.getStats({ userId });
      } catch (err) {
        return handleError(err);
      }
    },
    conversation: async (_, { userId }, context) => {
      try {
        const { userId: currentUserId } = await authMiddleware(context.req);
        return await messageController.getConversation({ userId: currentUserId, params: { userId } });
      } catch (err) {
        return handleError(err);
      }
    },
    safetyGuidelines: async () => {
      try {
        return await messageController.getSafetyGuidelines();
      } catch (err) {
        return handleError(err);
      }
    },
    notifications: async (_, { userId }, context) => {
      try {
        const { userId: requesterId } = await authMiddleware(context.req);
        if (requesterId !== userId) throw new ApiError(403, 'Unauthorized');
        return await notificationController.getNotifications({ userId });
      } catch (err) {
        return handleError(err);
      }
    },
    callHistory: async (_, { userId }, context) => {
      try {
        const { userId: requesterId } = await authMiddleware(context.req);
        if (requesterId !== userId) throw new ApiError(403, 'Unauthorized');
        return await callController.getCallHistory({ userId });
      } catch (err) {
        return handleError(err);
      }
    },
    maybeLikes: async (_, __, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.getMaybeLikes({ userId });
      } catch (err) {
        return handleError(err);
      }
    },
  },
  Mutation: {
    register: async (_, args, context) => {
      try {
        await new Promise((resolve) => upload.single('photo')(context.req, {}, resolve));
        context.req.body = args;
        await validateInput('register')(context.req, {}, () => {});
        return await authController.register(context.req);
      } catch (err) {
        return handleError(err);
      }
    },
    login: async (_, args, context) => {
      try {
        context.req.body = args;
        await validateInput('login')(context.req, {}, () => {});
        return await authController.login(context.req);
      } catch (err) {
        return handleError(err);
      }
    },
    verifyEmail: async (_, { token }, context) => {
      try {
        context.req.query = { token };
        return await authController.verifyEmail(context.req);
      } catch (err) {
        return handleError(err);
      }
    },
    forgotPassword: async (_, { email }, context) => {
      try {
        context.req.body = { email };
        return await authController.forgotPassword(context.req);
      } catch (err) {
        return handleError(err);
      }
    },
    resetPassword: async (_, { token, password }, context) => {
      try {
        context.req.query = { token };
        context.req.body = { password };
        return await authController.resetPassword(context.req);
      } catch (err) {
        return handleError(err);
      }
    },
    updateProfile: async (_, args, context) => {
      try {
        await new Promise((resolve) => upload.single('photo')(context.req, {}, resolve));
        const { userId } = await authMiddleware(context.req);
        context.req.body = args;
        return await userController.updateProfile({ userId, ...context.req });
      } catch (err) {
        return handleError(err);
      }
    },
    deleteProfile: async (_, __, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.deleteProfile({ userId });
      } catch (err) {
        return handleError(err);
      }
    },
    likeProfile: async (_, { targetId, direction }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.likeProfile({ userId, body: { targetId, direction } });
      } catch (err) {
        return handleError(err);
      }
    },
    undoLastSwipe: async (_, __, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.undoLastSwipe({ userId });
      } catch (err) {
        return handleError(err);
      }
    },
    toggleHiatus: async (_, __, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.toggleHiatus({ userId });
      } catch (err) {
        return handleError(err);
      }
    },
    boostProfile: async (_, __, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.boostProfile({ userId });
      } catch (err) {
        return handleError(err);
      }
    },
    sendMessage: async (_, { receiverId, text }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await messageController.sendMessage({ userId, body: { receiverId, text } });
      } catch (err) {
        return handleError(err);
      }
    },
    sendConfession: async (_, { text }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await messageController.sendConfession({ userId, body: { text } });
      } catch (err) {
        return handleError(err);
      }
    },
    reportSuspiciousActivity: async (_, { reportedUserId, location, reason }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        context.req.body = { reportedUserId, location, reason };
        await validateInput('reportSuspicious')(context.req, {}, () => {});
        return await safetyController.reportSuspiciousActivity(context.req);
      } catch (err) {
        return handleError(err);
      }
    },
    verifyLocation: async (_, { location }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await safetyController.verifyLocation({ userId, body: { location } });
      } catch (err) {
        return handleError(err);
      }
    },
    confirmIdentity: async (_, __, context) => {
      try {
        await new Promise((resolve) => upload.single('photo')(context.req, {}, resolve));
        const { userId } = await authMiddleware(context.req);
        return await safetyController.confirmIdentity(context.req);
      } catch (err) {
        return handleError(err);
      }
    },
    markNotificationRead: async (_, { id }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        context.req.body = { id };
        return await notificationController.markNotificationRead({ userId, ...context.req });
      } catch (err) {
        return handleError(err);
      }
    },
    initiateCall: async (_, { receiverId, type }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await callController.initiateCall({ userId, body: { receiverId, type } });
      } catch (err) {
        return handleError(err);
      }
    },
    acceptCall: async (_, { callId }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await callController.acceptCall({ userId, body: { callId } });
      } catch (err) {
        return handleError(err);
      }
    },
    rejectCall: async (_, { callId }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await callController.rejectCall({ userId, body: { callId } });
      } catch (err) {
        return handleError(err);
      }
    },
    endCall: async (_, { callId }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await callController.endCall({ userId, body: { callId } });
      } catch (err) {
        return handleError(err);
      }
    },
  },
  Subscription: {
    messageReceived: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['MESSAGE_RECEIVED']),
        (payload, variables) => payload.messageReceived.receiver.toString() === variables.receiverId
      ),
      resolve: (payload) => payload.messageReceived,
    },
    notificationReceived: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['NOTIFICATION_RECEIVED']),
        (payload, variables) => payload.notificationReceived.userId.toString() === variables.userId
      ),
      resolve: (payload) => payload.notificationReceived,
    },
    callInitiated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['CALL_INITIATED']),
        (payload, variables) => payload.callInitiated.receiver.toString() === variables.receiverId
      ),
      resolve: (payload) => payload.callInitiated,
    },
    matchCreated: {
      subscribe: withFilter(
        () => pubsub.asyncIterator(['MATCH_CREATED']),
        (payload, _, context) => {
          const userId = context.req.userId;
          return payload.matchCreated.users.some(u => u.toString() === userId);
        }
      ),
      resolve: (payload) => payload.matchCreated,
    },
  },
  User: {
    maybeLikes: async (parent) => User.find({ _id: { $in: parent.maybeLikes } }),
    location: (parent) => parent.location,
    interests: (parent) => parent.interests || [],
  },
  Like: {
    liker: async (parent) => User.findById(parent.liker),
    likee: async (parent) => User.findById(parent.likee),
  },
  Message: {
    sender: async (parent) => User.findById(parent.sender),
    receiver: async (parent) => User.findById(parent.receiver),
  },
  Match: {
    users: async (parent) => User.find({ _id: { $in: parent.users } }),
  },
  Confession: {
    sender: async (parent) => User.findById(parent.sender),
  },
  SafetyReport: {
    userId: async (parent) => User.findById(parent.userId),
    reportedUserId: async (parent) => User.findById(parent.reportedUserId),
  },
  Notification: {
    userId: async (parent) => parent.userId,
  },
  Call: {
    caller: async (parent) => User.findById(parent.caller),
    receiver: async (parent) => User.findById(parent.receiver),
  },
};