// Import the Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.15.0/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    onAuthStateChanged,
    signInWithPopup
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/9.15.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAKsWckiVIFLOYrskq1R0RSxdQ3k6bUnr8",
    authDomain: "sololink-accf3.firebaseapp.com",
    projectId: "sololink-accf3",
    storageBucket: "sololink-accf3.appspot.com",
    messagingSenderId: "761837354129",
    appId: "1:761837354129:web:fb82991a7b5875c5381330",
    measurementId: "G-KWJ0QNKLHD"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize Firebase auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);
// Sign up with email and password
const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log("User signed up:", userCredential);
        })
        .catch(error => {
            console.error("Error signing up:", error);
        });
}

// Log in with email and password  
const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
            console.log("User logged in:", userCredential);
        })
        .catch(error => {
            console.error("Error logging in:", error);
        });
}

// Google sign in  
const googleSignIn = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider)
        .then(result => {
            // Get HTML elements to populate
            const profilePicture = document.getElementById('profilePicture');
            const userName = document.getElementById('userName');
            const userEmail = document.getElementById('userEmail');
            const logoutBtn = document.getElementById('logoutBtn');

            // Set their values
            profilePicture.src = result.user.photoURL;
            userName.textContent = result.user.displayName;
            userEmail.textContent = result.user.email;

            // Show them
            profilePicture.style.display = "block";
            userName.style.display = "block";
            userEmail.style.display = "block";
            logoutBtn.style.display = "block";
        })
        .catch(error => {
            console.error("Error signing in with Google:", error);
        });
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    const loginPopup = document.getElementById('loginPopup');
    const signupPopup = document.getElementById('signupPopup');
    if (user) {
        // User is signed in
        const profilePicture = document.getElementById('profilePicture');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const logoutBtn = document.getElementById('logoutBtn');

        // Set their values
        profilePicture.src = user.photoURL;
        userName.textContent = user.displayName;
        userEmail.textContent = user.email;

        // Show them
        profilePicture.style.display = "block";
        userName.style.display = "block";
        userEmail.style.display = "block";
        logoutBtn.style.display = "block";

        // Hide login and signup popup
        loginPopup.classList.add('hidden');
        signupPopup.classList.add('hidden');
    } else {
        // User is signed out
        document.getElementById('profilePicture').style.display = "none";
        document.getElementById('userName').style.display = "none";
        document.getElementById('userEmail').style.display = "none";
        document.getElementById('logoutBtn').style.display = "none";
    }
});


// Logout Function
const logout = () => {
    auth.signOut().then(() => {
        console.log("User signed out");
        // Hide profile info
        document.getElementById('profilePicture').style.display = "none";
        document.getElementById('userName').style.display = "none";
        document.getElementById('userEmail').style.display = "none";
        document.getElementById('logoutBtn').style.display = "none";
    });
}

// Add this code at the end of your JavaScript file
document.addEventListener("DOMContentLoaded", function () {
    // Get the logout button by its ID
    const logoutButton = document.getElementById("logoutBtn");

    // Attach the logout function to the click event of the logout button
    if (logoutButton) {
        logoutButton.addEventListener("click", logout);
    }
});

// Function to save song search results to Firestore
const saveToDashboard = async (userId, songData) => {
    const docRef = doc(db, 'users', userId, 'dashboard', songData.id);
    await setDoc(docRef, songData);
};

// Function to get saved songs from Firestore
const getDashboard = async (userId) => {
    const q = query(collection(db, 'users', userId, 'dashboard'));
    const querySnapshot = await getDocs(q);
    let savedSongs = [];
    querySnapshot.forEach((doc) => {
        savedSongs.push(doc.data());
    });
    return savedSongs;
};

// Exported function to listen for auth state changes
const listenForAuthChanges = (callback) => {
    onAuthStateChanged(auth, callback);
};

// Export functions
export {
    signup,
    login,
    googleSignIn,
    logout,
    saveToDashboard,
    getDashboard,
    listenForAuthChanges,
    auth
};