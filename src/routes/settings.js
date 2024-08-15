import express from 'express';
import User from '../models/user.js';

const router = express.Router();

// Change Password
router.put('/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    // Find the user
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if current password matches
    if (user.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update to the new password (stored in plain text)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Account
router.delete('/delete-account', async (req, res) => {
  try {
    const { username } = req.body;

    // Find and delete the user
    await User.findOneAndDelete({ username });

    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
