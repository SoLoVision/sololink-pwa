let currentSongInfo = null;
let currentStreamingLinks = null;

function setCurrentSongInfo(songInfo, streamingLinks) {
    currentSongInfo = songInfo;
    currentStreamingLinks = streamingLinks;
}

export { currentSongInfo, currentStreamingLinks, setCurrentSongInfo };