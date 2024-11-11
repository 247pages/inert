import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, push, set, onChildAdded, remove, query, orderByChild, equalTo, get, onValue, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCTkFhWjG_P-SCGUZJPa2mHhSGpoCfCPQ0",
    authDomain: "vwolf-ca64b.firebaseapp.com",
    projectId: "vwolf-ca64b",
    storageBucket: "vwolf-ca64b.appspot.com",
    messagingSenderId: "224941104840",
    appId: "1:224941104840:web:13f4573a43e2a2ebc74ffd",
    measurementId: "G-0P68HWFK39",
    databaseURL: "https://vwolf-ca64b-default-rtdb.asia-southeast1.firebasedatabase.app"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const firestore = getFirestore(app);
// Function to show custom error popup
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


// Function to get user information from Firestore
async function getUserInfo(uid) {
    try {
        const userDocRef = doc(firestore, "users", uid);
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            return {
                uid: uid,  // Include the UID in the returned object
                ...docSnap.data()  // Merge the rest of the user data
            };
        } else {
            showErrorPopup("User document not found.");
            return null;
        }
    } catch (error) {
        showErrorPopup("Error retrieving user data.");
        console.error("Error getting user document:", error);
        return null;
    }
}
// Function to update user's online/offline status
function updateOnlineStatus(uid, isOnline) {
    const userStatusRef = ref(db, 'users/' + uid + '/status');
    set(userStatusRef, {
        online: isOnline,
        last_changed: Date.now()
    }).catch((error) => {
        showErrorPopup("Error updating user status.");
        console.error("Error updating user status: ", error);
    });
}

// Function to keep only the latest 10 messages for a user
async function keepLatest10Messages(uid) {
    const userMessagesRef = ref(db, 'messages');
    
    const userMessagesQuery = query(userMessagesRef, orderByChild('uid'), equalTo(uid));
    
    try {
        const snapshot = await get(userMessagesQuery);
        const messages = [];

        snapshot.forEach((childSnapshot) => {
            messages.push({
                key: childSnapshot.key,
                ...childSnapshot.val()
            });
        });

        messages.sort((a, b) => b.timestamp - a.timestamp);

        if (messages.length > 10) {
            const messagesToDelete = messages.slice(10);
            for (const message of messagesToDelete) {
                await remove(ref(db, `messages/${message.key}`));
            }
        }
    }
    catch (error) {
        showErrorPopup("Error maintaining messages.");
        console.error("Error keeping latest 10 messages: ", error);
    }
}

// Set up presence and listen for online/offline status
function setupPresence(uid) {
    const userPresenceRef = ref(db, 'presence/' + uid);
    
    set(userPresenceRef, { online: true, last_changed: Date.now() })
        .catch((error) => {
            console.error("Error setting presence status: ", error);
        });

    onDisconnect(userPresenceRef).set({ online: false, last_changed: Date.now() })
        .then(() => {
            console.log("User presence onDisconnect set.");
        })
        .catch((error) => {
         showErrorPopup("Error setting presence status.");
         console.error("Error setting presence status: ", error);
         });
    onValue(userPresenceRef, (snapshot) => {
        const presence = snapshot.val();
        if (presence && !presence.online) {
            console.log("User is offline. Deleting messages...");
        }
    });
}

// Listen for authentication state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userInfo = await getUserInfo(user.uid);
        if (userInfo) {
            updateOnlineStatus(user.uid, true);  // Set user as online
            setupPresence(user.uid);  // Set up presence tracking
            loadMessages(userInfo.uid);  // Load existing messages
            document.getElementById("sendButton").addEventListener("click", () => {
                sendMessage(userInfo);
            });
        } 
        else {
            showErrorPopup("Failed to retrieve user information.");
            console.error("User info could not be retrieved.");
        }
    } else {
        showErrorPopup("User not logged in.");
        window.location.href = '/inert/auth.html';  // Redirect to signup page if not logged in
    }
});

// Send a new message (post)
async function sendMessage(userInfo) {
    const messageInput = document.getElementById("messageInput");
    let messageText = messageInput.value.trim(); // Declare with `let` to allow reassignment

    // Sanitize and escape input
    messageText = sanitizeInput(messageText);
    messageText = escapeHtml(messageText);

    // Limit message length to 200 characters
    if (messageText.length > 800) {
        showErrorPopup("Message cannot exceed 800 characters.");
        return;
    }

    if (messageText) {
        if (userInfo && userInfo.uid && userInfo.username && userInfo.name) {
            const newMessageRef = push(ref(db, 'messages'));

            const messageData = {
                text: messageText,
                uid: userInfo.uid,
                username: userInfo.username,
                name: userInfo.name,
                timestamp: Date.now()
            };

            console.log("Sending message: ", messageData);

            try {
                await set(newMessageRef, messageData);
                await keepLatest10Messages(userInfo.uid); // Ensure only the latest 10 messages are kept
                messageInput.value = ""; // Clear the input field
            } 
            catch (error) {
                showErrorPopup("Error sending message.");
                console.error("Error sending message: ", error.code, error.message, error);
            }
        } else {
            showErrorPopup("Incomplete user information.");
            console.error("User information is incomplete: ", userInfo);
        }
    }
}

// Load and display messages (posts)
function loadMessages(currentUid) {
    const messagesRef = ref(db, 'messages');
    const messagesContainer = document.getElementById("messagesContainer");
    console.log("Listening for messages...");

    onChildAdded(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
            const message = snapshot.val();
            console.log("New message received from RTDB: ", message);
            displayMessage(message, currentUid);

            autoScrollToLatestMessage(messagesContainer);
        } else {
            console.log("No messages found.");
        }
    }, (error) => {
        showErrorPopup("Error retrieving messages.");
        console.error("Error listening for new messages: ", error);
        });
        }
// Function to display a message
// Function to display a message
function displayMessage(message, currentUid) {
    const messagesContainer = document.getElementById("messagesContainer");

        if (!messagesContainer) {
        showErrorPopup("Messages container not found.");
        console.error("Messages container not found.");
        return;
    }

    if (message && message.username && message.name && message.text && message.timestamp) {
        const messageElement = document.createElement("div");

        // Convert timestamp to user's local time in 12-hour format with AM/PM
        const messageDate = new Date(message.timestamp);
        const formattedTime = messageDate.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        const formattedDate = messageDate.toLocaleDateString(); // Format date as 'MM/DD/YYYY' or as per locale

        // Get the first alphabetic character from the username
        const avatarLetter = getFirstAlphabet(message.username);
        const avatarColor = getAvatarColor(message.username);

        messageElement.classList.add("message");
        
        // If the message is from the current user, add a special class to highlight it
        if (message.uid === currentUid) {
            messageElement.classList.add("my-message");
        }

        messageElement.innerHTML = `
            <div class="message-header">
                <div class="avatar" style="background-color: ${avatarColor};">${avatarLetter}</div>
                <div class="message-details">
                    <div class="messageName">${message.name}</div>
                    <div class="messageUsername">@${message.username}</div>
                </div>
            </div>
            <div class="messageText">${message.text}</div>
            <div class="messageTimestamp">${formattedDate}, ${formattedTime}</div>
        `;

        messagesContainer.appendChild(messageElement);
        autoScrollToLatestMessage(messagesContainer);
    } else {

        console.error("Incomplete message data: ", message);
    }
}

function getFirstAlphabet(username) {
    const match = username.match(/[a-zA-Z]/);
    return match ? match[0].toUpperCase() : "?";
}

function getAvatarColor(username) {
    const colors = ['#ff5733', '#33ff57', '#3357ff', '#f333ff', '#33fff5'];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
}

function autoScrollToLatestMessage(container) {
    container.scrollTop = container.scrollHeight;
}

// Scroll to the bottom when the page loads
window.onload = () => {
    const messagesContainer = document.getElementById('messagesContainer');
    autoScrollToLatestMessage(messagesContainer);
};

// MutationObserver to detect new messages and auto-scroll
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
            const messagesContainer = document.getElementById('messagesContainer');
            autoScrollToLatestMessage(messagesContainer);
        }
    });
});

// Start observing the messages container
const messagesContainer = document.getElementById('messagesContainer');
observer.observe(messagesContainer, { childList: true });




document.getElementById('menuToggle').addEventListener('click', function () {
            const menu = document.getElementById('menu');
            if (menu.style.display === 'none' || menu.style.display === '') {
                menu.style.display = 'block';
            } else {
                menu.style.display = 'none';
            }
        });

// Function to sanitize user input

// Function to sanitize user input
function sanitizeInput(input) {
    // Replace <, >, &, and quotes to prevent XSS
    const tempDiv = document.createElement("div");
    tempDiv.textContent = input; // Use textContent to escape
    return tempDiv.innerHTML; // Return sanitized string
}

// Function to escape HTML special characters
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Continue with the rest of your code
