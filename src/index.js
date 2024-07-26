import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cors from 'cors'; // Import the CORS middleware
import connectDB from '../db.js'; // Import the MongoDB connection function
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '..', 'data', 'about.json');

// Use the environment variable for MongoDB connection string
const mongoDBConnectionString = process.env.MONGODB_URI;

mongoose.connect(mongoDBConnectionString)
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.log(err));

// Use CORS middleware to allow requests from any origin
app.use(cors());

// Middleware to parse JSON request bodies
app.use(express.json());

// Set up multer for file uploads
const upload = multer({ dest: 'uploads/' });

const divingSpots = [
  { id: '1', name: 'Blue Hole', location: 'Belize', description: 'A famous diving spot with beautiful coral reefs and marine life.', images: [], fish: ['Clownfish', 'Lionfish', 'Turtles'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: 17.3151, longitude: -87.5355 },
  { id: '2', name: 'Great Barrier Reef', location: 'Australia', description: 'The largest coral reef system in the world, home to diverse marine life.', images: [], fish: ['Clownfish', 'Sharks', 'Rays'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: -18.2871, longitude: 147.6992 },
  { id: '3', name: 'Red Sea', location: 'Egypt', description: 'A popular diving destination with clear water and vibrant coral reefs.', images: [], fish: ['Butterflyfish', 'Angelfish', 'Moray Eels'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: 27.2167, longitude: 33.8333 },
  { id: '4', name: 'Ashdod', location: 'Israel', description: 'A beautiful coastal city with amazing diving spots.', images: [], fish: ['Sardines', 'Tuna', 'Mackerel'], likes: 0, dislikes: 0, userLikes: [], userDislikes: [], latitude: 31.8067, longitude: 34.6415 },
];

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

// Handle signup requests
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

// Handle sign-in requests
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
  const spot = divingSpots.find((spot) => spot.id === req.params.id);
  if (!spot) {
    return res.status(404).send('Dive spot not found');
  }
  res.json(spot);
});

app.post('/dive-spots/:id/like', (req, res) => {
  const spot = divingSpots.find((spot) => spot.id === req.params.id);
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
  const spot = divingSpots.find((spot) => spot.id === req.params.id);
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
  const spot = divingSpots.find((spot) => spot.id === req.params.id);
  if (!spot) {
    return res.status(404).send('Dive spot not found');
  }
  const { fishName } = req.body;
  spot.fish.push(fishName);
  res.json(spot.fish);
});

app.post('/dive-spots/:id/photo', upload.single('photo'), (req, res) => {
  const spot = divingSpots.find((spot) => spot.id === req.params.id);
  if (!spot) {
    return res.status(404).send('Dive spot not found');
  }
  const imageUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
  spot.images.push(imageUrl);
  res.json(imageUrl);
});

app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app; // Export the app instance