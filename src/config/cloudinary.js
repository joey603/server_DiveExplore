import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Vérification de la connexion à Cloudinary
cloudinary.api.ping()
  .then(response => {
    console.log('Cloudinary connection successful:', response);
  })
  .catch(error => {
    console.error('Error connecting to Cloudinary:', error.message);
  });

export default cloudinary;
