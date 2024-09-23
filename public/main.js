// Importing fetch functions

import { getFirestore, collection, getDocs, getDoc, doc, setDoc, deleteDoc, } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";
import { auth } from "./firebase.js";  // Import the auth object
import fetchDataFromYouTube from './api_calls/youtube.js';
import fetchDataFromSpotify from './api_calls/spotify.js';


// import fetchDataFromYTMusic from './api_calls/youtube_music.js';

// YouTube API Key
const youtubeApiKey = "AIzaSyBTP7VWvdJrAXgf965iz3BsL7a19UmAMLM";

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

    // Combine all data
    const fetchedData = [...youtubeData, ...spotifyData];

    // Display results
    await displayResults(fetchedData);  // Make sure to await this if displayResults is async

    // If the active theme is 'albumart', then update the theme colors
    if (activeTheme === 'albumart' && spotifyData.length > 0) {
        const albumArtUrl = spotifyData[0].albumArt;  // Assume the first Spotify result contains the albumArt
        try {
            const color = await getMostCommonColor(albumArtUrl);  // Replace with your actual function to get the most common color
            console.log("Setting --album-art-color to:", color);  // Debugging log

            // Set the CSS variable for the album art theme
            document.documentElement.style.setProperty('--album-art-color', color);
        } catch (error) {
            console.error("Could not set album art color:", error);
        }
    }

});

// Listen for keyup events on the song input field
document.getElementById("songInput").addEventListener("keyup", function (event) {
    // Check if the Enter key was pressed
    if (event.keyCode === 13) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button click event
        document.getElementById("searchButton").click();
    }
});


// When the page loads, get the saved theme from Firestore
document.addEventListener('DOMContentLoaded', () => {
    getThemeFromFirestore();
});

// Asynchronous function to display results
async function displayResults(fetchedData) {
    // Initialize streamingLinks
    const streamingLinks = fetchedData.map(item => {
        return {
            link: item.link,
            serviceName: item.serviceName
        };
    });

    // Get the Spotify data
    const spotifyData = fetchedData.find(item => item.serviceName === 'Spotify');

    // Create or get the results container
    const resultsContainer = document.getElementById("results");

    // If Spotify data is found
    if (spotifyData) {
        // Reset CSS variables to default (or some base color) before setting new ones
        const defaultColor = 'rgb(255, 255, 255)'; // You can change this to your default color
        // Check if the active theme is 'albumart'
        if (activeTheme === 'albumart') {
            try {
                const baseColor = await getMostCommonColor(spotifyData.albumArt);
                console.log("Setting album art colors");

                // Extract the red, green, and blue components of the base color
                const [r, g, b] = baseColor.match(/\d+/g).map(Number);

                // Initialize lightness adjustment
                let lightnessAdjustment;

                // Check if the color is a variation of red
                if (r > g && r > b) {
                    lightnessAdjustment = 150; // Higher lightness for red variations
                } else {
                    lightnessAdjustment = 70; // Default lightness for other colors
                }

                // Generate shades
                const darkerColor = adjustColor(baseColor, -30);
                const lighterColor = adjustColor(baseColor, lightnessAdjustment);
                const textColor = adjustColor(baseColor, -100);
                const alternateColor = adjustColor(baseColor, 15);

                // Set the CSS variables
                document.documentElement.style.setProperty('--bg-color', lighterColor);  // Use lighterColor for background
                document.documentElement.style.setProperty('--primary-color', baseColor);
                document.documentElement.style.setProperty('--secondary-color', darkerColor);
                document.documentElement.style.setProperty('--text-color', textColor);
                document.documentElement.style.setProperty('--alt-bg-color', alternateColor);
                document.documentElement.style.setProperty('--header-text-color', textColor);
                document.documentElement.style.setProperty('--button-color', baseColor);
                document.documentElement.style.setProperty('--button-hover-color', lighterColor);
                document.documentElement.style.setProperty('--input-border-color', darkerColor);
                document.documentElement.style.setProperty('--input-bg-color', alternateColor);
                document.documentElement.style.setProperty('--results-button-color', baseColor);
                document.documentElement.style.setProperty('--results-button-hover-color', lighterColor);

            } catch (error) {
                console.error("Could not set album art color:", error);
            }
        }

        // Create an img element for album art
        const img = document.createElement("img");
        img.src = spotifyData.albumArt;
        img.style.borderRadius = "50%";
        img.width = 150;

        // Create a Save to Dashboard link
        const saveLink = document.createElement("a");
        saveLink.href = "#";
        saveLink.className = "save-to-dashboard";
        saveLink.textContent = "Save To Dashboard";

        // Attach a click event listener to Save to Dashboard link
        saveLink.addEventListener('click', function () {
            const songInfo = {
                title: spotifyData.songName,
                artist: spotifyData.artist,
                album: spotifyData.album,
                albumArt: spotifyData.albumArt
            };
            saveSongToDashboard(songInfo, streamingLinks);
        });

        // Set the inner HTML for Spotify data
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

        // Append the Save to Dashboard link to results
        resultsContainer.appendChild(saveLink);
    }

    // Loop through the fetched data to create service buttons
    fetchedData.forEach(item => {
        // Create a button
        const button = document.createElement("button");
        button.className = "streaming-button";

        // Create image element for the button
        const buttonImg = document.createElement("img");
        buttonImg.className = "streaming-button-image";

        // Set image source based on the service name
        if (item.serviceName === 'Spotify') {
            buttonImg.src = 'images/streaming_images/Spotify/streaming_image.png';
        } else if (item.serviceName === 'YouTube') {
            buttonImg.src = 'images/streaming_images/Youtube/streaming_image.png';
        }

        // Set button onclick to open the service link
        button.onclick = () => window.open(item.link);

        // Append the image to the button
        button.appendChild(buttonImg);

        // Append the button to results container
        resultsContainer.appendChild(button);
    });

    // Reference to the results container

    if (spotifyData) {
        const songInfo = {
            title: spotifyData.songName,
            artist: spotifyData.artist,
            album: spotifyData.album,
            albumArt: spotifyData.albumArt
        };

        // Assuming you have a default layout for new results
        const defaultLayout = 'htmlLayout-default';

        // Generate HTML content based on the layout
        const htmlContent = await generateHtmlFromLayout(songInfo, streamingLinks, defaultLayout);

        // Insert the HTML into the DOM
        resultsContainer.innerHTML = htmlContent;
    }
}







///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////// Menu Section /////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////  Dashboard ///////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Function to update the Dashboard UI with saved songs
const updateDashboard = async () => {
    const dashboardContent = document.getElementById('dashboardContent');
    const savedSongs = await getSavedSongsFromDashboard();
    console.log('Fetched saved songs:', savedSongs);

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
            <!-- Added Dropdown Menu -->
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


// Function to create a URL slug
function createSlug(artist, title) {
    return encodeURIComponent(artist.toLowerCase().replace(/\s+/g, '-').replace(/,/g, '-')) + '-' +
        encodeURIComponent(title.toLowerCase().replace(/\s+/g, '-').replace(/,/g, '-'));
}


document.addEventListener('click', async function (event) {

    
    const closestSavedSong = event.target.closest('.saved-song');

    // Log for debugging
    console.log("Debug: Closest saved song element:", closestSavedSong);

    if (!closestSavedSong) {
        console.log("Debug: No closest saved song element found.");
        return;  // Exit if no closestSavedSong element is found
    }

    const songTitleElement = closestSavedSong.querySelector('.song-title');

    // Log for debugging
    console.log("Debug: Song title element:", songTitleElement);

    if (!songTitleElement) {
        console.log("Debug: No song title element found.");
        return;  // Exit if no songTitleElement is found
    }

    const songTitle = songTitleElement.innerText;

    // Log for debugging
    console.log("Debug: Song title:", songTitle);

    let songInfo = null;

    try {
        // Try to fetch songInfo
        songInfo = await getSongInfoFromFirestore(songTitle);

        // Debug: Log the value of songInfo here to check if it's populated
        console.log("Debug: Fetched songInfo inside try block:", songInfo);

    } catch (error) {
        // Log error for debugging
        console.error("Debug: Error fetching songInfo:", error);
        return;  // Exit if an error occurred
    }

    // Debug: Log the value of songInfo again here to ensure it's still populated
    console.log("Debug: Fetched songInfo after try-catch:", songInfo);

    if (event.target.matches('.songMenu-generate-link')) {
        if (!songInfo) {
            console.error("Could not fetch songInfo for song title:", songTitle);
            return;
        }

        // Create slug and fullUrl based on fetched songInfo
        const slug = createSlug(songInfo.artist, songInfo.title);
        const fullUrl = `https://sololink-accf3.web.app/${slug}/`;

        // Open the fullUrl in a new window or tab
        window.open(fullUrl, '_blank');
    }
});





// Main event listener for when the document is fully loaded
document.addEventListener('DOMContentLoaded', function () {

    // Get the menu and the mainPageLink and dashboardLink elements
    const menu = document.getElementById('menu');
    const mainPageLink = document.getElementById('mainPageLink');
    const dashboardLink = document.getElementById('dashboardLink');
    const menuButton = document.getElementById('menuIcon');  // Button to open the menu

    // Function to close the menu
    const closeMenu = () => {
        menu.classList.remove('open');  // Remove the 'open' class
    };

    // Function to open the menu
    const openMenu = () => {
        menu.classList.add('open');  // Add the 'open' class
    };

    // Add event listeners to close the menu when mainPageLink or dashboardLink is clicked
    mainPageLink.addEventListener('click', closeMenu);
    dashboardLink.addEventListener('click', closeMenu);

    // Add event listener to open the menu when menuIcon is clicked
    menuButton.addEventListener('click', openMenu);
});


// Function to toggle dashboard and main content visibility
document.addEventListener('DOMContentLoaded', (event) => {
    const dashboardLink = document.getElementById('dashboardLink');
    const mainPageLink = document.getElementById('mainPageLink');
    const dashboardContent = document.getElementById('dashboardContent');
    const mainContent = document.querySelector('.container');  // Assume the main content is within a container with the class "container"


    // Existing DOMContentLoaded Event
    document.addEventListener('DOMContentLoaded', (event) => {
        // Existing code

        mainPageLink.addEventListener('click', function () {
            // Clear previous results
            location.reload();

            // Existing code for toggling display
            dashboardContent.style.display = "none";
            mainContent.style.display = "block";
        });

        // Existing code
    });


    if (dashboardLink && mainPageLink && mainContent && dashboardContent) {
        dashboardLink.addEventListener('click', function () {
            mainContent.style.display = "none";
            dashboardContent.style.display = "block";
            updateDashboard();  // Update the dashboard
        });

        mainPageLink.addEventListener('click', function () {
            // Clear previous results
            location.reload();

            // Hide dashboard and show main content
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

        const albumArtUrl = "https://i.scdn.co/image/ab67616d0000b273e4a14f0aa6179e95809a691c";  // Replace this with the actual URL from your code
        try {
            const color = await getMostCommonColor(albumArtUrl);
            console.log("Setting --html-album-art-color to:", color); // Debugging log

            // Execute a script in the new window that sets the CSS variable
            const script = `
                document.documentElement.style.setProperty('--html-album-art-color', '${color}');
            `;
            newWindow.document.write('<script>' + script + '</script>');
        } catch (error) {
            console.error("Could not set button color:", error);
        }
    }
});


// Choose Layout Button

// Global variables to store the current songInfo and streamingLinks
let currentSongInfo = null;
let currentStreamingLinks = null;

// Function to set the current song info and streaming links
function setCurrentSongInfo(songInfo, streamingLinks) {
    currentSongInfo = songInfo;
    currentStreamingLinks = streamingLinks;
}

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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////// Saving Song //////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Show SoLoLink HTML
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////// Album Art Color Grabber ///////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////// Theme Code ///////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


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

