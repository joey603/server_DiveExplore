import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';


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

// Données de test pour les spots de plongée
const divingSpots = [
  { id: '1', name: 'Blue Hole', location: 'Belize', description: 'A famous diving spot with beautiful coral reefs and marine life.', images: [], fish: ['Clownfish', 'Lionfish', 'Turtles'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: 17.3151, longitude: -87.5355 },
  { id: '2', name: 'Great Barrier Reef', location: 'Australia', description: 'The largest coral reef system in the world, home to diverse marine life.', images: [], fish: ['Clownfish', 'Sharks', 'Rays'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: -18.2871, longitude: 147.6992 },
  { id: '3', name: 'Red Sea', location: 'Egypt', description: 'A popular diving destination with clear water and vibrant coral reefs.', images: [], fish: ['Butterflyfish', 'Angelfish', 'Moray Eels'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: 27.2167, longitude: 33.8333 },
  { id: '4', name: 'Ashdod', location: 'Israel', description: 'A beautiful coastal city with amazing diving spots.', images: [], fish: ['Sardines', 'Tuna', 'Mackerel'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: 31.8067, longitude: 34.6415 }
];

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

// Routes pour les spots de plongée
app.get('/dive-spots', (req, res) => {
  res.json(divingSpots);
});

app.get('/dive-spots/:id', (req, res) => {
  const spot = divingSpots.find(spot => spot.id === req.params.id);
  if (!spot) {
    return res.status(404).send('Dive spot not found');
  }
  res.json(spot);
});

app.post('/dive-spots/:id/like', (req, res) => {
  const spot = divingSpots.find(spot => spot.id === req.params.id);
  if (!spot) {
    return res.status(404).send('Dive spot not found');
  }
  const { username } = req.body;
  if (!spot.userLikes.includes(username)) {
    spot.likes += 1;
    spot.userLikes.push(username);
  }
  res.json(spot);
});

app.post('/dive-spots/:id/dislike', (req, res) => {
  const spot = divingSpots.find(spot => spot.id === req.params.id);
  if (!spot) {
    return res.status(404).send('Dive spot not found');
  }
  const { username } = req.body;
  if (!spot.userDislikes.includes(username)) {
    spot.dislikes += 1;
    spot.userDislikes.push(username);
  }
  res.json(spot);
});

app.post('/dive-spots/:id/fish', (req, res) => {
  const spot = divingSpots.find(spot => spot.id === req.params.id);
  if (!spot) {
    return res.status(404).send('Dive spot not found');
  }
  const { fishName } = req.body;
  spot.fish.push(fishName);
  res.json(spot.fish);
});

app.post('/dive-spots/:id/photo', upload.single('photo'), (req, res) => {
  const spot = divingSpots.find(spot => spot.id === req.params.id);
  if (!spot) {
    return res.status(404).send('Dive spot not found');
  }
  const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
  spot.images.push(imageUrl);
  res.json(imageUrl);
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
  
  app.get('/following/:username', (req, res) => {
    const { username } = req.params;
    // Fetch following users logic
  });
  
  app.get('/liked-posts/:username', (req, res) => {
    const { username } = req.params;
    // Fetch liked posts logic
  });
  
  app.get('/saved-posts/:username', (req, res) => {
    const { username } = req.params;
    // Fetch saved posts logic
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
  
  app.post('/unfollow', (req, res) => {
    const { currentUser, username } = req.body;
    // Unfollow user logic
  });
  

export default app;

