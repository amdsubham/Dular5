import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyC6StBKCQ3iTXEgKGHLwZgM_pa4OquxYSw",
  authDomain: "dular5.firebaseapp.com",
  projectId: "dular5",
  storageBucket: "dular5.firebasestorage.app",
  messagingSenderId: "1097999598856",
  appId: "1:1097999598856:web:6c73469af14b78b1b2d8bd",
  measurementId: "G-TWR1CG03PL"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
let db;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true, // For React Native compatibility
  });
} catch (error) {
  // Firestore already initialized
  db = getFirestore(app);
}

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
export default app;

