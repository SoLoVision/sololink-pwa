// Function to fetch data from Spotify API
export default async function fetchDataFromSpotify(songInput) {
    try {
        // Replace with your actual method to fetch Spotify data, e.g., using a Firebase Function or server-side proxy
        // For example, you might have an endpoint like '/api/spotify?song=songInput'
        const response = await fetch(`/api/spotify?song=${encodeURIComponent(songInput)}`);
        const data = await response.json();

        if (!data.items) return [];

        return data.items.map(item => ({
            link: item.external_urls.spotify,
            serviceName: 'Spotify',
            songName: item.name,
            artist: item.artists.map(artist => artist.name).join(', '),
            album: item.album.name,
            albumArt: item.album.images[0].url
        }));
    } catch (error) {
        console.error("Error fetching data from Spotify:", error);
        return [];
    }
}