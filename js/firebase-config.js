// Import necessary Firebase services
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-storage.js";

// Your Firebase configuration object (replace with your actual values)
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

// Export Firebase services for use in other modules
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
