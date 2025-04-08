import { mongoose } from '../lib.js';

const callSchema = new mongoose.Schema({
  caller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['initiated', 'accepted', 'rejected', 'ended'], default: 'initiated' },
  type: { type: String, enum: ['audio', 'video'], required: true },
  startTime: { type: Date },
  endTime: { type: Date },
});

export default mongoose.model('Call', callSchema);