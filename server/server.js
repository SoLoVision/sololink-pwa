const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');

const app = express();
const port = 3000;



app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));


// New endpoint to fetch HTML layout based on layout name
app.get('/getHtmlLayout', (req, res) => {
    const layoutName = req.query.layout;
    const layoutPath = path.join(__dirname, '../public/layouts', `${layoutName}.html`);

    fs.readFile(layoutPath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading layout file: ${err}`);
            return res.status(500).send("Internal Server Error");
        }
        res.send(data);
    });
});


// Endpoint to fetch Spotify Token
app.get('/getSpotifyToken', async (req, res) => {
    const clientId = '340ee3982d954bd18a8c8c1058993e9b';
    const clientSecret = '94238be62c194ea58b7292066c3a92b3';

    const auth = 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64');

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
});


// Endpoint to fetch YouTube Music data
app.get('/getYTMusic', (req, res) => {
    const query = req.query.song;
    exec(`python server/ytmusic_script.py "${query}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error}`);
            return res.status(500).send("Internal Server Error");
        }
        const songDetails = JSON.parse(stdout);
        res.json(songDetails);
    });
});





// Endpoint to fetch YouTube Music data
app.get('/getYTMusic', (req, res) => {
    const query = req.query.song;
    const { exec } = require('child_process');
    exec(`python server/ytmusic_script.py "${query}"`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing Python script: ${error}`);
            return res.status(500).send("Internal Server Error");
        }
        const songDetails = JSON.parse(stdout);
        res.json(songDetails);
    });
});
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});

// Middleware to set Content-Type for JavaScript files
app.use((req, res, next) => {
    if (req.path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript; charset=UTF-8');
    }
    next();
});
