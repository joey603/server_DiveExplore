const router = express.Router();
import express from 'express';
import mongoose from 'mongoose';
import divingSpotSchema from './divingSpotSchema.js';
import multer from 'multer';
import path from 'path';



router.post('/add_dive_spot', async (req, res) => {
    const { number, name, location, description, fish, dislikes, latitude, longitude } = req.body;
    console.log('Received data:', req.body); // Add a log to see the received data

    if (!number || !name || !location || !description || !fish || !latitude || !longitude) {
        console.log('sent 400 request');
        return res.status(400).json({ message: 'All fields are required' });
    }
    
    try {

            // Check if a dive spot with the same number already exists
            const existingSpot = await divingSpotSchema.findOne({ number });
    
            if (existingSpot) {
                // If the spot already exists, return a message indicating so
                console.log('Dive spot with this number already exists');
                return res.status(400).json({ message: 'Dive spot with this number already exists' });
            }
       
        // Create a new dive spot
        const newSpot = new divingSpotSchema({
            number,
            name,
            location,
            description,
            fish,
            dislikes,
            latitude,
            longitude
        });

        const result = await newSpot.save(); // Save the new dive spot

        console.log('New Dive Spot:', result._id);
        res.status(201).json({ message: 'New dive spot successful', postId: result._id });

    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ message: 'Error creating post' });
    }
});

//return arr divespoot
router.get('/get_dive_spots', async (req, res) => {
    try {
        console.log('get dive spots arr');
        const spots = await divingSpotSchema.find({}); // get the arr divespoot 
        res.status(200).json(spots);
    } catch (err) {
        console.error('Error retrieving dive spots:', err);
        res.status(500).json({ message: 'Error retrieving dive spots' });
    }
});

//return detail for id divespoot
router.get('/:id', async (req, res) => { 
        try
        {   
         const id = req.params.id;
         console.log('get id', id );
         // חפש את המקום צלילה על פי ה-ID
         const spot = await divingSpotSchema.findById(id);
     
        if (!spot)
          {
            return res.status(404).send('Dive spot not found');
          }
           res.status(200).json(spot);
          } 
            catch (error)
            {
                console.error('Error fetching dive spot:', error);
                res.status(500).send('Server error');
            }
});

router.post('/:id/fish', async (req, res) => {
    const { id } = req.params; // מקבל את ה-ID מה-URL
    const { fishName } = req.body; // מקבל את שם הדג מה-body של הבקשה
    console.log('add fish',req.body);
    console.log(fishName);
    console.log(id);

    if (!fishName) {
        return res.status(400).json({ message: 'Fish name is required' });
    }

    try {
        //loking for id fish
        const spot = await divingSpotSchema.findById(id);

        if (!spot) {
            return res.status(404).json({ message: 'Dive spot not found' });
        }

        //  update spot
        spot.fish.push(fishName);
        const updatedSpot = await spot.save();

        // return fish
        res.status(200).json(updatedSpot.fish);
    } catch (err) {
        console.error('Error adding fish:', err);
        res.status(500).json({ message: 'Error adding fish' });
    }
});

    
// set Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // נתיב לשמירת הקבצים
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // שמירת הקובץ עם תוספת של timestamp כדי למנוע התנגשויות
  }
});
const upload = multer({ storage });
router.post('/:id/photo', upload.single('photo'), async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;
      console.log('get picther',req.file);
      
      if (!file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      // יצירת כתובת URL לתמונה
      const imageUrl = `http://localhost:3001/uploads/${file.filename}`;
      
      // עדכון המסד נתונים עם כתובת התמונה
      const updatedSpot = await divingSpotSchema.findByIdAndUpdate(
        id,
        { $push: { images: imageUrl } },
        { new: true }
      );
      
      if (!updatedSpot) {
        return res.status(404).json({ message: 'Dive spot not found' });
      }
      
      res.status(200).json(imageUrl);
    } catch (err) {
      console.error('Error adding photo:', err);
      res.status(500).json({ message: 'Error adding photo' });
    }
  });



//add like to dive spot
router.post('/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        console.log('get like');
        const updatedSpot = await divingSpotSchema.findOneAndUpdate(
            { _id: id },
            { $inc: { likes: 1 } }, // Increment the likes field by 1
            { new: true } // Return the updated document
        );

        if (!updatedSpot) {
            return res.status(404).json({ message: 'Dive spot not found' });
        }

        res.status(200).json(updatedSpot);
    } catch (err) {
        console.error('Error adding like:', err);
        res.status(500).json({ message: 'Error adding like' });
    }
});





router.post('/:id/interest', async (req, res) => {
    const { id } = req.params; // Dive spot ID
    const { userName } = req.body; // User name
    console.log('Registering interest for user:', userName);
  
    try {
      // Find and update the dive spot, adding the userName if it's not already in the array
      const updatedSpot = await divingSpotSchema.findOneAndUpdate(
        { _id: id, usersInterested: { $ne: userName } }, // Ensure userName is not already in the array
        { $push: { usersInterested: userName } }, // Add userName to the array
        { new: true } // Return the updated document
      );
  
      if (!updatedSpot) {
        return res.status(404).send('Dive spot not found or user already interested');
      }
  
      res.status(200).json(updatedSpot);
    } catch (error) {
      console.error('Error registering interest:', error);
      res.status(500).send('Server error');
    }
  });
  


  router.get('/:id/list_interest', async (req, res) => {
    const { id } = req.params; // Dive spot ID
  
    try {
        console.log('list_interst');
      const spot = await divingSpotSchema.findById(id);
  
      if (!spot) {
        return res.status(404).send('Dive spot not found');
      }

      res.status(200).json(spot.usersInterested);
    } catch (error) {
      console.error('Error fetching interested users:', error);
      res.status(500).send('Server error');
    }
  });
    
export default router;
