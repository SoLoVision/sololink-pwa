// Determine the API URL based on the environment
// Update the API URL to point to the Firebase Function
const apiUrl = window.location.hostname === 'localhost' ?
    'http://localhost:3000/getSpotifyToken' : // Local development URL
    'https://us-central1-sololink-accf3.cloudfunctions.net/getSpotifyToken'; // Production URL

// Fetch the Spotify token from your server
async function fetchSpotifyToken() {
    const response = await fetch(apiUrl);
    const token = await response.json();
    return token;
}


// Fetch data from Spotify
async function fetchDataFromSpotify(songInput) {
    // Fetch the Spotify token
    const accessToken = await fetchSpotifyToken();

    // URL for Spotify's search API
    const searchUrl = `https://api.spotify.com/v1/search?q=${songInput}&type=track&limit=1`;

    // Make the API call
    let response = await fetch(searchUrl, {
        headers: {
            "Authorization": `Bearer ${accessToken}`
        }
    });

    // Parse the JSON response
    let data = await response.json();

    // Check if any tracks were found
    if (data.tracks.items.length > 0) {
        const firstResult = data.tracks.items[0];

        // Extract artist names from the artists array and join them with ', '
        const artistNames = firstResult.artists.map(artist => artist.name).join(', ');
        const albumArt = firstResult.album.images[0].url;

        // Return the data for the first result
        return [{
            serviceName: "Spotify",
            songName: firstResult.name,
            link: firstResult.external_urls.spotify,
            metadata: `Album: ${firstResult.album.name}`,
            artist: artistNames,  // Include artist name
            album: firstResult.album.name,  // Include album name
            albumArt: albumArt
        }];
    } else {
        return [];
    }
}

export default fetchDataFromSpotify;
