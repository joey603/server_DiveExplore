import express from 'express';
import Post from '../models/post.js';
import Notification from '../models/notifications.js';
import User from '../models/user.js';
import upload from '../middlewares/multer.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// Get all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

// Create a new post
router.post('/', upload.single('media'), async (req, res) => {
  const { title, description, username } = req.body;
  if (!username || !title) {
    return res.status(400).send('Title and username are required');
  }

  try {
    const newPostData = {
      title,
      description: description || '',
      username,
    };

    if (req.file) {
      newPostData.mediaUrl = req.file.path;
      newPostData.mediaPublicId = req.file.filename.split('/').pop();
    }

    const newPost = new Post(newPostData);
    await newPost.save();
    res.status(201).json(newPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
  }
});

// Like a post
router.post('/:id/like', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    const { username } = req.body;
    if (!username) return res.status(400).send('Username is required');

    if (!post.likedBy.includes(username)) {
      post.likes += 1;
      post.likedBy.push(username);
      await post.save();

      // Create a new notification
      const notification = new Notification({
        actionUsername: username,  // User who liked the post
        postOwner: post.username,  // User who owns the post
        typeOf: 'Like',           // Type of notification
        date: new Date(),         // Date of the notification
        idPost: post._id          // ID of the post
      });

      await notification.save();

      res.json(post);
    } else {
      res.status(400).send('User has already liked this post');
    }
  } catch (err) {
    console.error('Error liking post:', err);
    res.status(500).json({ message: 'Error liking post' });
  }
});

router.get('/:postId/likes', async (req, res) => {
  const { postId } = req.params;

  try {
    const post = await Post.findById(postId).populate('likedBy', 'username'); // Adjust based on your schema
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post.likedBy);
  } catch (error) {
    console.error('Error fetching likes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Route to get the list of users who liked a post
router.get('/:postId/likers', async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).send('Post not found');
    res.json(post.likedBy);
  } catch (error) {
    console.error('Error fetching likers:', error);
    res.status(500).send('Server error');
  }
});


// Comment on a post
router.post('/:id/comment', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).send('Post not found');

    const { username, comment } = req.body;
    if (!username || !comment) return res.status(400).send('Username and comment are required');

    // Add the comment to the post
    post.comments.push({ username, comment, date: new Date() });
    await post.save();

    // Create a new notification
    const notification = new Notification({
      actionUsername: username,  // User who made the comment
      postOwner: post.username,  // User who owns the post
      typeOf: 'Comment',        // Type of notification
      date: new Date(),         // Date of the notification
      idPost: post._id          // ID of the post
    });

    await notification.save();

    res.json(post);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Error adding comment' });
  }
});

// Share a post
router.post('/:postId/share', async (req, res) => {
  try {
    const { postId } = req.params;
    const { username } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).send('Post not found');

    if (!post.sharedBy.includes(username)) {
      post.shares += 1;
      post.sharedBy.push(username);
      await post.save();
    }

    res.json(post);
  } catch (error) {
    res.status(500).send('Error sharing post');
  }
});

// Save a post
router.post('/:postId/save', async (req, res) => {
  try {
    const { postId } = req.params;
    const { username } = req.body;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).send('Post not found');

    if (!post.savedBy.includes(username)) {
      post.savedBy.push(username);
      await post.save();
    }

    res.json(post);
  } catch (error) {
    res.status(500).send('Error saving post');
  }
});

// Update a post
router.put('/:id', upload.single('media'), async (req, res) => {
  const { title, description, username } = req.body;
  const postId = req.params.id;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.title = title || post.title;
    post.description = description || post.description;
    post.username = username || post.username;

    if (req.file) {
      if (post.mediaPublicId) {
        await cloudinary.uploader.destroy(post.mediaPublicId);
      }
      post.mediaUrl = req.file.path;
      post.mediaPublicId = req.file.filename.split('/').pop();
    }

    await post.save();
    res.json(post);
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ message: 'Error updating post' });
  }
});

// Get posts by a specific user
router.get('/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const posts = await Post.find({ username }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts by user:', err);
    res.status(500).json({ message: 'Error fetching posts by user' });
  }
});

// Delete a post
router.delete('/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);
    if (!post) return res.status(404).send('Post not found');

    if (post.mediaPublicId) {
      await cloudinary.uploader.destroy(post.mediaPublicId);
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Error deleting post' });
  }
});

router.get('/:postId', async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
