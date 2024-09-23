const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));





// Serve static files with correct MIME types
app.use(express.static(path.join(__dirname, '..', 'public'), {
    setHeaders: (res, path, stat) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));
// API Routes
app.get('/api/spotify', async (req, res) => {
    const song = req.query.song;
    // Implement logic to fetch data from Spotify API, possibly through a Firebase Function or server-side proxy
    // Example response:
    res.status(200).json({ 
        link: "https://open.spotify.com", 
        serviceName: "Spotify", 
        songName: "Song Name",
        artist: "Artist Name",
        album: "Album Name",
        albumArt: "https://linktoalbumart.com/image.jpg"
    });
});

// Catch-all to serve index.html for any other routes (for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
