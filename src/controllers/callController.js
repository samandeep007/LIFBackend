import { Call, pubsub, User, winston, ApiError, ApiResponse, asyncHandler } from '../lib.js';

export const initiateCall = asyncHandler(async (req) => {
  const { receiverId, type } = req.body;
  const receiver = await User.findById(receiverId);
  if (!receiver) throw new ApiError(404, 'Receiver not found');
  if (receiver._id.toString() === req.userId) throw new ApiError(400, 'Cannot call yourself');
  if (!['audio', 'video'].includes(type)) throw new ApiError(400, 'Invalid call type');

  const call = new Call({ caller: req.userId, receiver: receiverId, type });
  await call.save();
  winston.info(`Call initiated from ${req.userId} to ${receiverId}, type: ${type}`);
  pubsub.publish('CALL_INITIATED', { callInitiated: call });

  return new ApiResponse(200, call, 'Call initiated successfully');
});

export const acceptCall = asyncHandler(async (req) => {
  const { callId } = req.body;
  const call = await Call.findById(callId);
  if (!call) throw new ApiError(404, 'Call not found');
  if (call.receiver.toString() !== req.userId) throw new ApiError(403, 'Not authorized');
  if (call.status !== 'initiated') throw new ApiError(400, 'Call cannot be accepted');

  call.status = 'accepted';
  call.startTime = new Date();
  await call.save();
  winston.info(`Call ${callId} accepted by ${req.userId}`);

  return new ApiResponse(200, call, 'Call accepted successfully');
});

export const rejectCall = asyncHandler(async (req) => {
  const { callId } = req.body;
  const call = await Call.findById(callId);
  if (!call) throw new ApiError(404, 'Call not found');
  if (call.receiver.toString() !== req.userId) throw new ApiError(403, 'Not authorized');

  call.status = 'rejected';
  await call.save();
  winston.info(`Call ${callId} rejected by ${req.userId}`);

  return new ApiResponse(200, call, 'Call rejected successfully');
});

export const endCall = asyncHandler(async (req) => {
  const { callId } = req.body;
  const call = await Call.findById(callId);
  if (!call) throw new ApiError(404, 'Call not found');
  if (![call.caller.toString(), call.receiver.toString()].includes(req.userId)) {
    throw new ApiError(403, 'Not authorized');
  }

  call.status = 'ended';
  call.endTime = new Date();
  await call.save();
  winston.info(`Call ${callId} ended by ${req.userId}`);

  return new ApiResponse(200, call, 'Call ended successfully');
});

export const getCallHistory = asyncHandler(async (req) => {
  const calls = await Call.find({
    $or: [{ caller: req.userId }, { receiver: req.userId }],
  })
    .populate('caller', 'name')
    .populate('receiver', 'name')
    .sort({ startTime: -1 });
  return new ApiResponse(200, calls, 'Call history retrieved successfully');
});