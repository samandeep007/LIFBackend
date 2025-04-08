import { mongoose } from '../lib.js';

const matchSchema = new mongoose.Schema({
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Match', matchSchema);