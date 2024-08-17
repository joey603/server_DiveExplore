import express from 'express';
import User from '../models/user.js';
import Notification from '../models/notifications.js';

const router = express.Router();

// Follow a user
router.post('/follow', async (req, res) => {
  const { currentUser, targetUser } = req.body;

  try {
    const currentUserDoc = await User.findOne({ username: currentUser });
    const targetUserDoc = await User.findOne({ username: targetUser });

    if (!currentUserDoc || !targetUserDoc) {
      return res.status(404).send('User(s) not found');
    }

    if (!currentUserDoc.following.includes(targetUser)) {
      currentUserDoc.following.push(targetUser);
      await currentUserDoc.save();
    }

    // Create a new notification for the target user
    const notification = new Notification({
      actionUsername: currentUser,   // User who is following
      postOwner: targetUser,         // User being followed
      typeOf: 'Follow',             // Type of notification
      date: new Date(),             // Date of the notification
      idPost: null                  // No post associated with a follow
    });

    await notification.save();

    res.json({ message: `Now following ${targetUser}` });
  } catch (err) {
    console.error('Error following user:', err);
    res.status(500).json({ message: 'Error following user' });
  }
});

// Unfollow a user
router.post('/unfollow', async (req, res) => {
  const { currentUser, targetUser } = req.body;

  try {
    const currentUserDoc = await User.findOne({ username: currentUser });
    const targetUserDoc = await User.findOne({ username: targetUser });

    if (!currentUserDoc || !targetUserDoc) {
      return res.status(404).send('User(s) not found');
    }

    const index = currentUserDoc.following.indexOf(targetUser);
    if (index > -1) {
      currentUserDoc.following.splice(index, 1);
      await currentUserDoc.save();
    }

    res.json({ message: `Unfollowed ${targetUser}` });
  } catch (err) {
    console.error('Error unfollowing user:', err);
    res.status(500).json({ message: 'Error unfollowing user' });
  }
});

// Get following list
router.get('/follow/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send('User not found');

    res.json(user.following);
  } catch (err) {
    console.error('Error fetching following list:', err);
    res.status(500).json({ message: 'Error fetching following list' });
  }
});

export default router;
