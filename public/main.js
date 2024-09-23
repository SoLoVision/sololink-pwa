import { getFirestore } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { auth } from "./firebase.js";
import './js/search.js';
import './js/theme.js';
import './js/dashboard.js';
import './js/menu.js';
import { updateDashboard } from './js/dashboard.js';
import { setCurrentSongInfo } from './js/state.js';

document.addEventListener('DOMContentLoaded', function () {
    const menu = document.getElementById('menu');
    const mainPageLink = document.getElementById('mainPageLink');
    const dashboardLink = document.getElementById('dashboardLink');
    const menuButton = document.getElementById('menuIcon');

    const closeMenu = () => {
        menu.classList.remove('open');
    };

    const openMenu = () => {
        menu.classList.add('open');
    };

    mainPageLink.addEventListener('click', closeMenu);
    dashboardLink.addEventListener('click', closeMenu);
    menuButton.addEventListener('click', openMenu);
});

document.addEventListener('DOMContentLoaded', (event) => {
    const dashboardLink = document.getElementById('dashboardLink');
    const mainPageLink = document.getElementById('mainPageLink');
    const dashboardContent = document.getElementById('dashboardContent');
    const mainContent = document.querySelector('.container');

    if (dashboardLink && mainPageLink && mainContent && dashboardContent) {
        dashboardLink.addEventListener('click', function () {
            mainContent.style.display = "none";
            dashboardContent.style.display = "block";
            updateDashboard();
        });

        mainPageLink.addEventListener('click', function () {
            location.reload();
            dashboardContent.style.display = "none";
            mainContent.style.display = "block";
        });
    } else {
        console.error('One or more elements could not be found');
    }
});

document.addEventListener('click', async function (event) {
    const closestSavedSong = event.target.closest('.saved-song');

    if (!closestSavedSong) {
        return;
    }

    const songTitleElement = closestSavedSong.querySelector('.song-title');

    if (!songTitleElement) {
        return;
    }

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

// This function fetches song information from Firestore based on the song title.
async function getSongInfoFromFirestore(songTitle) {
    console.log("Debug: Inside getSongInfoFromFirestore function"); // Debug log
    let songInfo = null;
    console.log("Debug: songTitle =", songTitle); // Debug log

    if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        console.log("Debug: uid =", uid); // Debug log
        console.log("Debug: db =", db); // Debug log

        if (uid && db) {
            const songDoc = doc(db, 'users', uid, 'savedSongs', songTitle);
            const songSnap = await getDoc(songDoc);

            if (songSnap.exists()) {
                songInfo = songSnap.data();
                console.log("Debug: Fetched songInfo =", songInfo); // Debug log
            } else {
                console.log("Debug: songSnap does not exist"); // Debug log
            }
        } else {
            console.error("Debug: uid or db is undefined"); // Debug log
        }
    } else {
        console.error("Debug: User is not authenticated"); // Debug log
    }

    return songInfo;
}





// Fetch streaming links from Firestore based on song title
async function getStreamingLinksFromFirestore(songTitle) {
    console.log("Debug: Inside getStreamingLinksFromFirestore");  // Debugging line
    let streamingLinks = null;  // Initialize an empty object to hold the streaming links

    if (auth.currentUser) {  // Check if a user is currently authenticated
        const uid = auth.currentUser.uid;  // Get the user's unique ID
        const songDoc = doc(db, 'users', uid, 'savedSongs', songTitle);  // Reference to Firestore document for the song
        const songSnap = await getDoc(songDoc);  // Fetch the document

        if (songSnap.exists()) {  // Check if the document exists
            console.log("Debug: Document exists");  // Debugging line
            const data = songSnap.data();  // Get the data from the document
            console.log("Debug: Full Document Data", data);  // Debugging line: Print entire document data

            streamingLinks = data.streamingLinks;  // Try to get streamingLinks

            if (!streamingLinks) {
                console.log("Debug: streamingLinks field is undefined or null");  // Debugging line
            }
        } else {
            console.log("Debug: Document does not exist");  // Debugging line
        }
    } else {
        console.log("Debug: User not authenticated");  // Debugging line
    }

    return streamingLinks;  // Return the streaming links
}


// Event listener for 'Choose Layout' option
// This event listener handles clicks on the 'Choose Layout' option.
document.addEventListener('click', async function (event) {
    console.log("Debug: Inside event listener for 'Choose Layout'"); // Debug log

    if (event.target.matches('.songMenu-choose-layout')) {
        console.log('Debug: Choose Layout clicked'); // Debug log

        const closestSavedSong = event.target.closest('.saved-song');
        const songTitle = closestSavedSong.dataset.songTitle;

        console.log(`Debug: Song Title: ${songTitle}`); // Debug log

        const songInfo = await getSongInfoFromFirestore(songTitle);
        const streamingLinks = await getStreamingLinksFromFirestore(songTitle);

        console.log('Debug: Song Info:', songInfo); // Debug log
        console.log('Debug: Streaming Links:', streamingLinks); // Debug log

        if (songInfo && streamingLinks) {
            setCurrentSongInfo(songInfo, streamingLinks);
            displayLayoutOptionsPopup();
        } else {
            if (!songInfo) {
                console.error('Debug: Could not fetch song information.'); // Debug log
            }
            if (!streamingLinks) {
                console.error('Debug: Could not fetch streaming links.'); // Debug log
            }
        }
    }
});



// Function to display layout options popup
function displayLayoutOptionsPopup() {
    console.log('Displaying layout options popup');
    const popup = document.getElementById('layoutOptionsPopup');
    popup.style.display = 'flex';  // Or 'block' depending on your requirements
}

// Function to hide layout options popup
function hideLayoutOptionsPopup() {
    console.log('Hiding layout options popup');
    const popup = document.getElementById('layoutOptionsPopup');
    popup.style.display = 'none';
}

// Close layout options popup when the close button is clicked
document.getElementById("closeLayoutOptions").addEventListener('click', function () {
    hideLayoutOptionsPopup();
});


// Event listener for layout options in the popup
document.addEventListener('click', function (event) {
    if (event.target.closest('.layout-option')) {
        const selectedLayout = event.target.closest('.layout-option').dataset.layout;
        console.log(`Selected layout: ${selectedLayout}`);
        updateSelectedLayoutInFirestore(selectedLayout);
        hideLayoutOptionsPopup();
    }
});

// Event listener to close the popup when clicking outside of it
document.addEventListener('click', function (event) {
    const popup = document.getElementById('layoutOptionsPopup');
    if (!popup.contains(event.target) && !event.target.matches('.songMenu-choose-layout') && !popup.classList.contains('hidden')) {
        console.log('Clicked outside the popup, hiding it');
        hideLayoutOptionsPopup();
    }
});

// Function to update Firestore
async function updateSelectedLayoutInFirestore(selectedLayout) {
    console.log(`Updating Firestore with selected layout: ${selectedLayout}`);
    if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        if (currentSongInfo) {
            const songDoc = doc(db, 'users', uid, 'savedSongs', currentSongInfo.title);
            const updatedData = {
                layout: selectedLayout
            };
            await setDoc(songDoc, updatedData, { merge: true });
            console.log('Successfully updated Firestore');

            // Trigger saveSongToDashboard here
            if (currentSongInfo && currentStreamingLinks) {
                await saveSongToDashboard(currentSongInfo, currentStreamingLinks, selectedLayout);
            } else {
                console.warn('currentSongInfo or currentStreamingLinks is not set');
            }
        } else {
            console.warn('currentSongInfo is not set. Cannot update Firestore.');
        }
    }
}



// Delete Song Button

// Function to handle the delete option in the dropdown
document.addEventListener('click', function (event) {
    if (event.target.matches('.songMenu-delete')) {
        const songItem = event.target.closest('.saved-song');
        songItem.remove();
        deleteSong(event);  // Call your existing deleteSong function to remove from Firebase
    }
});

// Function to delete a song
async function deleteSong(event) {
    const songTitle = event.target.closest('.saved-song').querySelector('.song-title').innerText;
    if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const songDoc = doc(db, 'users', uid, 'savedSongs', songTitle);
        await deleteDoc(songDoc);
        updateDashboard();  // Update dashboard to reflect changes
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////// Saving Song //////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Initialize Firestore Database
const db = getFirestore();

async function saveSongToDashboard(songInfo, streamingLinks, selectedLayout = 'htmlLayout-default') {
    if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        // Combine artist name and song name to create a unique identifier
        const uniqueDocName = `${songInfo.title}`;
        const songDoc = doc(db, 'users', uid, 'savedSongs', uniqueDocName);

        // Generate Streaming Service Links HTML
        let streamingLinksHtml = '';
        if (streamingLinks) {
            streamingLinks.forEach(link => {
                streamingLinksHtml += `<button onclick="window.open('${link.link}')">
                <img src='images/streaming_images/${link.serviceName}/streaming_image.png'/>
               </button>`;
            });
        }
        // if (item.serviceName === 'Spotify') {
        //     buttonImg.src = 'images/streaming_images/spotify/Spotify_Logo_RGB_Green.png';
        // } else if (item.serviceName === 'YouTube') {
        //     buttonImg.src = 'images/streaming_images/youtube/yt_logo_rgb_dark.png';
        // }



        // Fetch the HTML layout file
        let layoutHtml = '';
        try {
            const response = await fetch(`/layouts/${selectedLayout}.html`);
            layoutHtml = await response.text();
        } catch (error) {
            console.warn('Could not fetch the HTML layout file', error);
        }

        // Add a query parameter to make the URL unique
        const bgAlbumArt = `${songInfo.albumArt}?bg=true`;

        // Replace placeholders in the HTML layout
        layoutHtml = layoutHtml.replace('{albumArt}', songInfo.albumArt)
            .replace('{bgAlbumArt}', bgAlbumArt)
            .replace('{title}', songInfo.title)
            .replace('{artist}', songInfo.artist)
            .replace('{streamingLinksHtml}', streamingLinksHtml);

        // Save to Firestore
        await setDoc(songDoc, {
            ...songInfo,
            bgAlbumArt,  // Save the bgAlbumArt
            streamingLinks,
            htmlContent: layoutHtml,
            layout: selectedLayout || 'htmlLayout-default'
        });

        console.log('Song Info, HTML file, and layout saved to Firestore');
    } else {
        console.log('User not authenticated');
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Show SoLoLink HTML
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// New function to generate HTML based on the layout
async function generateHtmlFromLayout(songInfo, streamingLinks, selectedLayout = 'htmlLayout-default') {
    let layoutHtml = '';
    try {
        const response = await fetch(`/layouts/${selectedLayout}.html`);
        layoutHtml = await response.text();
    } catch (error) {
        console.warn('Could not fetch the HTML layout file', error);
    }

    const bgAlbumArt = `${songInfo.albumArt}?bg=true`;

    layoutHtml = layoutHtml.replace('{albumArt}', songInfo.albumArt)
        .replace('{bgAlbumArt}', bgAlbumArt)
        .replace('{title}', songInfo.title)
        .replace('{artist}', songInfo.artist)
        .replace('{streamingLinksHtml}', streamingLinksHtml);

    return layoutHtml;
}




// Fetch saved HTML content for a song from Firestore
// Existing function to get HTML from Firestore
async function getHtmlFromFirestore(songTitle) {
    let html = '';
    if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const songHtmlDoc = doc(db, 'users', uid, 'savedSongs', songTitle);
        const songHtmlSnap = await getDoc(songHtmlDoc);

        if (songHtmlSnap.exists()) {
            const songData = songHtmlSnap.data();

            console.log('Fetched from Firestore:', songData);

            // Generate HTML content based on the layout
            const htmlContent = await generateHtmlFromLayout(
                {
                    title: songData.title,
                    artist: songData.artist,
                    album: songData.album,
                    albumArt: songData.albumArt
                },
                songData.streamingLinks,
                songData.layout
            );

            // Use the generated HTML content
            html = htmlContent;

            console.log('Fetched and updated HTML from Firestore');
        } else {
            console.error('HTML content not found in Firestore');
        }
    } else {
        console.error('User not authenticated');
    }
    return html;
}



// Function to fetch saved songs from Firestore
const getSavedSongsFromDashboard = async () => {
    const savedSongs = []; // Initialize an empty array to hold saved songs
    if (auth.currentUser) { // Check if a user is currently authenticated
        const uid = auth.currentUser.uid; // Get the user's unique ID
        const songsRef = collection(db, 'users', uid, 'savedSongs'); // Reference to Firestore collection of saved songs
        const songsSnapshot = await getDocs(songsRef); // Fetch all documents from the collection
        songsSnapshot.forEach(doc => {
            savedSongs.push(doc.data()); // Add each document's data to the savedSongs array
        });
    }
    return savedSongs; // Return the savedSongs array

};

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////// Album Art Color Grabber ///////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Function to get the most common color from an image URL
async function getMostCommonColor(imgUrl) {
    console.log("Fetching most common color from " + imgUrl);  // Debugging log
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";  // Handle CORS
        img.src = imgUrl;

        img.onload = function () {
            console.log("Image loaded successfully.");  // Debugging log

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            console.log("Image data length:", imageData.length);  // Debugging log

            const colorCount = {};

            for (let i = 0; i < imageData.length; i += 4) {
                const r = imageData[i];
                const g = imageData[i + 1];
                const b = imageData[i + 2];

                // Exclude black or near-black colors
                if (r + g + b < 10) continue;

                const rgb = `${r},${g},${b}`;
                colorCount[rgb] = (colorCount[rgb] || 0) + 1;
            }

            const mostCommonColor = Object.keys(colorCount).sort((a, b) => colorCount[b] - colorCount[a])[0];

            if (typeof mostCommonColor === 'undefined') {
                resolve('rgb(0,0,0)');  // Return black if most common color is undefined
            } else {
                console.log("Most common color fetched:", `rgb(${mostCommonColor})`);  // Debugging log
                resolve(`rgb(${mostCommonColor})`);
            }
        };

        img.onerror = function () {
            console.log("Error loading image.");  // Debugging log
            reject("Error loading image");
        };
    });
}




// Function to set the CSS variable for button color
async function setButtonColor(albumArtUrl) {
    console.log("Calling setButtonColor function with URL:", albumArtUrl);  // Debugging log
    try {
        const color = await getMostCommonColor(albumArtUrl);
        console.log("Setting --html-album-art-color to:", color);  // Debugging log
        document.documentElement.style.setProperty('--html-album-art-color', color);
    } catch (error) {
        console.error("Could not set button color:", error);
    }
}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////// Theme Code ///////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


///////////// Album Art Theme Generator ///////////////


// Function to adjust an RGB color
function adjustColor(rgb, amount) {
    const [r, g, b] = rgb.match(/\d+/g).map(Number);

    // Clamp values between 0 and 255
    const clamp = (num) => Math.min(255, Math.max(0, num));

    return `rgb(${clamp(r + amount)}, ${clamp(g + amount)}, ${clamp(b + amount)})`;
}

async function setThemeBasedOnAlbumArt(albumArtUrl) {
    // Only proceed if the active theme is 'albumart'
    if (activeTheme !== 'albumart') {
        return;
    }

    try {
        const primaryColor = await getMostCommonColor(albumArtUrl);

        // Define shades based on the primary color
        const bgColor = adjustColor(primaryColor, 40);  // Lighten the primary color for the background
        const secondaryColor = adjustColor(primaryColor, 20);
        const textColor = adjustColor(primaryColor, -100);
        const altBgColor = adjustColor(primaryColor, 10);

        // Set CSS variables
        document.documentElement.style.setProperty('--bg-color', bgColor);
        document.documentElement.style.setProperty('--primary-color', primaryColor);
        document.documentElement.style.setProperty('--secondary-color', secondaryColor);
        document.documentElement.style.setProperty('--text-color', textColor);
        document.documentElement.style.setProperty('--alt-bg-color', altBgColor);
        document.documentElement.style.setProperty('--header-text-color', textColor);
        document.documentElement.style.setProperty('--button-color', primaryColor);
        document.documentElement.style.setProperty('--button-hover-color', secondaryColor);
        document.documentElement.style.setProperty('--input-border-color', secondaryColor);
        document.documentElement.style.setProperty('--input-bg-color', altBgColor);
        document.documentElement.style.setProperty('--results-button-color', primaryColor);
        document.documentElement.style.setProperty('--results-button-hover-color', secondaryColor);

    } catch (error) {
        console.error("Could not set theme:", error);
    }
}




// Active theme
let activeTheme = 'default';

// Set theme function
function setTheme(theme) {

    // Set active theme
    activeTheme = theme;

    // Update stylesheet href
    document.getElementById('theme').href = `themes/theme-${theme}.css`;


}

// Theme change handler
document.getElementById('themeSelect').addEventListener('change', async e => {
    const newTheme = e.target.value;
    setTheme(newTheme);
    await saveThemeToFirestore(newTheme);
});


// Function to save theme to Firestore
async function saveThemeToFirestore(theme) {
    try {
        if (!auth.currentUser) {
            console.error("User not authenticated");
            return;
        }

        const uid = auth.currentUser.uid;
        const userDoc = doc(db, 'users', uid);

        await setDoc(userDoc, { activeTheme: theme }, { merge: true });
        console.log("Theme saved successfully");

    } catch (error) {
        console.error("Could not save theme to Firestore:", error);
    }
}


// Global variable to hold the user's uid
let globalUid = null;

// Firebase Auth state change listener
// Main event listener for when the document is fully loaded
auth.onAuthStateChanged(user => {
    if (user) {
        getThemeFromFirestore(); // Fetch the theme after user is authenticated
    }
});

// Function to get theme from Firestore
async function getThemeFromFirestore() {
    if (!auth.currentUser) {
        return;
    }

    try {
        const uid = auth.currentUser.uid;
        const userDoc = doc(db, 'users', uid);
        const userSnap = await getDoc(userDoc);

        if (userSnap.exists()) {
            const data = userSnap.data();
            const activeTheme = data.activeTheme;
            if (activeTheme) {
                setTheme(activeTheme);
            }
        }
    } catch (error) {
        console.error("Could not load theme from Firestore:", error);
    }
}

