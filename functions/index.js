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

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Function to generate HTML based on the layout and song data
async function generateHtmlFromLayout(songData) {
    // HTML template
    let layoutHtml = `
        <html>
            <head><title>${songData.title}</title></head>
            <body>
                <h1>${songData.artist}</h1>
                <p>${songData.album}</p>
            </body>
        </html>
    `;
    return layoutHtml;
}

// Firebase Function to handle song URL
exports.handleSongURL = functions.https.onRequest(async (req, res) => {
    // Extract artist and title from the request
    const artist = req.body.artist;
    const title = req.body.title;

    // Check if artist and title are not undefined
    if (!artist || !title) {
        console.error('Either artist or title is undefined');
        res.status(400).send('Bad Request: Either artist or title is undefined');
        return;
    }


    try {
        console.log(`Fetching data for artist: ${artist}, title: ${title}`);

        // Initialize Firestore
        const db = admin.firestore();

        // Fetch song data from Firestore
        const doc = await db.collection('songs').doc(title).get();

        // Check if song exists
        if (!doc.exists) {
            console.error('Song not found');
            res.status(404).send('Song not found');
            return;
        }

        // Extract song data
        const songData = doc.data();
        console.log('Fetched song data:', songData);

        // Generate HTML content
        const htmlContent = await generateHtmlFromLayout(songData);
        console.log('Generated HTML content:', htmlContent);

        // Send the generated HTML as the response
        res.status(200).send(htmlContent);
    } catch (error) {
        console.error('Error in handleSongURL function:', error);
        res.status(500).send('Internal Server Error');
    }
});


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



// CORS middleware
const corsHandler = cors({
    origin: true,
});

// Function to handle fetching Spotify Token
exports.getSpotifyToken = functions.https.onRequest((req, res) => {
    // Enable CORS using middleware
    corsHandler(req, res, async () => {
        const clientId = '340ee3982d954bd18a8c8c1058993e9b';
        const clientSecret = '94238be62c194ea58b7292066c3a92b3';

        const auth = 'Basic ' + Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        try {
            const response = await fetch('https://accounts.spotify.com/api/token', {
                method: 'POST',
                headers: {
                    'Authorization': auth,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: 'grant_type=client_credentials'
            });

            const data = await response.json();
            res.json(data.access_token);
        } catch (error) {
            console.error(`Failed to fetch Spotify Token: ${error}`);
            res.status(500).send('Internal Server Error');
        }
    });
});

// Export express app for Cloud Functions
exports.app = functions.https.onRequest(app);