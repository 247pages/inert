// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCTkFhWjG_P-SCGUZJPa2mHhSGpoCfCPQ0",
    authDomain: "vwolf-ca64b.firebaseapp.com",
    projectId: "vwolf-ca64b",
    storageBucket: "vwolf-ca64b.appspot.com",
    messagingSenderId: "224941104840",
    appId: "1:224941104840:web:13f4573a43e2a2ebc74ffd",
    measurementId: "G-0P68HWFK39"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const provider = new GoogleAuthProvider();

// Function to handle Google Sign-In
window.signInWithGoogle = async function() {
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Store user information in localStorage
        localStorage.setItem('userId', user.uid);
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('isAuthenticated', 'true');

        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // New user, show the sign-up container
            document.getElementById('sign-in-container').classList.add('hidden');
            document.getElementById('sign-up-container').classList.remove('hidden');
        } else {
            // Existing user, redirect to the feed page
            window.location.href = '/feed.html';
        }
    } catch (error) {
        console.error("Error signing in:", error);
        
        // Handle specific error codes if necessary
        if (error.code === 'auth/popup-closed-by-user') {
            showErrorPopup("Login popup was closed. Please try again.");
        } else {
            showErrorPopup("Error signing in: " + error.message);
        }
    }
};

// Function to create a new user
// Function to create a new user
window.createUser = async function() {
    const username = document.getElementById('username').value.trim();
    const name = document.getElementById('name').value.trim();
    const userId = localStorage.getItem('userId');
    const email = localStorage.getItem('userEmail');

    // Character length limits
    const usernameMaxLength = 12; // Example: limit username to 15 characters
    const nameMaxLength = 25; // Example: limit name to 30 characters

    if (!username || !name) {
        showErrorPopup('Please enter both username and name.');
        return;
    }

    if (username.length > usernameMaxLength) {
        showErrorPopup(`Username cannot exceed ${usernameMaxLength} characters.`);
        return;
    }

    if (name.length > nameMaxLength) {
        showErrorPopup(`Name cannot exceed ${nameMaxLength} characters.`);
        return;
    }

    if (!validateUsername(username)) {
        showErrorPopup('Invalid username. Must be lowercase and can only contain letters, numbers, "-", and "_".');
        return;
    }

    try {
        // Check if the username is already taken
        const usernameDocRef = doc(db, "usernames", username);
        const usernameDoc = await getDoc(usernameDocRef);

        if (usernameDoc.exists()) {
            showErrorPopup('Username already taken. Please choose another one.');
            return;
        }

        // Save user data in Firestore
        const userDocRef = doc(db, "users", userId);
        await setDoc(userDocRef, { username, name, email });

        // Save the username-to-userId mapping
        await setDoc(usernameDocRef, { userId });

        // Redirect to the feed page
        window.location.href = '/feed.html';
    } catch (error) {
        console.error("Error creating user:", error);
        showErrorPopup("Error creating user: " + error.message);
    }
};

// Function to validate the username format
function validateUsername(username) {
    const usernameRegex = /^[a-z0-9_-]+$/;
    return usernameRegex.test(username);
}

// Function to sign out the user
window.signOutUser = async function() {
    try {
        await signOut(auth);
        localStorage.removeItem('userId');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('isAuthenticated');
        window.location.href = '/'; // Redirect to home page or sign-in page
    } catch (error) {
        console.error("Error signing out:", error);
        showErrorPopup("Error signing out: " + error.message);
    }
};

// Check for an existing session on page load
document.addEventListener('DOMContentLoaded', () => {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (isAuthenticated === 'true') {
        window.location.href = 'https://247pages.github.io/Vwolf/feed.html'; // Redirect to the feed page
    }
});

// Function to show the error popup
function showErrorPopup(message) {
    const errorPopup = document.createElement("div");
    errorPopup.className = "error-popup";
    errorPopup.textContent = message;
    
    document.body.appendChild(errorPopup);

    setTimeout(() => {
        errorPopup.style.opacity = "1";
    }, 10);

    setTimeout(() => {
        errorPopup.style.opacity = "0";
        setTimeout(() => {
            document.body.removeChild(errorPopup);
        }, 500);
    }, 3000);
}

