const express = require('express');
const axios = require('axios');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Set up middleware to serve static files
app.use(express.static('public'));

// Custom middleware to set the correct MIME type for CSS files
app.use((req, res, next) => {
  const ext = path.extname(req.url);
  if (ext === '.css') {
    res.setHeader('Content-Type', 'text/css');
  }
  next();
});

// Route for the home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

// Page
app.get('/basketball', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/basketball/index.html'));
});

// Page
app.get('/baseball', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/baseball/index.html'));
});

// Page
app.get('/football', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/football/index.html'));
});

// Page
app.get('/soccer', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/soccer/index.html'));
});

// Fetch live basketball scores
async function fetchbasketballScores() {
  try {
    const response = await axios.get('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard');
    const basketballScores = response.data.events;

    const livebasketballScores = basketballScores.filter(game => game.status.type.state === 'in');
    io.emit('basketballScores', livebasketballScores);
  } catch (error) {
    console.error('Error fetching basketball scores:', error);
  }
}

// Fetch live football scores
async function fetchFootballScores() {
  try {
    const response = await axios.get('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard');
    const footballScores = response.data.events;

    const liveFootballScores = footballScores.filter(game => game.status.type.state === 'in');
    io.emit('footballScores', liveFootballScores);
  } catch (error) {
    console.error('Error fetching football scores:', error);
  }
}

// Fetch live baseball scores
async function fetchBaseballScores() {
  try {
    const response = await axios.get('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard');
    const baseballScores = response.data.events.filter(game => game.status.type.state === 'in');
    io.emit('baseballScores', baseballScores);
  } catch (error) {
    console.error('Error fetching baseball scores:', error);
  }
}

// Fetch live soccer scores
async function fetchSoccerScores() {
  try {
    const responseUSA = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1/scoreboard');
    const responseENG = await axios.get('https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard');

    const soccerScoresUSA = responseUSA.data.events;
    const soccerScoresENG = responseENG.data.events;

    const liveSoccerScoresUSA = soccerScoresUSA.filter(game => game.status.type.state === 'in');
    const liveSoccerScoresENG = soccerScoresENG.filter(game => game.status.type.state === 'in');

    const liveSoccerScores = [...liveSoccerScoresUSA, ...liveSoccerScoresENG];
    io.emit('soccerScores', liveSoccerScores);
  } catch (error) {
    console.error('Error fetching soccer scores:', error);
  }
}

// Set up WebSocket connection
io.on('connection', (socket) => {
  console.log('A user connected');

  // Fetch football scores immediately upon connection
  fetchFootballScores();

  // Fetch football scores every 3 seconds
  const footballInterval = setInterval(fetchFootballScores, 500);
	
  // Fetch football scores immediately upon connection
  fetchBaseballScores();

  // Fetch football scores every 3 seconds
  const baseballInterval = setInterval(fetchBaseballScores, 500);

  // Fetch baseball scores immediately upon connection
	fetchbasketballScores();

	// Fetch basketball scores every 3 seconds
	const basketballInterval = setInterval(fetchbasketballScores, 150);

  // Fetch soccer scores immediately upon connection
  fetchSoccerScores();

  // Fetch soccer scores every 5 seconds
  const soccerInterval = setInterval(fetchSoccerScores, 500);

  // Clean up intervals when the user disconnects
  socket.on('disconnect', () => {
    console.log('A user disconnected');
    clearInterval(footballInterval);
    clearInterval(baseballInterval);
    clearInterval(soccerInterval);
  });
});

// Handle 404 page
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '/public/404.html'));
});

// Handle server errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Something went wrong.');
});

// Start the server
const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
