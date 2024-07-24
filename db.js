import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function connectDB() {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    return client.db('DiveExplore'); // Replace with your database name
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

export default connectDB;
