// Fetch data from YouTube Music
async function fetchDataFromYTMusic(songInput) {
    const searchUrl = `http://localhost:3000/getYTMusic?song=${encodeURIComponent(songInput)}`;
    try {
        let response = await fetch(searchUrl);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let data = await response.json();
        return {
            serviceName: "YouTube Music",
            songName: data.songName,
            link: data.link,
            artist: data.artist
        };
    } catch (error) {
        console.log('Error:', error);
        return {};
    }
}

export default fetchDataFromYTMusic;
