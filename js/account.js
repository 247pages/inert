// Import necessary Firebase services
import { auth, db, storage } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-storage.js";

// DOM Elements
const contentDiv = document.getElementById('content');
const authSection = document.getElementById('auth-section');
const profileCreation = document.getElementById('profile-creation');
const usernameSpan = document.getElementById('username');
const realnameSpan = document.getElementById('realname');
const bioSpan = document.getElementById('bio'); // Add span for bio
const profilePic = document.getElementById('profile-pic');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const profileForm = document.getElementById('profile-form');
const usernameInput = document.getElementById('username-input');
const realnameInput = document.getElementById('realname-input');
const profilePicInput = document.getElementById('profile-pic-input');
const bioInput = document.getElementById('bio-input');
const updateProfileBtn = document.getElementById('update-profile-btn');

// Check if the user is logged in
onAuthStateChanged(auth, async (user) => {
  if (user) {
    // User is logged in, check if profile is created
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      // Profile exists, load the content
      const userData = userDoc.data();
      usernameSpan.textContent = userData.username;
      realnameSpan.textContent = userData.realName;
      bioSpan.textContent = userData.bio || 'No bio provided'; // Display bio or a default message
      profilePic.src = userData.profilePicture || 'default-profile-pic.png';
      showContent();
    } else {
      // Profile doesn't exist, show the profile creation form
      showProfileCreation(user);
    }
  } else {
    // User is not logged in, show the login section
    showAuthSection();
  }
});

// Function to show the content section
function showContent() {
  contentDiv.style.display = 'block';
  authSection.style.display = 'none';
  profileCreation.style.display = 'none';
}

// Function to show the login section
function showAuthSection() {
  contentDiv.style.display = 'none';
  authSection.style.display = 'block';
  profileCreation.style.display = 'none';
}

// Function to show the profile creation form
function showProfileCreation(user) {
  contentDiv.style.display = 'none';
  authSection.style.display = 'none';
  profileCreation.style.display = 'block';

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = usernameInput.value;
    const realName = realnameInput.value;
    const bio = bioInput.value || ''; // Get bio input value
    const profilePictureFile = profilePicInput.files[0];

    try {
      let profilePicUrl = 'default-profile-pic.png'; // Default image

      if (profilePictureFile && profilePictureFile.size <= 10 * 1024 * 1024) { // Check if file is less than 10MB
        // Upload profile picture to Firebase Storage
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(storageRef, profilePictureFile);
        profilePicUrl = await getDownloadURL(storageRef);
      }

      // Save profile data in Firestore, including bio
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        username: username,
        realName: realName,
        bio: bio, // Store the bio in Firestore
        profilePicture: profilePicUrl
      });

      // Redirect to the feed page instead of reloading
      window.location.href = 'feed.html'; // Change this to your feed page URL
    } catch (error) {
      console.error("Error uploading profile picture or creating profile: ", error);
    }
  });
}

// Profile Update Functionality
updateProfileBtn.addEventListener('click', async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  if (user) {
    const userDocRef = doc(db, "users", user.uid);
    const newRealName = realnameInput.value;
    const newBio = bioInput.value;
    const newProfilePicFile = profilePicInput.files[0];

    try {
      let newProfilePicUrl = profilePic.src;

      if (newProfilePicFile && newProfilePicFile.size <= 10 * 1024 * 1024) {
        // Upload the new profile picture
        const storageRef = ref(storage, `profile_pictures/${user.uid}`);
        await uploadBytes(storageRef, newProfilePicFile);
        newProfilePicUrl = await getDownloadURL(storageRef);
      }

      // Update Firestore profile data
      await updateDoc(userDocRef, {
        realName: newRealName || realnameSpan.textContent,
        bio: newBio || bioInput.value,
        profilePicture: newProfilePicUrl
      });

      // Refresh the profile data
      realnameSpan.textContent = newRealName;
      bioSpan.textContent = newBio; // Update bio on profile
      profilePic.src = newProfilePicUrl;

      alert("Profile updated successfully!");
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
logoutBtn.addEventListener('click', async () => {
  try {
    await signOut(auth);
    location.reload(); // Refresh the page
  } catch (error) {
    console.error("Error logging out: ", error);
  }
});
