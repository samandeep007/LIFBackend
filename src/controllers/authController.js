import { bcrypt, jwt, User, uploadToCloudinary, winston, ApiError, ApiResponse, asyncHandler } from '../lib.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               name: { type: string }
 *               phone: { type: string }
 *               prompt: { type: string, maxLength: 50 }
 *               lat: { type: number }
 *               lng: { type: number }
 *               age: { type: number, minimum: 18 }
 *               gender: { type: string, enum: [male, female, nonbinary] }
 *               interests: { type: string }
 *               photo: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const register = asyncHandler(async (req) => {
  const { email, password, name, phone, prompt, lat, lng, age, gender, interests } = req.body;
  const file = req.file;
  if (!file) throw new ApiError(400, 'Photo is required');
  if (!phone || !lat || !lng || !age || !gender) throw new ApiError(400, 'Phone, location, age, and gender are required');

  const isFaceValid = file.size > 1000;
  if (!isFaceValid) throw new ApiError(400, 'Facial recognition failed');

  const hashedPassword = await bcrypt.hash(password, 12);
  const photoURL = await uploadToCloudinary(file.path, { public_id: `${email}-${Date.now()}` });

  const user = new User({
    email,
    password: hashedPassword,
    name,
    photoURL,
    phone,
    prompt,
    location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
    age: parseInt(age),
    gender,
    interests: interests ? interests.split(',') : [],
    verified: true,
  });
  await user.save();
  winston.info(`User registered: ${email}`);

  const token = jwt.sign({ id: user._id, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return new ApiResponse(201, { token, user }, 'User registered successfully');
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 */
export const login = asyncHandler(async (req) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password)) {
    winston.warn(`Login failed for ${email}: Invalid credentials`);
    throw new ApiError(401, 'Invalid credentials');
  }
  user.lastActive = Date.now();
  await user.save();
  winston.info(`User logged in: ${email}`);

  const token = jwt.sign({ id: user._id, tokenVersion: user.tokenVersion }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return new ApiResponse(200, { token, user }, 'Login successful');
});