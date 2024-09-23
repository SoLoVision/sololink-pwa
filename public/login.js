import { googleSignIn, listenForAuthChanges, login, signup, auth } from './firebase.js';

// Variable to hold the current user
let currentUser = null;

// Function to check if a click event is outside of the given elements
const isClickOutside = (event, elements) => {
    for (let element of elements) {
        if (element.contains(event.target)) {
            return false;
        }
    }
    return true;
};


// Function to update currentUser variable
const updateCurrentUser = (user) => {
    currentUser = user;
    // Add more code here if you want to do something when the user logs in or out
};

// Listen for auth state changes
listenForAuthChanges(updateCurrentUser);

// Main event listener for when the document is fully loaded
auth.onAuthStateChanged(user => {
    const loginButton = document.getElementById("loginBtn");  // Changed "loginButton" to "loginBtn"
    if (loginButton) {
        if (user) {
            loginButton.style.display = "none";
        } else {
            loginButton.style.display = "block";
        }
    } else {
        console.log("Login button element not found");
    }
});



// Main event listener for when the document is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    const loginBtn = document.getElementById('loginBtn');
    const loginPopup = document.getElementById('loginPopup');
    const signupPopup = document.getElementById('signupPopup');
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToLogin = document.getElementById('switchToLogin');

    // Flag to check if login or signup popup is active
    let isPopupActive = false;

    loginBtn.addEventListener('click', () => {
        loginPopup.classList.remove('hidden');
        isPopupActive = true;  // Set flag to true
    });

    switchToSignup.addEventListener('click', () => {
        loginPopup.classList.add('hidden');
        signupPopup.classList.remove('hidden');
    });

    switchToLogin.addEventListener('click', () => {
        signupPopup.classList.add('hidden');
        loginPopup.classList.remove('hidden');
    });

    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        login(email, password);
    });

    const signupForm = document.getElementById('signupForm');
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        signup(email, password);
    });

    const googleSignInBtn = document.getElementById('googleSignIn');
    googleSignInBtn.addEventListener('click', () => {
        googleSignIn();
    });

    const googleSignUpBtn = document.getElementById('googleSignUp');
    googleSignUpBtn.addEventListener('click', () => {
        googleSignIn();
    });

    document.addEventListener('click', (event) => {
        const elementsToCheck = [
            document.getElementById('loginPopup'),
            document.getElementById('signupPopup'),
            document.getElementById('menu'),
            document.getElementById('loginBtn')
        ];

        if (isPopupActive && isClickOutside(event, elementsToCheck)) {
            loginPopup.classList.add('hidden');
            signupPopup.classList.add('hidden');
            isPopupActive = false;  // Reset flag
        }
    });
    
});



export { currentUser };  