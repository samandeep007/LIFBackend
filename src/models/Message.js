import { mongoose } from '../lib.js';

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  text: { type: String, default: '' }, // Allow empty text if image is present
  mediaURL: { type: String }, // New field for image URL
  timestamp: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  readAt: { type: Date }, // Explicitly include for status tracking
  isConfession: { type: Boolean, default: false },
});

export default mongoose.model('Message', messageSchema);