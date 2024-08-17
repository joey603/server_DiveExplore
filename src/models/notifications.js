import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  actionUsername: String,  // User who performed the action (like/comment/follow)
  postOwner: String,       // User who owns the post and is receiving the notification
  typeOf: String,          // Type of notification (e.g., Like, Comment, Follow)
  date: { type: Date, default: Date.now }, // When the notification was created
  idPost: { type: mongoose.Schema.Types.ObjectId, default: null } // ID of the post (or null if it's a follow)
});

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;