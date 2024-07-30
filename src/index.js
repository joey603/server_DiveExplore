import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors';
import connectDB from '../db.js';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '..', 'data', 'about.json');
const mongoDBConnectionString = process.env.MONGODB_URI;

mongoose.connect(mongoDBConnectionString)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Sample data
const divingSpots = [
  { id: '1', name: 'Blue Hole', location: 'Belize', description: 'A famous diving spot with beautiful coral reefs and marine life.', images: [], fish: ['Clownfish', 'Lionfish', 'Turtles'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: 17.3151, longitude: -87.5355 },
  { id: '2', name: 'Great Barrier Reef', location: 'Australia', description: 'The largest coral reef system in the world, home to diverse marine life.', images: [], fish: ['Clownfish', 'Sharks', 'Rays'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: -18.2871, longitude: 147.6992 },
  { id: '3', name: 'Red Sea', location: 'Egypt', description: 'A popular diving destination with clear water and vibrant coral reefs.', images: [], fish: ['Butterflyfish', 'Angelfish', 'Moray Eels'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: 27.2167, longitude: 33.8333 },
  { id: '4', name: 'Ashdod', location: 'Israel', description: 'A beautiful coastal city with amazing diving spots.', images: [], fish: ['Sardines', 'Tuna', 'Mackerel'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: 31.8067, longitude: 34.6415 }
];

let posts = [
  { id: 1, title: 'Great Dive at the Blue Hole', description: 'Had an amazing experience...', likes: 0, likedBy: [], comments: [], shares: 0, savedBy: [], createdAt: new Date(), media: null },
  { id: 2, title: 'Exploring the Great Barrier Reef', description: 'Saw so many wonderful...', likes: 0, likedBy: [], comments: [], shares: 0, savedBy: [], createdAt: new Date(), media: null }
];

let users = [];

// Routes
app.get('/ping', (req, res) => {
  res.send('pong <team’s number>');
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/about', (req, res) => {
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
  const newUser = { username, email, password };

  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const result = await usersCollection.insertOne(newUser);

    console.log('New user registered:', result.insertedId);
    res.status(201).json({ message: 'Signup successful', userId: result.insertedId });
  } catch (err) {
    console.error('Error registering user:', err);
    res.status(500).json({ message: 'Error registering user' });
  }
});

app.post('/signin', async (req, res) => {
  const { username, password } = req.body;

  try {
    const db = await connectDB();
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ username });

    if (user && user.password === password) {
      res.status(200).json({ message: 'Server : Sign-in successful' });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Error signing in user:', err);
    res.status(500).json({ message: 'Error signing in user' });
  }
});

// Dive spots routes
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
  const imageUrl = `/uploads/${req.file.filename}`;
  spot.images.push(imageUrl);
  res.json(imageUrl);
});

// Post routes
app.get('/posts', (req, res) => {
  res.json(posts);
});

app.post('/posts', upload.single('media'), (req, res) => {
  const { title, description, username } = req.body;
  if (!title || !description || !username) {
    return res.status(400).send('Title, description, and username are required');
  }

  const newPost = {
    id: posts.length + 1,
    title,
    description,
    media: req.file ? `/uploads/${req.file.filename}` : null,
    likes: 0,
    likedBy: [],
    comments: [],
    shares: 0,
    savedBy: [],
    createdAt: new Date()
  };

  posts.push(newPost);
  res.json(newPost);
});

app.post('/posts/:id/like', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (post) {
    const { username } = req.body;
    if (!username) {
      return res.status(400).send('Username is required');
    }
    if (!post.likedBy.includes(username)) {
      post.likes += 1;
      post.likedBy.push(username);
      res.json(post);
    } else {
      res.status(400).send('User has already liked this post');
    }
  } else {
    res.status(404).send('Post not found');
  }
});

app.post('/posts/:id/comment', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (post) {
    const { username, comment } = req.body;
    if (!username || !comment) {
      return res.status(400).send('Username and comment are required');
    }
    post.comments.push({ username, comment, date: new Date() });
    res.json(post);
  } else {
    res.status(404).send('Post not found');
  }
});

app.post('/users', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).send('Username is required');
  }

  users.push(username);
  const newUserPost = {
    id: posts.length + 1,
    title: username,
    description: 'Hey, I am a new user.',
    likes: 0,
    likedBy: [],
    comments: [],
    shares: 0,
    savedBy: [],
    createdAt: new Date(),
    media: null
  };
  posts.push(newUserPost);
  res.json(newUserPost);
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
