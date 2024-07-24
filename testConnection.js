// testConnection.js
// import { MongoClient } from 'mongodb';
// import dotenv from 'dotenv';

// dotenv.config();

// const uri = process.env.MONGODB_URI;

// async function testConnection() {
//   const client = new MongoClient(uri);

//   try {
//     await client.connect();
//     console.log('Connected successfully to MongoDB Atlas');
//   } catch (error) {
//     console.error('Failed to connect to MongoDB Atlas:', error);
//   } finally {
//     await client.close();
//   }
// }

// testConnection();
import mongoose from 'mongoose';

const dbUrl = 'mongodb+srv://yoanha:1ndviMii9reQBkqX@cluster0.omfxmcn.mongodb.net/';

mongoose.connect(dbUrl)
    .then(() => {
        console.info("Connected to the DB");
    })
    .catch((e) => {
        console.log("Error: ", e);
    });
