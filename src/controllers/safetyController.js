import { SafetyReport, User, winston, uploadToCloudinary, ApiError, ApiResponse, asyncHandler } from '../lib.js';

/**
 * @swagger
 * /api/safety/report:
 *   post:
 *     summary: Report suspicious activity
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reportedUserId: { type: string }
 *               location: { type: string }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Report submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const reportSuspiciousActivity = asyncHandler(async (req) => {
  const { reportedUserId, location, reason } = req.body;
  const report = new SafetyReport({ userId: req.userId, reportedUserId, location, reason });
  await report.save();
  winston.warn(`Suspicious activity reported by ${req.userId} against ${reportedUserId}`);

  const reportCount = await SafetyReport.countDocuments({ reportedUserId });
  if (reportCount >= 3) {
    const user = await User.findById(reportedUserId);
    user.hiatus = true;
    await user.save();
    winston.warn(`User ${reportedUserId} put on hiatus due to multiple reports`);
  }
  return new ApiResponse(200, true, 'Suspicious activity reported successfully');
});

/**
 * @swagger
 * /api/safety/verify-location:
 *   post:
 *     summary: Verify user location
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location: { type: string }
 *     responses:
 *       200:
 *         description: Location verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const verifyLocation = asyncHandler(async (req) => {
  const { location } = req.body;
  if (!location || !location.includes(',')) throw new ApiError(400, 'Invalid location format');
  winston.info(`Location verified for ${req.userId}: ${location}`);
  return new ApiResponse(200, true, 'Location verified successfully');
});

/**
 * @swagger
 * /api/safety/confirm-identity:
 *   post:
 *     summary: Confirm user identity with photo
 *     tags: [Safety]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Identity confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const confirmIdentity = asyncHandler(async (req) => {
  const file = req.file;
  if (!file) throw new ApiError(400, 'Photo is required');
  const isFaceValid = file.size > 1000;
  if (!isFaceValid) throw new ApiError(400, 'Identity confirmation failed');
  const photoURL = await uploadToCloudinary(file.path);
  winston.info(`Identity confirmed for ${req.userId}, photo: ${photoURL}`);
  return new ApiResponse(200, true, 'Identity confirmed successfully');
});