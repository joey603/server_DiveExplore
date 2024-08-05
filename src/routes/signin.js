import express from 'express';
import User from '../models/user.js';

const router = express.Router();

// Sign-in route
router.post('/', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });

    if (user && user.password === password) {
      res.status(200).json({ message: 'Sign-in successful' });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Error signing in user:', err);
    res.status(500).json({ message: 'Error signing in user' });
  }
});

export default router;
