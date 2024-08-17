import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from './config/mongoose.js';
import cloudinary from './config/cloudinary.js';
import upload from './middlewares/multer.js';
import aboutRoutes from './routes/about.js';
import signupRoutes from './routes/signup.js';
import signinRoutes from './routes/signin.js';
import postRoutes from './routes/posts.js';
import followRoutes from './routes/follow.js';
import diveSpotsRoutes from './routes/dive-spots.js';
import settingsRoutes from './routes/settings.js';
import notificationRoutes from './routes/notifications.js';

dotenv.config(); // Load environment variables

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', aboutRoutes);   // General routes
app.use('/signup', signupRoutes); // Sign-up routes
app.use('/signin', signinRoutes); // Sign-in routes
app.use('/posts', postRoutes); // Post routes
app.use('/', followRoutes);  // Follow/Unfollow routes
app.use('/dive-spots', diveSpotsRoutes);
app.use('/settings', settingsRoutes);  // Settings routes
app.use('/notifications', notificationRoutes);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
