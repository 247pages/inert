import { auth, db, storage } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-storage.js";

// DOM Elements
const authSection = document.getElementById('auth-section');
const createPostSection = document.getElementById('create-post-section');
const postsSection = document.getElementById('posts-section');
const postsContainer = document.getElementById('posts-container');
const postForm = document.getElementById('post-form');
const postTitle = document.getElementById('post-title');
const postDescription = document.getElementById('post-description');
const postImage = document.getElementById('post-image');
const imagePreview = document.getElementById('image-preview');
const uploadStatus = document.getElementById('upload-status'); 
const loader = document.getElementById('loader'); 

// Character limits
const TITLE_CHAR_LIMIT = 50;
const DESCRIPTION_CHAR_LIMIT = 600;

// Create custom alert popup
function showCustomAlert(message) {
  // Create a popup element
  const popup = document.createElement('div');
  popup.className = 'custom-popup';
  popup.innerHTML = `
    <div class="popup-content">
      <span class="close-btn">&times;</span>
      <p>${message}</p>
    </div>
  `;
  document.body.appendChild(popup);
  
  // Close the popup when the close button is clicked
  popup.querySelector('.close-btn').addEventListener('click', () => {
    document.body.removeChild(popup);
  });

  // Close the popup after 3 seconds
  setTimeout(() => {
    if (document.body.contains(popup)) {
      document.body.removeChild(popup);
    }
  }, 3000); // Change duration if needed
}

// Auth State
onAuthStateChanged(auth, (user) => {
  if (user) {
    showPostCreation();
    loadPosts();
  } else {
    showAuthSection();
  }
});

// Show auth section
function showAuthSection() {
  authSection.style.display = 'block';
  createPostSection.style.display = 'none';
  postsSection.style.display = 'none';
}

// Show post creation section
function showPostCreation() {
  authSection.style.display = 'none';
  createPostSection.style.display = 'block';
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

// Handle image selection and preview
postImage.addEventListener('change', (e) => {
  const files = e.target.files;
  const totalSize = Array.from(files).reduce((sum, file) => sum + file.size, 0);
  const previewContainer = imagePreview;

  previewContainer.innerHTML = ''; // Clear previous previews

  if (files.length > 7) {
    showCustomAlert("You can only upload a maximum of 7 images.");
    postImage.value = '';
    return;
  }

  if (totalSize > 50 * 1024 * 1024) {
    showCustomAlert("Total file size exceeds 50 MB.");
    postImage.value = '';
    return;
  }

  // Convert FileList to Array for easier manipulation
  const filesArray = Array.from(files);

  filesArray.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgDiv = document.createElement('div');
      imgDiv.classList.add('image-preview-container', 'position-relative', 'd-inline-block', 'mr-2', 'mb-2');
      imgDiv.innerHTML = `
        <img src="${e.target.result}" class="img-thumbnail" style="width: 100px;" alt="Image Preview">
        <button class="remove-image-btn" data-index="${index}" style="position: absolute; top: 0; right: 0; background: none; border: none; color: red; font-size: 18px; cursor: pointer;">&times;</button>
      `;
      previewContainer.appendChild(imgDiv);
    };
    reader.readAsDataURL(file);
  });
});

// Remove image from preview
imagePreview.addEventListener('click', (e) => {
  if (e.target.classList.contains('remove-image-btn')) {
    const indexToRemove = e.target.dataset.index;
    const filesArray = Array.from(postImage.files);

    // Remove the selected image file from the FileList
    filesArray.splice(indexToRemove, 1);

    // Update the FileList and re-render the previews
    const newFileList = new DataTransfer();
    filesArray.forEach(file => newFileList.items.add(file));
    postImage.files = newFileList.files;

    // Re-render image previews
    postImage.dispatchEvent(new Event('change'));
  }
});

// Sanitize Input
function sanitizeInput(input) {
  const div = document.createElement('div');
  div.innerText = input;
  return div.innerHTML; // Return sanitized HTML
}

// Create a Post
postForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const user = auth.currentUser;
  let title = postTitle.value.trim();
  let description = postDescription.value.trim();
  const files = postImage.files;

  // Validate character limits
  if (title.length > TITLE_CHAR_LIMIT) {
    showCustomAlert(`Title must be under ${TITLE_CHAR_LIMIT} characters.`);
    return;
  }
  if (description.length > DESCRIPTION_CHAR_LIMIT) {
    showCustomAlert(`Description must be under ${DESCRIPTION_CHAR_LIMIT} characters.`);
    return;
  }

  // Sanitize inputs
  title = sanitizeInput(title);
  description = sanitizeInput(description);

  // Show loader and upload status
  loader.style.display = 'block';
  uploadStatus.textContent = "Uploading your post..."; // Update status message

  // Prepare to upload images
  const imageUrls = [];

  // Only upload images if files are selected
  if (files.length > 0) {
    for (const file of files) {
      const storageRef = ref(storage, `posts/${user.uid}/${file.name}`);
      try {
        await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(storageRef);
        imageUrls.push(imageUrl);
      } catch (error) {
        console.error("Error uploading image: ", error);
        uploadStatus.textContent = "Error uploading images. Please try again."; // Update status message
        loader.style.display = 'none'; // Hide loader
        return;
      }
    }
  }

  // Add the post to Firestore
  try {
    const postDoc = await addDoc(collection(db, "posts"), {
      userId: user.uid,
      username: user.displayName,
      title: title,
      description: description,
      imageUrls: imageUrls, // Store multiple URLs (can be empty)
      reportCount: 0, // Initialize report count
      timestamp: new Date(),
    });

    // Reset form fields
    postTitle.value = '';
    postDescription.value = '';
    postImage.value = '';
    imagePreview.innerHTML = ''; // Clear image previews
    uploadStatus.textContent = "Post uploaded successfully!"; // Update status message

    // Hide the success message after 3 seconds
    setTimeout(() => {
      uploadStatus.textContent = ''; // Clear the status message
    }, 3000); // 3-second delay before clearing the message

  } catch (error) {
    console.error("Error creating post: ", error);
    uploadStatus.textContent = "Error creating post. Please try again."; // Update status message
  } finally {
    loader.style.display = 'none'; // Hide loader
  }
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
      
      // Ensure the event listeners are added after the post is created
      const deleteButton = postElement.querySelector('.delete-post-btn');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => handleDeletePost(doc.id));
      }

      const reportButton = postElement.querySelector('.report-post-btn');
      if (reportButton) {
        reportButton.addEventListener('click', () => handleReportPost(doc.id));
      }
    });
  });
}

// Create Post Element
function createPostElement(post, postId) {
  const postElement = document.createElement('div');
  postElement.className = 'post border rounded p-3 mb-2 bg-light';

  // Add title and description
  postElement.innerHTML = `
    <h4>${post.title}</h4>
    <p>${post.description}</p>
    ${post.imageUrls.map(url => `<img src="${url}" class="img-thumbnail" style="max-width: 300px;" alt="Post Image">`).join('')}
    <div>
      <button class="btn btn-danger delete-post-btn">Delete Post</button>
      <button class="btn btn-warning report-post-btn">Report Post</button>
    </div>
  `;

  return postElement;
}

// Handle Delete Post
async function handleDeletePost(postId) {
  const confirmed = confirm("Are you sure you want to delete this post?");
  if (confirmed) {
    await deleteDoc(doc(db, "posts", postId));
    showCustomAlert("Post deleted successfully.");
  }
}

// Handle Report Post
async function handleReportPost(postId) {
  const postRef = doc(db, "posts", postId);
  const postSnapshot = await getDoc(postRef);
  const postData = postSnapshot.data();

  // Increment report count
  await updateDoc(postRef, { reportCount: (postData.reportCount || 0) + 1 });
  showCustomAlert("Post reported successfully.");
}

