export default async function fetchDataFromYouTube(songInput, apiKey) {
    try {
        const response = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(songInput)}&key=${apiKey}`);
        const data = await response.json();

        if (!data.items) return [];

        return data.items.map(item => ({
            link: `https://www.youtube.com/watch?v=${item.id.videoId}`,
            serviceName: 'YouTube'
        }));
    } catch (error) {
        console.error("Error fetching data from YouTube:", error);
        return [];
    }
}