import express from 'express';
import User from '../models/user.js';
import Post from '../models/post.js';

const router = express.Router();

// Sign-up route
router.post('/', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Check if username or email already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      // If either username or email is already in use, return an error
      return res.status(400).json({
        message: existingUser.username === username ? 'Username already exists' : 'Email already exists',
      });
    }

    // Create a new user
    const newUser = new User({ username, email, password });
    const savedUser = await newUser.save();
    console.log('New user registered:', savedUser._id);

    // Create a welcome post for the new user
    const newPost = new Post({
      title: 'Welcome Post',
      description: 'Hey, I am a new user.',
      username: savedUser.username,
    });

    await newPost.save();

    res.status(201).json({ message: 'Signup successful', userId: savedUser._id });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

export default router;
