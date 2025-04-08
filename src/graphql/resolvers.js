import { authController, userController, messageController, safetyController, User, authMiddleware, validateInput, pubsub, ApiError } from '../lib.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

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
    swipe: async (_, { targetId, direction }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.swipe({ userId, body: { targetId, direction } });
      } catch (err) {
        return handleError(err);
      }
    },
    undo: async (_, __, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.undoSwipe({ userId });
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
    superLike: async (_, { targetId }, context) => {
      try {
        const { userId } = await authMiddleware(context.req);
        return await userController.superLike({ userId, body: { targetId } });
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
  },
  Subscription: {
    messageReceived: {
      subscribe: () => pubsub.asyncIterator(['MESSAGE_RECEIVED']),
      resolve: (payload) => payload.messageReceived,
    },
  },
  User: {
    maybeSwipes: async (parent) => User.find({ _id: { $in: parent.maybeSwipes } }),
    skippedMatches: async (parent) => User.find({ _id: { $in: parent.skippedMatches } }),
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
};