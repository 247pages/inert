import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

// Select elements
const createPageForm = document.getElementById('createPageForm');
const visitPageForm = document.getElementById('visitPageForm');
const postContentForm = document.getElementById('postContentForm');
const profilePicInput = document.getElementById('profilePicInput');
const postsContainer = document.getElementById('postsContainer');

// Tab functionality
const optionsSection = document.getElementById('options-section');
const createPageSection = document.getElementById('create-page-section');
const visitPageSection = document.getElementById('visit-page-section');
const pageContentSection = document.getElementById('page-content-section');

document.getElementById('createPageBtn').addEventListener('click', () => {
  optionsSection.style.display = 'none';
  createPageSection.classList.add('active');
});

document.getElementById('openPageBtn').addEventListener('click', () => {
  optionsSection.style.display = 'none';
  visitPageSection.classList.add('active');
});

// Function to create a new page
createPageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const uniqueName = document.getElementById('uniqueName').value;
  const password = document.getElementById('password').value;
  const pageName = document.getElementById('pageName').value;

  try {
    const pageDoc = await getDoc(doc(db, 'pages', uniqueName));
    if (pageDoc.exists()) {
      alert('Page name already exists. Please choose a different name.');
      return;
    }

    await setDoc(doc(db, 'pages', uniqueName), {
      uniqueName,
      password,
      pageName,
      bio: 'This is a new page bio',
      profilePic: '',
      posts: []
    });
    alert('Page created successfully!');
    openPage(uniqueName, password); // Open the page immediately after creation
  } catch (error) {
    console.error('Error creating page:', error);
    alert('Failed to create page. Please try again.');
  }
});

// Function to visit an existing page
visitPageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const uniqueName = document.getElementById('visitUniqueName').value;
  const password = document.getElementById('visitPassword').value;

  try {
    await openPage(uniqueName, password);
  } catch (error) {
    console.error('Error visiting page:', error);
    alert('Failed to visit page. Please try again.');
  }
});

// Open a page and display its content
async function openPage(uniqueName, password) {
  try {
    const pageDoc = await getDoc(doc(db, 'pages', uniqueName));
    if (pageDoc.exists()) {
      const pageData = pageDoc.data();
      if (pageData.password === password) {
        optionsSection.style.display = 'none'; // Hide options section
        createPageSection.classList.remove('active');
        visitPageSection.classList.remove('active');
        pageContentSection.classList.add('active'); // Show page content section

        document.getElementById('pageNameDisplay').innerText = pageData.pageName;
        document.getElementById('pageBio').innerText = pageData.bio;
        document.getElementById('profilePicDisplay').src = pageData.profilePic || 'default-profile-pic.jpg';
        loadPosts(pageData.posts);
      } else {
        alert('Incorrect password');
      }
    } else {
      alert('Page does not exist');
    }
  } catch (error) {
    console.error('Error opening page:', error);
    alert('Failed to open page. Please try again.');
  }
}

// Load posts into the page
function loadPosts(posts) {
  postsContainer.innerHTML = ''; // Clear previous posts
  posts.forEach(post => {
    const postElement = document.createElement('div');
    postElement.innerText = post;
    postsContainer.appendChild(postElement);
  });
}

// Function to post content (text-based micro blogs)
postContentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const uniqueName = document.getElementById('visitUniqueName').value;
  const newPostText = document.getElementById('newPostText').value;

  try {
    const pageRef = doc(db, 'pages', uniqueName);
    // Use the correct arrayUnion function
    await updateDoc(pageRef, {
      posts: arrayUnion(newPostText)
    });
    loadPosts((await getDoc(pageRef)).data().posts); // Refresh posts
    document.getElementById('newPostText').value = ''; // Clear the input
  } catch (error) {
    console.error('Error posting content:', error);
    alert('Failed to post content. Please try again.');
  }
});

// Function to upload a profile picture
profilePicInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const uniqueName = document.getElementById('visitUniqueName').value;

  if (!file || !file.type.startsWith('image/')) {
    alert('Please select an image file.');
    return;
  }

  try {
    const storageRef = ref(storage, `profilePics/${uniqueName}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Update the page document with the new profile picture URL
    await updateDoc(doc(db, 'pages', uniqueName), { profilePic: downloadURL });
    document.getElementById('profilePicDisplay').src = downloadURL; // Update the displayed profile picture
    alert('Profile picture updated successfully!');
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    alert('Failed to upload profile picture. Please try again.');
  }
});
