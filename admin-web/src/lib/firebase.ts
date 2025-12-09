import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getMessaging, isSupported } from 'firebase/messaging';

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

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize messaging (only in browser)
export const getMessagingInstance = async () => {
  if (typeof window !== 'undefined' && await isSupported()) {
    return getMessaging(app);
  }
  return null;
};

export default app;
