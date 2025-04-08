import { mongoose } from '../lib.js';

const confessionSchema = new mongoose.Schema({
    text: String,
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('Confession', confessionSchema);