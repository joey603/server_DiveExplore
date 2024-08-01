import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import DiveSpootFile from './Get_Send_diving.js';


dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de la base de données MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// Schéma et modèle de Post
const postSchema = new mongoose.Schema({
  title: String,
  description: String,
  media: String,
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

// Schéma et modèle de User
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  following: [String]
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuration de Multer pour les téléchargements de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });


let users = [];

// Routes
app.get('/ping', (req, res) => {
  res.send('pong <team’s number>');
});

app.get('/about', (req, res) => {
  const dataPath = path.join(__dirname, '..', 'data', 'about.json');
  console.log(`Trying to read file at: ${dataPath}`);
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(`Error reading file: ${err.message}`);
      res.status(500).send('Error reading about content');
      return;
    }
    try {
      const parsedData = JSON.parse(data);
      res.json(parsedData);
    } catch (jsonError) {
      console.error(`Error parsing JSON: ${jsonError.message}`);
      res.status(500).send('Error parsing about content');
    }
  });
});

app.get('/', (req, res) => {
  res.redirect('/about');
});

app.post('/signup', async (req, res) => {
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


app.post('/signin', async (req, res) => {
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

// Routes pour les posts
app.get('/posts', async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    console.error('Error fetching posts:', err);
    res.status(500).json({ message: 'Error fetching posts' });
  }
});

app.post('/posts', upload.single('media'), async (req, res) => {
  const { title, description, username } = req.body;
  if (!username) {
    return res.status(400).send('Title and username are required');
  }

  try {
    const newPost = new Post({
      title,
      description: description || '',
      media: req.file ? `/uploads/${req.file.filename}` : null,
      username,
    });

    await newPost.save();
    res.json(newPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(500).json({ message: 'Error creating post' });
  }
});

app.post('/posts/:id/like', async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).send('Post not found');
  
      const { username } = req.body;
      if (!username) return res.status(400).send('Username is required');
  
      if (!post.likedBy.includes(username)) {
        post.likes += 1;
        post.likedBy.push(username);
        await post.save();
        res.json(post);
      } else {
        res.status(400).send('User has already liked this post');
      }
    } catch (err) {
      console.error('Error liking post:', err);
      res.status(500).json({ message: 'Error liking post' });
    }
  });

app.post('/posts/:id/comment', async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).send('Post not found');
  
      const { username, comment } = req.body;
      if (!username || !comment) return res.status(400).send('Username and comment are required');
  
      post.comments.push({ username, comment, date: new Date() });
      await post.save();
      res.json(post);
    } catch (err) {
      console.error('Error adding comment:', err);
      res.status(500).json({ message: 'Error adding comment' });
    }
  });

app.post('/posts/:postId/share', async (req, res) => {
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

// Save post
app.post('/posts/:postId/save', async (req, res) => {
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

// Use routes
app.use('/dive-spots', DiveSpootFile);


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Server-side routes (example)
app.put('/posts/:id', upload.single('media'), async (req, res) => {
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
        post.media = `/uploads/${req.file.filename}`;
      }
  
      await post.save();
      res.json(post);
    } catch (err) {
      console.error('Error updating post:', err);
      res.status(500).json({ message: 'Error updating post' });
    }
  });
  
app.get('/posts/:username', async (req, res) => {
    const { username } = req.params;
    try {
      const posts = await Post.find({ username }).sort({ createdAt: -1 });
      res.json(posts);
    } catch (err) {
      console.error('Error fetching posts by user:', err);
      res.status(500).json({ message: 'Error fetching posts by user' });
    }
  });
  //========================================================================================================
  // Route to follow a user
  app.post('/follow', async (req, res) => {
    const { currentUser, targetUser } = req.body;
    
    console.log('Follow Request:', { currentUser, targetUser }); // Log incoming request
  
    try {
      // Ensure both users exist
      const currentUserDoc = await User.findOne({ username: currentUser });
      const targetUserDoc = await User.findOne({ username: targetUser });
    
      if (!currentUserDoc || !targetUserDoc) {
        return res.status(404).send('User(s) not found');
      }
  
      console.log('Current User Document:', currentUserDoc); // Log current user document
      console.log('Target User Document:', targetUserDoc);   // Log target user document
    
      // Add targetUser to currentUser's following list if not already followed
      if (!currentUserDoc.following.includes(targetUser)) {
        currentUserDoc.following.push(targetUser);
        await currentUserDoc.save();
        console.log('Updated Current User Document:', currentUserDoc); // Log updated document
      }
    
      res.json({ message: `Now following ${targetUser}` });
    } catch (err) {
      console.error('Error following user:', err);
      res.status(500).json({ message: 'Error following user' });
    }
  });
  

  
  // Route to unfollow a user
  app.post('/unfollow', async (req, res) => {
    const { currentUser, targetUser } = req.body;
  
    try {
      // Ensure both users exist
      const currentUserDoc = await User.findOne({ username: currentUser });
      const targetUserDoc = await User.findOne({ username: targetUser });
  
      if (!currentUserDoc || !targetUserDoc) {
        return res.status(404).send('User(s) not found');
      }
  
      // Remove targetUser from currentUser's following list if followed
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

  app.post('/follow/:username', async (req, res) => {
    const { username } = req.params;
    const { currentUser } = req.body;
  
    try {
      const userToFollow = await User.findOne({ username });
      if (!userToFollow) return res.status(404).send('User not found');
  
      const currentUserDoc = await User.findOne({ username: currentUser });
      if (!currentUserDoc) return res.status(404).send('Current user not found');
  
      if (!currentUserDoc.following.includes(username)) {
        currentUserDoc.following.push(username);
        await currentUserDoc.save();
        res.json({ success: true, message: `Successfully followed ${username}` });
      } else {
        res.status(400).json({ success: false, message: 'User is already followed' });
      }
    } catch (err) {
      console.error('Error following user:', err);
      res.status(500).json({ success: false, message: 'Error following user' });
    }
  });
  
  app.get('/follow/:username', async (req, res) => {
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
  
  app.delete('/posts/:postId', async (req, res) => {
    const { postId } = req.params;
    try {
      await Post.findByIdAndDelete(postId);
      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Error deleting post' });
    }
  });
  
  

export default app;

