import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Ping route
router.get('/ping', (req, res) => {
  res.send('pong <team’s number>');
});

// About route
router.get('/about', (req, res) => {
  const filePath = path.join(__dirname, '../../data', 'about.json');
  
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading the about.json file:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    
    try {
      const jsonData = JSON.parse(data);
      res.json(jsonData);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
});

// Redirect root to /about
router.get('/', (req, res) => {
  res.redirect('/about');
});

export default router;
