import { Call, pubsub, User, winston, ApiError, ApiResponse, asyncHandler, jwt, bcrypt } from '../lib.js';
import { uploadToCloudinary } from '../utils/cloudinary.js';
import { sendEmail } from '../utils/email.js';
import crypto from 'crypto';

export const register = asyncHandler(async (req) => {
  const { email, password, name, phone, prompt, lat, lng, age, gender, interests } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ApiError(400, 'User already exists');

  const file = req.file;
  let photoURL;
  if (file) photoURL = await uploadToCloudinary(file.path);

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = new User({
    email,
    password: hashedPassword,
    name,
    phone,
    prompt,
    location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
    age: parseInt(age),
    gender,
    interests: interests ? interests.split(',') : [],
    photoURL,
    emailVerificationToken: crypto.randomBytes(32).toString('hex'),
    emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000,
  });

  await user.save();
  winston.info(`User registered: ${email}`);

  const verificationUrl = `${req.protocol}://${req.get('host')}/api/auth/verify-email?token=${user.emailVerificationToken}`;
  await sendEmail(
    email,
    'Verify Your Email - L.I.F',
    `Please verify your email by clicking this link: ${verificationUrl}`,
    `<p>Please verify your email by clicking <a href="${verificationUrl}">here</a>.</p>`
  );

  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return new ApiResponse(201, { token, user }, 'User registered successfully. Please verify your email.');
});

export const login = asyncHandler(async (req) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, 'Invalid credentials');
  if (!user.verified) throw new ApiError(403, 'Email not verified');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, 'Invalid credentials');

  user.lastActive = new Date();
  await user.save();
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  winston.info(`User logged in: ${email}`);
  return new ApiResponse(200, { token, user }, 'Login successful');
});

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify user email
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const verifyEmail = asyncHandler(async (req) => {
  const { token } = req.query;
  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, 'Invalid or expired verification token');

  user.verified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();
  winston.info(`Email verified for user: ${user.email}`);
  return new ApiResponse(200, null, 'Email verified successfully');
});

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const forgotPassword = asyncHandler(async (req) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, 'User not found');

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  await user.save();

  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password?token=${resetToken}`;
  await sendEmail(
    email,
    'Reset Your Password - L.I.F',
    `Reset your password by clicking this link: ${resetUrl}`,
    `<p>Reset your password by clicking <a href="${resetUrl}">here</a>. This link expires in 1 hour.</p>`
  );

  winston.info(`Password reset requested for: ${email}`);
  return new ApiResponse(200, null, 'Password reset email sent');
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset user password
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const resetPassword = asyncHandler(async (req) => {
  const { token } = req.query;
  const { password } = req.body;

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, 'Invalid or expired reset token');

  user.password = await bcrypt.hash(password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.tokenVersion += 1;
  await user.save();

  winston.info(`Password reset for user: ${user.email}`);
  return new ApiResponse(200, null, 'Password reset successfully');
});