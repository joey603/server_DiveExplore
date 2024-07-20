import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Adjust path to go from serverDiveExplore to Client_DiveExplore-cdd2/data/about.json
const dataPath = path.join(__dirname, '../..', 'Client_DiveExplore-cdd2', 'data', 'about.json');
//const dataPath = path.join(__dirname, '..', 'data', 'about.json');

app.get('/ping', (req, res) => {
    res.send('pong <team’s number>');
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/about', (req, res) => {
    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            res.status(500).send('Error reading about content');
            return;
        }
        res.json(JSON.parse(data));
    });
});

app.get('/', (req, res) => {
    res.redirect('/about');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

export default app; // Export the app instance
