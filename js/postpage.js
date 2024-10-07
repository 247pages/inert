import { auth, db } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";

// DOM Elements
const authSection = document.getElementById('auth-section');
const postsSection = document.getElementById('posts-section');
const postsContainer = document.getElementById('posts-container');

// Popup Alert Elements
const popupAlert = document.getElementById('popup-alert');
const popupTitle = document.getElementById('popup-title');
const popupMessage = document.getElementById('popup-message');
const popupClose = document.getElementById('popup-close');
const popupConfirm = document.getElementById('popup-confirm');

// Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    loadPosts();
    showPostsSection();
  } else {
    showAuthSection();
  }
});

// Show auth section
function showAuthSection() {
  authSection.style.display = 'block';
  postsSection.style.display = 'none';
}

// Show posts section
function showPostsSection() {
  authSection.style.display = 'none';
  postsSection.style.display = 'block';
}

// Google Login
document.getElementById('login-btn').addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
  await signOut(auth);
  window.location.reload();
});

// Load Posts
function loadPosts() {
  onSnapshot(collection(db, "posts"), (snapshot) => {
    postsContainer.innerHTML = '';  // Clear posts
    snapshot.forEach((doc) => {
      const post = doc.data();
      const postElement = createPostElement({
        ...post,
        imageUrls: post.imageUrls || [] // Ensure imageUrls is an array
      }, doc.id);
      postsContainer.appendChild(postElement);

      const deleteButton = postElement.querySelector('.delete-post-btn');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => handleDeletePost(doc.id));
      }

      const reportButton = postElement.querySelector('.report-post-btn');
      if (reportButton) {
        reportButton.addEventListener('click', () => handleReportPost(doc.id));
      }

      // Add event listener for dot navigation
      const dots = postElement.querySelectorAll('.dot');
      dots.forEach((dot, index) => {
        dot.addEventListener('click', () => changeSlide(doc.id, index));
      });
    });

    // Apply scroll reveal animation to posts
    scrollReveal();
  });
}

// Handle Post Deletion
async function handleDeletePost(postId) {
  showPopup("Confirm Deletion", "Are you sure you want to delete this post?", async () => {
    await deleteDoc(doc(db, "posts", postId));
    showPopup("Success", "Post deleted successfully.");
  });
}

// Handle Post Reporting
async function handleReportPost(postId) {
  showPopup("Confirm Reporting", "Are you sure you want to report this post?", async () => {
    const postRef = doc(db, "posts", postId);
    await updateDoc(postRef, { reported: true });
    showPopup("Success", "Post reported successfully.");
  });
}

// Show Popup Alert
function showPopup(title, message, onConfirm) {
  popupTitle.textContent = title;
  popupMessage.textContent = message;
  popupAlert.style.display = 'block';

  // Confirm action
  popupConfirm.onclick = () => {
    onConfirm();
    popupAlert.style.display = 'none'; // Close popup
  };

  // Close popup
  popupClose.onclick = () => {
    popupAlert.style.display = 'none';
  };
}

// Smooth Scroll Animation (Posts entering the viewport)
function scrollReveal() {
  const posts = document.querySelectorAll('.post');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
      } else {
        entry.target.classList.remove('show');
      }
    });
  });

  posts.forEach(post => {
    observer.observe(post);
  });
}

// Create Post Element with carousel and indicators (dots)
function createPostElement(post, postId) {
  const user = auth.currentUser; // Get the current logged-in user

  const postDiv = document.createElement('div');
  postDiv.classList.add('post', 'card', 'mb-3');

  // Check if there are multiple images
   // Check if there are multiple images
const imagesContent = post.imageUrls.length > 0 ? `
<!-- Simplified Carousel for multiple images with only indicators -->
<div id="carousel${postId}" class="carousel slide" data-bs-ride="carousel">
  <div class="carousel-inner">
    ${post.imageUrls.map((url, index) => `
      <div class="carousel-item ${index === 0 ? 'active' : ''}">
        <img src="${url}" class="d-block w-100" alt="Post Image ${index + 1}">
      </div>
    `).join('')}
  </div>
  
  <!-- Indicators (Dots for toggling) -->
  <div class="carousel-indicators">
    ${post.imageUrls.map((url, index) => `
      <button type="button" data-bs-target="#carousel${postId}" data-bs-slide-to="${index}" class="${index === 0 ? 'active dot' : 'dot'}" aria-current="${index === 0 ? 'true' : 'false'}" aria-label="Slide ${index + 1}"></button>
    `).join('')}
  </div>
</div>
  ` : '<p>No images for this post.</p>';

postDiv.innerHTML = `
  <div class="card-body">
    <div class="d-flex justify-content-between">
      <div>
        <h5 class="card-title">${post.title}</h5>
      </div>
      <!-- Three Dots Dropdown -->
      <div class="dropdown">
        <button class="btn btn-link text-dark three-dots-btn" type="button" id="dropdownMenuButton${postId}" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="bi bi-three-dots"></i>
        </button>
        <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="dropdownMenuButton${postId}">
          <li><button class="dropdown-item report-post-btn">Report this post</button></li>
          ${post.userId === user.uid ? `<li><button class="dropdown-item delete-post-btn">Delete this post</button></li>` : ''}
        </ul>
      </div>
    </div>
    ${imagesContent}
    <p class="card-text">${post.description}</p>
  </div>
`;

return postDiv;
             
}

// Change slide based on dot click
function changeSlide(postId, index) {
  const carousel = document.querySelector(`#carousel${postId}`);
  const items = carousel.querySelectorAll('.carousel-item');
  const dots = carousel.querySelectorAll('.dot');

  // Remove active class from all items and dots
  items.forEach(item => item.classList.remove('active'));
  dots.forEach(dot => dot.classList.remove('active'));

  // Add active class to the selected item and dot
  items[index].classList.add('active');
  dots[index].classList.add('active');
}
