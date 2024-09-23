import { getSavedSongsFromDashboard, getSongInfoFromFirestore, getStreamingLinksFromFirestore } from './firestore.js';
import { createSlug } from './utils.js';
import { setCurrentSongInfo } from './state.js';

const updateDashboard = async () => {
    const dashboardContent = document.getElementById('dashboardContent');
    const savedSongs = await getSavedSongsFromDashboard();
    let html = '';
    savedSongs.forEach(song => {
        html += `
    <div class="saved-song" data-song-title="${song.title}">
        <img src="${song.albumArt}" alt="Album Art" width="50">
        <div class="text-info">
            <span class="song-title">${song.title}</span>
            <span class="song-artist">${song.artist}</span>
        </div>
        <div class="song-controls">
            <button class="songMenu">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <div class="songMenu-dropdown">
                <ul>
                    <li><a href="#" class="songMenu-view">View SoLoLink</a></li>
                    <li><a href="#" class="songMenu-choose-layout">Choose Layout</a></li>
                    <li><a href="#" class="songMenu-delete">Delete</a></li>
                    <li><a href="#" class="songMenu-generate-link">Generate Link</a></li>
                </ul>
            </div>
        </div>
    </div>
    `;
    });
    dashboardContent.innerHTML = html;
};

document.addEventListener('click', async function (event) {
    const closestSavedSong = event.target.closest('.saved-song');
    if (!closestSavedSong) return;

    const songTitleElement = closestSavedSong.querySelector('.song-title');
    if (!songTitleElement) return;

    const songTitle = songTitleElement.innerText;
    let songInfo = null;

    try {
        songInfo = await getSongInfoFromFirestore(songTitle);
    } catch (error) {
        console.error("Error fetching songInfo:", error);
        return;
    }

    if (event.target.matches('.songMenu-generate-link')) {
        if (!songInfo) {
            console.error("Could not fetch songInfo for song title:", songTitle);
            return;
        }
        const slug = createSlug(songInfo.artist, songInfo.title);
        const fullUrl = `https://sololink-accf3.web.app/${slug}/`;
        window.open(fullUrl, '_blank');
    }
});

export { updateDashboard };