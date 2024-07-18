const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = process.env.PORT || 3000;

// Ping endpoint
app.get('/ping', (req, res) => {
  res.send('pong <team’s number>');
});

app.use(express.static(path.join(__dirname, 'public')));

// About endpoint
app.get('/about', (req, res) => {
  fs.readFile(path.join(__dirname, 'data', 'about.json'), 'utf8', (err, data) => {
    if (err) {
      res.status(500).send('Error reading about content');
      return;
    }
    res.json(JSON.parse(data));
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
