import fetchDataFromYouTube from './api_calls/youtube.js';
import fetchDataFromSpotify from './api_calls/spotify.js';
import { displayResults } from './results.js';
import { getMostCommonColor } from './utils.js';

const youtubeApiKey = "AIzaSyBTP7VWvdJrAXgf965iz3BsL7a19UmAMLM";

document.getElementById("searchButton").addEventListener("click", async function () {
    const songInput = document.getElementById("songInput").value;

    if (!songInput) {
        alert("Please enter a song name or link.");
        return;
    }

    const youtubeData = await fetchDataFromYouTube(songInput, youtubeApiKey);
    const spotifyData = await fetchDataFromSpotify(songInput);
    const fetchedData = [...youtubeData, ...spotifyData];

    await displayResults(fetchedData);

    if (activeTheme === 'albumart' && spotifyData.length > 0) {
        const albumArtUrl = spotifyData[0].albumArt;
        try {
            const color = await getMostCommonColor(albumArtUrl);
            document.documentElement.style.setProperty('--album-art-color', color);
        } catch (error) {
            console.error("Could not set album art color:", error);
        }
    }
});

document.getElementById("songInput").addEventListener("keyup", function (event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("searchButton").click();
    }
});