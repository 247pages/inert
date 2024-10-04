// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAC2a5SqnPLDFp-sUC7qZVCtihzoG6Wb7o",
  authDomain: "inert-app.firebaseapp.com",
  projectId: "inert-app",
  storageBucket: "inert-app.appspot.com",
  messagingSenderId: "760213891256",
  appId: "1:760213891256:web:468215fbd38b9f499b6c4d",
  measurementId: "G-7PKDN1NTY7"
};
// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);

// Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const provider = new firebase.auth.GoogleAuthProvider();

// HTML elements
const signInBtn = document.getElementById('signInBtn');
const signOutBtn = document.getElementById('signOutBtn');
const profileForm = document.getElementById('profileForm');
const userProfile = document.getElementById('userProfile');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profilePicInput = document.getElementById('profilePic');
const currentProfilePic = document.getElementById('currentProfilePic');

// Sign In with Google
signInBtn.addEventListener('click', async () => {
    try {
        const result = await auth.signInWithPopup(provider);
        const user = result.user;
        
        // Check if the user exists in Firestore
        const userDocRef = db.collection("users").doc(user.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            // New user: Show account creation form
            showProfileForm(user);
        } else {
            // Existing user: Load profile
            loadUserProfile(userDoc.data());
        }
    } catch (error) {
        console.error("Error during sign-in:", error);
    }
});

// Sign Out
signOutBtn.addEventListener('click', async () => {
    await auth.signOut();
    alert('Signed out!');
    location.reload();
});

// Save Profile for new users or editing existing profiles
saveProfileBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    const userId = document.getElementById('userId').value;
    const userName = document.getElementById('userName').value;
    const bio = document.getElementById('bio').value;
    const profilePicFile = profilePicInput.files[0];

    try {
        // Upload profile picture if selected
        let profilePicURL = currentProfilePic.src;
        if (profilePicFile) {
            const profilePicRef = storage.ref(`profilePictures/${user.uid}`);
            await profilePicRef.put(profilePicFile);
            profilePicURL = await profilePicRef.getDownloadURL();
        }

        // Save profile data in Firestore
        await db.collection("users").doc(user.uid).set({
            userId: userId,
            name: userName,
            bio: bio,
            profilePic: profilePicURL,
            email: user.email,
        }, { merge: true });

        alert('Profile saved successfully!');
        loadUserProfile({ userId: userId, name: userName, bio: bio, profilePic: profilePicURL });
    } catch (error) {
        console.error("Error saving profile:", error);
    }
});

// On Auth State Change
auth.onAuthStateChanged(async (user) => {
    if (user) {
        signInBtn.style.display = 'none';
        signOutBtn.style.display = 'block';

        const userDocRef = db.collection("users").doc(user.uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists()) {
            loadUserProfile(userDoc.data());
        } else {
            showProfileForm(user);
        }
    } else {
        signInBtn.style.display = 'block';
        signOutBtn.style.display = 'none';
        profileForm.style.display = 'none';
        userProfile.style.display = 'none';
    }
});

function showProfileForm(user) {
    document.getElementById('userEmail').innerText = user.email;
    profileForm.style.display = 'block';
    userProfile.style.display = 'none';
}

function loadUserProfile(userData) {
    profileForm.style.display = 'none';
    userProfile.style.display = 'block';

    document.getElementById('userProfilePic').src = userData.profilePic;
    document.getElementById('userNameDisplay').innerText = userData.name;
    document.getElementById('userBioDisplay').innerText = userData.bio;

    // Set current profile data for editing
    document.getElementById('userId').value = userData.userId || '';
    document.getElementById('userName').value = userData.name || '';
    document.getElementById('bio').value = userData.bio || '';
    currentProfilePic.src = userData.profilePic || '';
}
