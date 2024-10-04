// Import necessary Firebase services
import { auth, db, storage } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-storage.js";

// DOM Elements
const contentDiv = document.getElementById('content');
const authSection = document.getElementById('auth-section');
const profileCreation = document.getElementById('profile-creation');
const loadingAnimation = document.getElementById('loading-animation'); // Loading animation
const usernameSpan = document.getElementById('username');
const realnameSpan = document.getElementById('realname');
const bioSpan = document.getElementById('bio'); 
const profilePic = document.getElementById('profile-pic');
const loginBtn = document.getElementById('login-btn');
const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username-input');
const realnameInput = document.getElementById('realname-input');
const profilePicInput = document.getElementById('profile-pic-input');
const bioInput = document.getElementById('bio-input');
const editProfileBtn = document.getElementById('edit-profile-btn');
const editProfileForm = document.getElementById('edit-profile-form');
const editRealnameInput = document.getElementById('edit-realname-input');
const editBioInput = document.getElementById('edit-bio-input');
const editProfilePicInput = document.getElementById('edit-profile-pic-input');

// Show loading animation
loadingAnimation.style.display = 'flex';

// Check if the user is logged in
onAuthStateChanged(auth, async (user) => {
    loadingAnimation.style.display = 'none'; // Hide loading animation

    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            usernameSpan.textContent = "@" + userData.username;  // Added "@" prefix
            realnameSpan.textContent = userData.realName;
            bioSpan.textContent = userData.bio || 'No bio provided';
            profilePic.src = userData.profilePicture || 'default-profile-pic.png';
            showContent();
        } else {
            showProfileCreation(user);
        }
    } else {
        showAuthSection();
    }
});

// Show content section
function showContent() {
    contentDiv.style.display = 'block';
    authSection.style.display = 'none';
    profileCreation.style.display = 'none';
}

// Show auth section
function showAuthSection() {
    contentDiv.style.display = 'none';
    authSection.style.display = 'block';
    profileCreation.style.display = 'none';
}

// Show profile creation form
function showProfileCreation(user) {
    contentDiv.style.display = 'none';
    authSection.style.display = 'none';
    profileCreation.style.display = 'block';

    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = usernameInput.value;
        const realName = realnameInput.value;
        const bio = bioInput.value || '';
        const profilePictureFile = profilePicInput.files[0];

        try {
            let profilePicUrl = 'default-profile-pic.png';

            if (profilePictureFile && profilePictureFile.size <= 10 * 1024 * 1024) { // Ensure file size is ≤ 10 MB
                const storageRef = ref(storage, `profile_pictures/${user.uid}`);
                await uploadBytes(storageRef, profilePictureFile);
                profilePicUrl = await getDownloadURL(storageRef);
            } else {
                alert("Profile picture must be less than 10 MB.");
                return; // Exit if the file is too large
            }

            const userDocRef = doc(db, "users", user.uid);
            await setDoc(userDocRef, {
                username: username,
                realName: realName,
                bio: bio,
                profilePicture: profilePicUrl
            });

            // Redirect to profile view
            window.location.reload();
        } catch (error) {
            console.error("Error creating profile: ", error);
        }
    });

    // Profile Picture Preview
    profilePicInput.addEventListener('change', () => {
        const file = profilePicInput.files[0];
        if (file && file.size <= 10 * 1024 * 1024) { // Ensure file size is ≤ 10 MB
            const reader = new FileReader();
            reader.onload = (e) => {
                profilePic.src = e.target.result; // Set the preview
            };
            reader.readAsDataURL(file);
        } else {
            alert("Profile picture must be less than 10 MB.");
            profilePicInput.value = ''; // Clear the input
        }
    });
}

// Edit Profile Functionality
editProfileBtn.addEventListener('click', () => {
    document.getElementById('edit-profile').style.display = 'block';
    editRealnameInput.value = realnameSpan.textContent;
    editBioInput.value = bioSpan.textContent === 'No bio provided' ? '' : bioSpan.textContent;
});

// Update Profile
editProfileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const user = auth.currentUser;
    if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const newRealName = editRealnameInput.value;
        const newBio = editBioInput.value;
        const newProfilePicFile = editProfilePicInput.files[0];

        try {
            let newProfilePicUrl = profilePic.src;

            if (newProfilePicFile && newProfilePicFile.size <= 10 * 1024 * 1024) { // Ensure file size is ≤ 10 MB
                const storageRef = ref(storage, `profile_pictures/${user.uid}`);
                await uploadBytes(storageRef, newProfilePicFile);
                newProfilePicUrl = await getDownloadURL(storageRef);
            }

            await updateDoc(userDocRef, {
                realName: newRealName,
                bio: newBio,
                profilePicture: newProfilePicUrl
            });

            // Update the profile view
            realnameSpan.textContent = newRealName;
            bioSpan.textContent = newBio;
            profilePic.src = newProfilePicUrl;

            alert("Profile updated successfully!");
            document.getElementById('edit-profile').style.display = 'none'; // Hide edit profile section
        } catch (error) {
            console.error("Error updating profile: ", error);
        }
    }
});

// Login with Google
loginBtn.addEventListener('click', async () => {
    const provider = new GoogleAuthProvider();
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Error logging in: ", error);
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await signOut(auth);
        window.location.reload(); // Refresh the page
    } catch (error) {
        console.error("Error logging out: ", error);
    }
});
// Show loading animation until auth state is confirmed
document.addEventListener("DOMContentLoaded", () => {
    const loadingAnimation = document.getElementById("loading-animation");
    const profileContainer = document.querySelector(".profile-container");
    const profileCreation = document.getElementById("profile-creation");

    // Simulating the auth state check with a timeout
    setTimeout(() => {
        // Replace this with your actual auth state check
        const isAuthenticated = true; // Change this to your auth logic

        loadingAnimation.style.display = "none"; // Hide loading animation
        if (isAuthenticated) {
            profileContainer.style.display = "flex"; // Show profile if authenticated
            // Populate user data here if needed
        } else {
            profileCreation.style.display = "block"; // Show profile creation form if not authenticated
        }
    }, 2000); // Simulate 2 seconds loading time
});

// Additional logic for handling file input and preview can go here...









// Menu Toggle
const menuIcon = document.getElementById('menu-icon');
const navLinks = document.getElementById('nav-links');

menuIcon.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});
