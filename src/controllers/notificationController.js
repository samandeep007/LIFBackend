import { Notification, pubsub, winston, ApiError, ApiResponse, asyncHandler } from '../lib.js';

export const createNotification = asyncHandler(async ({ userId, type, message }) => {
  const notification = new Notification({ userId, type, message });
  await notification.save();
  winston.info(`Notification created for user ${userId}: ${type}`);
  pubsub.publish('NOTIFICATION_RECEIVED', { notificationReceived: notification });
  return notification;
});

export const getNotifications = asyncHandler(async (req) => {
  const notifications = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 });
  return new ApiResponse(200, notifications, 'Notifications retrieved successfully');
});

export const markNotificationRead = asyncHandler(async (req) => {
  const { id } = req.body;
  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId: req.userId },
    { read: true },
    { new: true }
  );
  if (!notification) throw new ApiError(404, 'Notification not found');
  winston.info(`Notification ${id} marked as read for user ${req.userId}`);
  return new ApiResponse(200, notification, 'Notification marked as read');
});