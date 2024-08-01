import mongoose from 'mongoose';

const divingSpotSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  images: [String], // Array of image URLs or paths
  fish: [String], // Array of fish names
  likes: {
    type: Number,
    default: 0
  },
  dislikes: {
    type: Number,
    default: 0
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  usersInterested: [String],
});

// Create a model using the schema

const DivingSpot = mongoose.model('DivingSpot', divingSpotSchema);
console.log('dive model created successfully');

// Use ES Modules syntax to export the model
export default DivingSpot;
