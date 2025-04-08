import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cloudinary } from './utils/cloudinary.js';
import winston from './utils/logger.js';
import { PubSub } from 'graphql-subscriptions';
import ApiError from './utils/apiError.js';
import ApiResponse from './utils/apiResponse.js';
import asyncHandler from './utils/asyncHandler.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './swagger.js';

import User from './models/User.js';
import Message from './models/Message.js';
import Match from './models/Match.js';
import Confession from './models/Confession.js';
import SafetyReport from './models/SafetyReport.js';
import Notification from './models/Notification.js';
import Call from './models/Call.js';

import * as authController from './controllers/authController.js';
import * as userController from './controllers/userController.js';
import * as messageController from './controllers/messageController.js';
import * as safetyController from './controllers/safetyController.js';
import * as notificationController from './controllers/notificationController.js';
import * as callController from './controllers/callController.js';

import authMiddleware from './middlewares/authMiddleware.js';
import validateInput from './middlewares/validateInput.js';
import rateLimitPerUser from './middlewares/rateLimitPerUser.js';

import { uploadToCloudinary } from './utils/cloudinary.js';
import { startAutoDelete } from './utils/autoDelete.js';

const pubsub = new PubSub();

export {
  mongoose,
  jwt,
  bcrypt,
  cloudinary,
  winston,
  pubsub,
  ApiError,
  ApiResponse,
  asyncHandler,
  swaggerUi,
  swaggerSpec,
  User,
  Message,
  Match,
  Confession,
  SafetyReport,
  Notification,
  Call,
  authController,
  userController,
  messageController,
  safetyController,
  notificationController,
  callController,
  authMiddleware,
  validateInput,
  rateLimitPerUser,
  uploadToCloudinary,
  startAutoDelete,
};