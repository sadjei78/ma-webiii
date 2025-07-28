// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBPXNrOyLK63foHNgGaOpE8dS8N5ISl58s",
    authDomain: "mom-contacts-74dc5.firebaseapp.com",
    projectId: "mom-contacts-74dc5",
    storageBucket: "mom-contacts-74dc5.firebasestorage.app",
    messagingSenderId: "916136302641",
    appId: "1:916136302641:web:caf2ba534d4c76ee755d10",
    measurementId: "G-Q4HZSBT1Y1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

// Initialize Auth
const auth = firebase.auth();

// Try to enable offline persistence (optional feature)
try {
    db.enablePersistence()
        .then(() => {
            // Offline persistence enabled successfully
        })
        .catch((err) => {
            if (err.code == 'failed-precondition') {
                // Multiple tabs open, persistence can only be enabled in one tab at a time.
            } else if (err.code == 'unimplemented') {
                // The current browser does not support persistence.
            } else {
                // Persistence error occurred
            }
        });
} catch (error) {
    // Could not enable offline persistence
}

// Authentication state observer
auth.onAuthStateChanged((user) => {
    if (user) {
        // User is signed in, load the app if function exists
        if (typeof loadApp === 'function') {
            loadApp();
        }
    } else {
        // User is signed out, show login if function exists
        if (typeof showLogin === 'function') {
            showLogin();
        }
    }
}); 