import { mongoose } from '../lib.js';

const safetyReportSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    location: { type: String },
    reason: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
});

export default mongoose.model('SafetyReport', safetyReportSchema);