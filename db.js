// // server/src/db.js
// import { MongoClient } from 'mongodb';
// import dotenv from 'dotenv';

// dotenv.config();

// const uri = process.env.MONGODB_URI; // Make sure you have this in your .env file
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// async function connectDB() {
//   try {
//     await client.connect();
//     console.log('Connected to MongoDB Atlas');
//     return client.db('Cluster0'); // Replace with your database name
//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// }

// export default connectDB;
// server/src/db.js
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
