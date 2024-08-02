// divingSpotSchema.js
import mongoose from 'mongoose';

const divingSpotSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  name: { type: String, required: true },
  location: { type: String, required: true },
  description: { type: String },
  images: [{ url: String, public_id: String }],
  fish: [String],
  likes: { type: Number, default: 0 },
  likedBy: { type: [String], default: [] },
  dislikes: { type: Number, default: 0 },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  usersInterested: [String],
});

const DivingSpot = mongoose.model('DivingSpot', divingSpotSchema);
export default DivingSpot;
