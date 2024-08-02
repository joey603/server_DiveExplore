import express from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import divingSpotSchema from './divingSpotSchema.js';
import DivingSpot from './divingSpotSchema.js'; // Assurez-vous que le chemin est correct

const router = express.Router();

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configuration de Multer pour utiliser Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'dive-spots', // Nom du dossier sur Cloudinary
    allowed_formats: ['jpg', 'png'], // Formats autorisés
  },
});

const upload = multer({ storage });

// Ajouter un spot de plongée
router.post('/add_dive_spot', async (req, res) => {
  const { number, name, location, description, fish, dislikes, latitude, longitude } = req.body;

  if (!number || !name || !location || !description || !fish || !latitude || !longitude) {
    return res.status(400).json({ message: 'Tous les champs sont obligatoires' });
  }

  try {
    // Vérifier si un spot avec le même numéro existe déjà
    const existingSpot = await divingSpotSchema.findOne({ number });

    if (existingSpot) {
      return res.status(400).json({ message: 'Un spot de plongée avec ce numéro existe déjà' });
    }

    // Créer un nouveau spot de plongée
    const newSpot = new divingSpotSchema({
      number,
      name,
      location,
      description,
      fish,
      dislikes,
      latitude,
      longitude,
    });

    const result = await newSpot.save(); // Sauvegarder le nouveau spot
    res.status(201).json({ message: 'Nouveau spot de plongée ajouté avec succès', postId: result._id });

  } catch (err) {
    console.error('Erreur lors de la création du spot de plongée:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer tous les spots de plongée
router.get('/get_dive_spots', async (req, res) => {
  try {
    const spots = await divingSpotSchema.find({});
    res.status(200).json(spots);
  } catch (err) {
    console.error('Erreur lors de la récupération des spots de plongée:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Récupérer les détails d'un spot de plongée par ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const spot = await divingSpotSchema.findById(id);
    if (!spot) {
      return res.status(404).json({ message: 'Spot de plongée non trouvé' });
    }
    res.status(200).json(spot);
  } catch (err) {
    console.error('Erreur lors de la récupération du spot de plongée:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter un poisson à un spot de plongée
router.post('/:id/fish', async (req, res) => {
  const { id } = req.params;
  const { fishName } = req.body;

  if (!fishName) {
    return res.status(400).json({ message: 'Le nom du poisson est obligatoire' });
  }

  try {
    const spot = await divingSpotSchema.findById(id);
    if (!spot) {
      return res.status(404).json({ message: 'Spot de plongée non trouvé' });
    }

    spot.fish.push(fishName);
    const updatedSpot = await spot.save();
    res.status(200).json(updatedSpot.fish);
  } catch (err) {
    console.error('Erreur lors de l\'ajout du poisson:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter une photo à un spot de plongée
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier téléchargé' });
    }

    const { path: imageUrl, filename: publicId } = req.file;

    const updatedSpot = await divingSpotSchema.findByIdAndUpdate(
      id,
      { $push: { images: { url: imageUrl, public_id: publicId } } },
      { new: true }
    );

    if (!updatedSpot) {
      return res.status(404).json({ message: 'Spot de plongée non trouvé' });
    }

    res.status(200).json(updatedSpot);
  } catch (err) {
    console.error('Erreur lors de l\'ajout de la photo:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter un like à un spot de plongée
router.post('/:id/like', async (req, res) => {
  try {
    const { id } = req.params;
    const { userName } = req.body;

    // Vérifier si le spot existe
    const spot = await DivingSpot.findById(id);
    if (!spot) {
      return res.status(404).json({ message: 'Spot de plongée non trouvé' });
    }

    // Vérifier si l'utilisateur a déjà liké
    if (spot.likedBy.includes(userName)) {
      return res.status(400).json({ message: 'Vous avez déjà aimé ce spot' });
    }

    // Ajouter le like et l'utilisateur à likedBy
    spot.likes += 1;
    spot.likedBy.push(userName);
    await spot.save();

    res.status(200).json(spot);
  } catch (err) {
    console.error('Erreur lors de l\'ajout du like:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Enregistrer l'intérêt d'un utilisateur pour un spot de plongée
router.post('/:id/interest', async (req, res) => {
  const { id } = req.params;
  const { userName } = req.body;

  try {
    const updatedSpot = await divingSpotSchema.findOneAndUpdate(
      { _id: id, usersInterested: { $ne: userName } },
      { $push: { usersInterested: userName } },
      { new: true }
    );

    if (!updatedSpot) {
      return res.status(404).send('Spot de plongée non trouvé ou utilisateur déjà intéressé');
    }

    res.status(200).json(updatedSpot);
  } catch (error) {
    console.error('Erreur lors de l\'enregistrement de l\'intérêt:', error);
    res.status(500).send('Erreur serveur');
  }
});

// Récupérer la liste des utilisateurs intéressés par un spot de plongée
router.get('/:id/list_interest', async (req, res) => {
  const { id } = req.params;

  try {
    const spot = await divingSpotSchema.findById(id);
    if (!spot) {
      return res.status(404).send('Spot de plongée non trouvé');
    }

    res.status(200).json(spot.usersInterested);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs intéressés:', error);
    res.status(500).send('Erreur serveur');
  }
});

export default router;
