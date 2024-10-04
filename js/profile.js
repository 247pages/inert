import { db, storage } from './firebase-config.js';  
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-storage.js";  

document.getElementById('create-profile-btn').addEventListener('click', () => {
    const name = document.getElementById('real-name').value;
    const username = document.getElementById('username').value;
    const dpFile = document.getElementById('dp').files[0];

    if (dpFile && dpFile.size > 10 * 1024 * 1024) { // 10 MB size limit
        alert('File too large, please upload a file less than 10MB.');
        return;
    }

    const user = auth.currentUser;
    if (!user) {
        console.error('User is not authenticated');
        return;
    }

    const userDocRef = doc(db, 'users', user.uid); // Reference to the user's document
    const dpRef = ref(storage, `profile-pictures/${user.uid}`); // Reference to storage

    // Upload profile picture if file exists
    if (dpFile) {
        uploadBytes(dpRef, dpFile).then(snapshot => {
            console.log('Profile picture uploaded:', snapshot);
            return getDownloadURL(snapshot.ref);
        }).then(downloadURL => {
            // Save user profile in Firestore
            return setDoc(userDocRef, {
                realName: name,
                username: username,
                profilePicture: downloadURL
            });
        }).then(() => {
            console.log('Profile created successfully!');
            showContent(); // Show main content after profile creation
        }).catch(error => {
            console.error('Error creating profile:', error);
        });
    } else {
        // If no DP is uploaded, just set name and username
        setDoc(userDocRef, {
            realName: name,
            username: username,
            profilePicture: null
        }).then(() => {
            console.log('Profile created successfully without a DP!');
            showContent(); // Show main content after profile creation
        }).catch(error => {
            console.error('Error creating profile:', error);
        });
    }
});
