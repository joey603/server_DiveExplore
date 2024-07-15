const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Ping endpoint
app.get('/ping', (req, res) => {
  res.send('pong <team’s number>');
});

// About endpoint
app.get('/about', (req, res) => {
  res.send('This is the about page content.');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
