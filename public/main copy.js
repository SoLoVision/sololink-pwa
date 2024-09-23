// Importing fetch functions

import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { auth } from "./firebase.js";  // Import the auth object
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-storage.js";


import fetchDataFromYouTube from './api_calls/youtube.js';
import fetchDataFromSpotify from './api_calls/spotify.js';
// import fetchDataFromYTMusic from './api_calls/youtube_music.js';

// YouTube API Key
const youtubeApiKey = "AIzaSyCN6g8QJ8AW9QJ_STmpbukiFEuRhRqKgxI";

// Debug log
console.log("Debug: main.js loaded");

// Register service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
        .then(reg => console.log('Debug: Service worker registered'))
        .catch(err => console.log('Debug: Service worker error', err));
}

// Search button click handler
document.getElementById("searchButton").addEventListener("click", async function () {

    // Get input
    const songInput = document.getElementById("songInput").value;

    // Validate input
    if (!songInput) {
        alert("Please enter a song name or link.");
        return;
    }

    // Fetch YouTube data
    const youtubeData = await fetchDataFromYouTube(songInput, youtubeApiKey);

    // Fetch Spotify data
    const spotifyData = await fetchDataFromSpotify(songInput);

    // Fetch YouTube Music data
    //const ytMusicData = await fetchDataFromYTMusic(songInput);

    // Combine all data
    const fetchedData = [...youtubeData, ...spotifyData ];
    //const fetchedData = [...youtubeData, ...spotifyData, ...(Array.isArray(ytMusicData) ? ytMusicData : [ytMusicData])];
    // Display results
    displayResults(fetchedData);

});

// Display results function
function displayResults(fetchedData) {

    // Initialize streamingLinks here
    const streamingLinks = fetchedData.map(item => {
        return {
            link: item.link,
            serviceName: item.serviceName
        };
    });

    // Get Spotify data
    const spotifyData = fetchedData.find(item => item.serviceName === 'Spotify');

    // Create results container
    const resultsContainer = document.getElementById("results");

    // Show Spotify data if found
    if (spotifyData) {

        // Create img element
        const img = document.createElement("img");
        img.src = spotifyData.albumArt;
        img.style.borderRadius = "50%";
        img.width = 150;

        // Create Save to Dashboard link
        const saveLink = document.createElement("a");
        saveLink.href = "#";
        saveLink.className = "save-to-dashboard";
        saveLink.textContent = "Save To Dashboard";

        // Attach click event listener to the Save to Dashboard link
        saveLink.addEventListener('click', function () {
            const songInfo = {
                title: spotifyData.songName,
                artist: spotifyData.artist,
                album: spotifyData.album,
                albumArt: spotifyData.albumArt
            };
            console.log('streamingLinks before saveSongToDashboard:', streamingLinks);
            saveSongToDashboard(songInfo, streamingLinks);
        });

        // Set inner HTML
        resultsContainer.innerHTML = `
            ${img.outerHTML}
            <div>
                <strong>${spotifyData.songName}</strong>
                <br>
                <strong>${spotifyData.artist}</strong>
                <br>
                <strong>${spotifyData.album}</strong>
                <br>
            </div>
        `;

        // Append the Save to Dashboard link to the results
        resultsContainer.appendChild(saveLink);
    }

    // Loop through the fetched data to create service buttons
    fetchedData.forEach(item => {

        // Create button
        const button = document.createElement("button");
        button.textContent = item.serviceName;

        // Set button onclick
        button.onclick = () => window.open(item.link);

        // Append button
        resultsContainer.appendChild(button);
    });
}


///////////////////// Menu Section /////////////////////


// Get the menu icon element from the DOM
const navMenuIcon = document.querySelector('.navbar .fas');

// Add click handler for the menu icon
navMenuIcon.addEventListener('click', function (event) {
    event.stopPropagation();  // Prevent the event from bubbling up to the document
    toggleMenu(); // Open or close the menu
});

// Menu state variable
let menuOpen = false;

// Function to open the menu
function openMenu() {
    menuOpen = true; // Update state variable
    const menuEl = document.getElementById('menu'); // Get menu element
    menuEl.classList.add('open'); // Add 'open' class to menu element
}

// Function to close the menu
function closeMenu() {
    menuOpen = false; // Update state variable
    const menuEl = document.getElementById('menu'); // Get menu element
    menuEl.classList.remove('open'); // Remove 'open' class from menu element
}

// Function to toggle the menu
function toggleMenu() {
    // Check if the menu is currently open
    if (menuOpen) {
        closeMenu(); // Close the menu
    } else {
        openMenu(); // Open the menu
    }
}

// Event listener to close the menu when clicking outside of it
document.addEventListener('click', function (event) {
    const menuEl = document.getElementById('menu'); // Get menu element
    // Check if clicked outside the menu and the menu icon, and if the menu is open
    if (!menuEl.contains(event.target) && !navMenuIcon.contains(event.target) && menuOpen) {
        closeMenu(); // Close the menu
    }
});


/////////////////////  Dashboard ///////////////////////


// Function to update the Dashboard UI with saved songs
const updateDashboard = async () => {
    const dashboardContent = document.getElementById('dashboardContent');
    const savedSongs = await getSavedSongsFromDashboard();
    console.log('Fetched saved songs:', savedSongs);

    let html = '';
    savedSongs.forEach(song => {
        html += `
    <div class="saved-song">
        <img src="${song.albumArt}" alt="Album Art" width="50">
        <div class="text-info">
            <span class="song-title">${song.title}</span>
            <span class="song-artist">${song.artist}</span>
        </div>
        <div class="song-controls">
            <button class="songMenu">
                <i class="fa-solid fa-ellipsis-vertical"></i>
            </button>
            <!-- Added Dropdown Menu -->
            <div class="songMenu-dropdown">
                <ul>
                    <li><a href="#" class="songMenu-view">View SoLoLink</a></li>
                    <li><a href="#" class="songMenu-choose-layout">Choose Layout</a></li>
                    <li><a href="#" class="songMenu-delete">Delete</a></li>
                </ul>
            </div>
        </div>
    </div>
    `;
    });

    dashboardContent.innerHTML = html;
};


// Function to toggle dashboard and main content visibility
document.addEventListener('DOMContentLoaded', (event) => {
    const dashboardLink = document.getElementById('dashboardLink');
    const mainPageLink = document.getElementById('mainPageLink');
    const dashboardContent = document.getElementById('dashboardContent');
    const mainContent = document.querySelector('.container');  // Assume the main content is within a container with the class "container"

    if (dashboardLink && mainPageLink && mainContent && dashboardContent) {
        dashboardLink.addEventListener('click', function () {
            mainContent.style.display = "none";
            dashboardContent.style.display = "block";
            updateDashboard();  // Update the dashboard
        });

        mainPageLink.addEventListener('click', function () {
            dashboardContent.style.display = "none";
            mainContent.style.display = "block";
        });
    } else {
        console.error('One or more elements could not be found');
    }
});


// Show Song Menu Dropdown


// Function to toggle the visibility of the dropdown menu
document.addEventListener('click', function (event) {
    if (event.target.closest('.songMenu')) {
        const dropdown = event.target.closest('.saved-song').querySelector('.songMenu-dropdown');
        dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
    }
});

// Add event listener to close the dropdown when clicking outside of it
document.addEventListener('click', function (event) {
    const dropdowns = document.querySelectorAll('.songMenu-dropdown');
    dropdowns.forEach(dropdown => {
        if (!dropdown.contains(event.target) && !event.target.matches('.songMenu') && dropdown.style.display === 'block') {
            dropdown.style.display = 'none';
        }
    });
});


// Add event listeners to all View SoLoLink options in dropdowns
document.addEventListener('click', async function (event) {
    if (event.target.matches('.songMenu-view')) {
        const songTitle = event.target.closest('.saved-song').querySelector('.song-title').innerText;
        const songHtml = await getHtmlFromFirestore(songTitle);  // Your existing function to fetch HTML from Firestore
        const newWindow = window.open("", "_blank");
        newWindow.document.write(songHtml);
    }
});



// Choose Layout Button


// Event listener for 'Choose Layout' option
document.addEventListener('click', function (event) {
    console.log('Click event detected');
    if (event.target.matches('.songMenu-choose-layout')) {
        console.log('Choose Layout button clicked');
        displayLayoutOptionsPopup();
    }
});

// Function to display layout options popup
function displayLayoutOptionsPopup() {
    const popup = document.getElementById('layoutOptionsPopup');
    if (popup) {
        console.log('Displaying layout options popup');
        popup.classList.remove('hidden');
    } else {
        console.log('layoutOptionsPopup element not found');
    }
}

// Function to hide layout options popup
function hideLayoutOptionsPopup() {
    const popup = document.getElementById('layoutOptionsPopup');
    if (popup) {
        console.log('Hiding layout options popup');
        popup.classList.add('hidden');
    } else {
        console.log('layoutOptionsPopup element not found');
    }
}

// Event listener for layout options in the popup
document.addEventListener('click', function (event) {
    if (event.target.closest('.layout-option')) {
        const selectedLayout = event.target.closest('.layout-option').dataset.layout;
        if (selectedLayout) {
            console.log('Selected layout:', selectedLayout);
            const songTitle = "The song title should be dynamically fetched"; // Fetch the song title dynamically
            console.log('Calling updateSelectedLayoutInFirestore with selected layout and song title');
            updateSelectedLayoutInFirestore(selectedLayout, songTitle);
            hideLayoutOptionsPopup();
        } else {
            console.log('No layout selected');
        }
    }
});

// Event listener to close the popup when clicking outside of it
document.addEventListener('click', function (event) {
    const popup = document.getElementById('layoutOptionsPopup');
    if (popup && !popup.contains(event.target) && !event.target.matches('.songMenu-choose-layout') && !popup.classList.contains('hidden')) {
        console.log('Click outside popup detected');
        hideLayoutOptionsPopup();
    }
});

// Function to update Firestore
async function updateSelectedLayoutInFirestore(selectedLayout, songTitle) {
    console.log('Inside updateSelectedLayoutInFirestore function');
    if (auth && auth.currentUser) {
        const uid = auth.currentUser.uid;
        console.log('User is authenticated, uid:', uid);
        if (uid && songTitle) {
            console.log('Both uid and songTitle are available');
            const songDoc = doc(db, 'users', uid, 'savedSongs', songTitle);
            const updatedData = {
                layout: selectedLayout
            };
            console.log('Updating Firestore with selected layout');
            await setDoc(songDoc, updatedData, { merge: true });
            console.log('Successfully updated Firestore');
        } else {
            console.log('Either uid or songTitle is missing');
        }
    } else {
        console.log('User not authenticated');
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


///////////////////// Saving Song //////////////////////////


// Initialize Firestore Database
const db = getFirestore();
const storage = getStorage();  // New initialization


// Save song information and HTML to Firestore
async function saveSongToDashboard(songInfo, streamingLinks, selectedLayout = 'htmlLayout-default') {
    if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const songDoc = doc(db, 'users', uid, 'savedSongs', songInfo.title);

        // Initialize streamingLinksHtml
        let streamingLinksHtml = '';

        // Generate Streaming Service Links HTML
        if (streamingLinks) {
            streamingLinks.forEach(link => {
                streamingLinksHtml += `<button onclick="window.open('${link.link}')">${link.serviceName}</button>`;
            });
        } else {
            console.warn('streamingLinks is undefined or null');
        }

        // Determine which layout to use
        const layoutCSSPath = selectedLayout ? `/layouts/${selectedLayout}.css` : '/layouts/htmlLayout-default.css';

        // Generate HTML content
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${songInfo.title}</title>
            <link rel="stylesheet" type="text/css" href="${layoutCSSPath}">
            <link rel="stylesheet" type="text/css" href="/styles/results.css">
            <script>
                // Function to set the favicon
                function setFavicon(favImgURL) {
                    let canvas = document.createElement('canvas');
                    canvas.width = 64;
                    canvas.height = 64;
                    let ctx = canvas.getContext('2d');

                    let img = new Image();
                    img.src = favImgURL;
                    img.onload = function() {
                        // Draw a circle
                        ctx.beginPath();
                        ctx.arc(32, 32, 32, 0, Math.PI * 2);
                        ctx.clip();

                        // Draw the image into the circle
                        ctx.drawImage(img, 0, 0, 64, 64);

                        // Create favicon link element
                        let link = document.createElement('link');
                        link.type = 'image/x-icon';
                        link.rel = 'shortcut icon';
                        link.href = canvas.toDataURL('image/x-icon');

                        // Append to the head
                        document.getElementsByTagName('head')[0].appendChild(link);
                    };
                }

                // Set the favicon when the document is ready
                document.addEventListener("DOMContentLoaded", function() {
                    setFavicon("${songInfo.albumArt}");
                });
            </script>
        </head>
        <body>
            <div class="html-container">
                <div class="html-saved-song" id="html-results">
                    <img src="${songInfo.albumArt}" alt="Album Art" class="html-album-art" width="50">
                    <div class="html-text-info">
                        <span class="html-song-title">${songInfo.title}</span>
                        <span class="html-song-artist">${songInfo.artist}</span>
                    </div>
                    <div class="html-streaming-links">
                        ${streamingLinksHtml}
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        // Save to Firestore
        await setDoc(songDoc, { ...songInfo, htmlContent, layout: selectedLayout || 'htmlLayout-default' });

        console.log('Song Info, HTML file, and layout saved to Firestore');
    } else {
        console.log('User not authenticated');
    }
}









// Show SoLoLink HTML


// Fetch saved HTML content for a song from Firestore
async function getHtmlFromFirestore(songTitle) {
    let html = '';
    if (auth.currentUser) {
        const uid = auth.currentUser.uid;
        const songHtmlDoc = doc(db, 'users', uid, 'savedSongs', songTitle);
        const songHtmlSnap = await getDoc(songHtmlDoc);

        if (songHtmlSnap.exists()) {
            const songData = songHtmlSnap.data();

            // Log the songData after it's defined
            console.log('Fetched from Firestore:', songData);

            // Log the retrieved HTML content for debugging
            console.log('Retrieved HTML content:', songData.htmlContent);

            // Parse the HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(songData.htmlContent, 'text/html');

            // Update the layout link
            const layoutLink = doc.querySelector('link');
            layoutLink.href = "/layouts/" + songData.layout + ".css";

            // Log the content of the streaming-links div for debugging
            const streamingLinksDiv = doc.querySelector(".streaming-links");
            console.log("Streaming Links Div Content:", streamingLinksDiv ? streamingLinksDiv.innerHTML : "Not found");

            // Get the final HTML content
            html = doc.documentElement.outerHTML;

            // Log the final HTML after updating the layout
            console.log('Final HTML:', html);

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










///////////// Theme Code ///////////////


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
document.getElementById('themeSelect').addEventListener('change', e => {

    // Call set theme
    setTheme(e.target.value);

});