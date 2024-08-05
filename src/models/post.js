import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  title: String,
  description: String,
  mediaUrl: String,
  mediaPublicId: String,
  likes: { type: Number, default: 0 },
  likedBy: [String],
  comments: [{ username: String, comment: String, date: Date }],
  shares: { type: Number, default: 0 },
  sharedBy: [String],
  savedBy: [String],
  createdAt: { type: Date, default: Date.now },
  username: String,
});

const Post = mongoose.model('Post', postSchema);

export default Post;