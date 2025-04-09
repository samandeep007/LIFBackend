import { mongoose } from '../lib.js';

const likeSchema = new mongoose.Schema({
  liker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  likee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isSuperLike: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model('Like', likeSchema);