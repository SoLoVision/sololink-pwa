// Require express 
const express = require('express');

// Require cors
const cors = require('cors');

// Require path
const path = require('path');

// Require fs
const fs = require('fs');

// Create express app
const app = express();

// Enable CORS with origin set to true
app.use(cors({
    origin: true
}));

// Serve static files from public folder 
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint to fetch HTML layout
app.get('/getHtmlLayout', (req, res) => {

    // Get layout name from query
    const layoutName = req.query.layout;

    // Build layout file path
    const layoutPath = path.join(__dirname, '../public/layouts', `${layoutName}.html`);

    // Read layout file
    fs.readFile(layoutPath, 'utf8', (err, data) => {

        // Handle read error
        if (err) {
            console.error(`Error reading layout file: ${err}`);

            // Send 500 error
            return res.status(500).send("Internal Server Error");
        }

        // Send layout data
        res.send(data);

    });

});

// Endpoint to get Spotify token
app.get('/getSpotifyToken', async (req, res) => {

    // Set CORS headers
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    // Client credentials
    const clientId = '340ee3982d954bd18a8c8c1058993e9b';
    const clientSecret = '94238be62c194ea58b7292066c3a92b3';

    // Base64 encoded auth string
    const auth = 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64');

    // Fetch token
    const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': auth,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    // Parse response to JSON
    const data = await response.json();

    // Send access token in response
    res.json(data.access_token);

});

// Export express app for Cloud Functions
exports.app = functions.https.onRequest(app);