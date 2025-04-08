import { mongoose } from '../lib.js';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8 },
  name: { type: String, required: true, trim: true },
  photoURL: String,
  bio: { type: String, maxlength: 100, trim: true },
  prompt: { type: String, required: true, maxlength: 50, trim: true },
  preferences: { type: String, enum: ['long-term', 'casual', 'intimacy'], default: 'casual' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true }, // [longitude, latitude]
  },
  age: { type: Number, required: true, min: 18 },
  gender: { type: String, enum: ['male', 'female', 'nonbinary'], required: true },
  interests: [{ type: String, trim: true }],
  ethnicity: { type: String },
  education: { type: String },
  smoking: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  swipesRight: { type: Number, default: 0 },
  swipesLeft: { type: Number, default: 0 },
  superLikesReceived: { type: Number, default: 0 },
  hiatus: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  maybeSwipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  skippedMatches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastActive: { type: Date, default: Date.now },
  tokenVersion: { type: Number, default: 0 },
  boostedUntil: { type: Date },
});

// Add 2dsphere index for geospatial queries
userSchema.index({ location: '2dsphere' });

export default mongoose.model('User', userSchema);