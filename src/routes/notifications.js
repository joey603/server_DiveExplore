import express from 'express';
import Notification from '../models/notifications.js';
import Post from '../models/post.js';

const router = express.Router();

// Get notifications for a user
// router.get('/:username', async (req, res) => {
//   const { username } = req.params;

//   try {
//     // Fetch notifications for the user
//     const notifications = await Notification.find({ postOwner: username }).sort({ date: -1 }).exec();

//     // Fetch related posts
//     const postIds = notifications
//       .filter(notification => notification.idPost)  // Only include notifications with associated posts
//       .map(notification => notification.idPost);

//     const posts = await Post.find({ _id: { $in: postIds } }).exec();
//     const postsMap = new Map(posts.map(post => [post._id.toString(), post]));

//     // Attach post details to notifications
//     const notificationsWithPosts = notifications.map(notification => ({
//       ...notification.toObject(),
//       post: notification.idPost ? postsMap.get(notification.idPost.toString()) : null
//     }));

//     res.json(notificationsWithPosts);
//   } catch (err) {
//     console.error('Error fetching notifications:', err);
//     res.status(500).json({ message: 'Error fetching notifications' });
//   }
// });
router.get('/:username', async (req, res) => {
    const { username } = req.params;
  
    try {
      // Fetch notifications for the user
      const notifications = await Notification.find({ postOwner: username }).sort({ date: -1 }).exec();
  
      // Fetch related posts
      const postIds = notifications
        .filter(notification => notification.idPost)  // Only include notifications with associated posts
        .map(notification => notification.idPost);
  
      const posts = await Post.find({ _id: { $in: postIds } }).exec();
      const postsMap = new Map(posts.map(post => [post._id.toString(), post]));
  
      // Attach post details to notifications
      const notificationsWithPosts = notifications.map(notification => ({
        ...notification.toObject(),
        post: notification.idPost ? postsMap.get(notification.idPost.toString()) : null
      }));
  
      res.json(notificationsWithPosts);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      res.status(500).json({ message: 'Error fetching notifications' });
    }
  });

// Get all notifications (optional, if needed for other purposes)
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find().populate('idPost'); // Populate post details if needed
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Failed to load notifications' });
  }
});

export default router;