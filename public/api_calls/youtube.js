async function fetchDataFromYouTube(songInput, apiKey) {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&type=video&q=${songInput}&key=${apiKey}`;
    let response = await fetch(searchUrl);
    let data = await response.json();

    if (data.items.length > 0) {
        const firstResult = data.items[0];
        return [{
            serviceName: "YouTube",
            songName: firstResult.snippet.title,
            link: `https://www.youtube.com/watch?v=${firstResult.id.videoId}`,
            metadata: `Channel: ${firstResult.snippet.channelTitle}`
        }];
    } else {
        return [];
    }
}

export default fetchDataFromYouTube;
