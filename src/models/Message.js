import { mongoose } from '../lib.js';

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    isConfession: { type: Boolean, default: false },
});

export default mongoose.model('Message', messageSchema);