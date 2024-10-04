import { db, storage } from './firebase-config.js';
import { doc, setDoc, getDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-storage.js";

// DOM Elements
const createPageBtn = document.getElementById('create-page-btn');
const searchPageBtn = document.getElementById('search-page-btn');
const createPageSection = document.getElementById('create-page-section');
const searchPageSection = document.getElementById('search-page-section');
const pageContentSection = document.getElementById('page-content-section');
const createPageForm = document.getElementById('create-page-form');
const searchPageForm = document.getElementById('search-page-form');
const postContentForm = document.getElementById('post-content-form');

// Show the main options after authentication
document.getElementById('main-options').style.display = 'block';

// Handle Create Page Button
createPageBtn.addEventListener('click', () => {
  createPageSection.style.display = 'block';
  searchPageSection.style.display = 'none';
  pageContentSection.style.display = 'none';
});

// Handle Search Page Button
searchPageBtn.addEventListener('click', () => {
  searchPageSection.style.display = 'block';
  createPageSection.style.display = 'none';
  pageContentSection.style.display = 'none';
});

// Create a new page
createPageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pageName = document.getElementById('page-name').value;
  const pagePassword = document.getElementById('page-password').value;

  const pageDocRef = doc(db, "pages", pageName);
  const pageDoc = await getDoc(pageDocRef);

  if (pageDoc.exists()) {
    alert("Page name already taken, please choose a different name.");
  } else {
    await setDoc(pageDocRef, {
      password: pagePassword,
      posts: []
    });
    alert("Page created successfully!");
  }
});

// Search for an existing page
searchPageForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const pageName = document.getElementById('search-page-name').value;
  const pagePassword = document.getElementById('search-page-password').value;

  const pageDocRef = doc(db, "pages", pageName);
  const pageDoc = await getDoc(pageDocRef);

  if (pageDoc.exists()) {
    const pageData = pageDoc.data();
    if (pageData.password === pagePassword) {
      // Load the page content
      document.getElementById('current-page-name').textContent = pageName;
      loadPosts(pageName);
    } else {
      alert("Incorrect password. Please try again.");
    }
  } else {
    alert("Page not found.");
  }
});

// Load and display posts from a page
async function loadPosts(pageName) {
  const postsDiv = document.getElementById('posts');
  postsDiv.innerHTML = ""; // Clear existing posts

  const pageDocRef = doc(db, "pages", pageName);
  const pageDoc = await getDoc(pageDocRef);
  const pageData = pageDoc.data();

  if (pageData && pageData.posts) {
    pageData.posts.forEach(post => {
      const postElement = document.createElement('div');
      postElement.innerHTML = `<p>${post.message}</p>`;
      if (post.imageUrl) {
        const img = document.createElement('img');
        img.src = post.imageUrl;
        postElement.appendChild(img);
      }
      postsDiv.appendChild(postElement);
    });
    pageContentSection.style.display = 'block';
  }
}

// Post content to a page
postContentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const message = document.getElementById('post-message').value;
  const imageFile = document.getElementById('post-image').files[0];
  const pageName = document.getElementById('current-page-name').textContent;

  let imageUrl = null;
  if (imageFile) {
    const imageRef = ref(storage, `page_images/${pageName}/${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    imageUrl = await getDownloadURL(imageRef);
  }

  const pageDocRef = doc(db, "pages", pageName);
  const pageDoc = await getDoc(pageDocRef);
  const pageData = pageDoc.data();

  if (pageData) {
    const newPost = { message, imageUrl };
    const updatedPosts = [...pageData.posts, newPost];

    await setDoc(pageDocRef, { posts: updatedPosts }, { merge: true });
    loadPosts(pageName); // Reload the posts
  }
});
