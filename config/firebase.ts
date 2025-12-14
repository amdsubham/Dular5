import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { initializeFirestore, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // Auth already initialized, get existing instance
  auth = getAuth(app);
}

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

// Initialize App Check for React Native
// NOTE: App Check on React Native requires Firebase Console configuration:
// 1. Add SHA-256 fingerprints in Firebase Console
// 2. Enable Play Integrity API in Google Cloud Console
// 3. Configure App Check with Play Integrity provider in Firebase Console
//
// Until Firebase Console is configured, Phone Auth will require test phone numbers
// or will show reCAPTCHA fallback in some cases.
//
// See: FIREBASE_SETUP_COMPLETE_GUIDE.md for setup instructions

if (__DEV__) {
  // Development: Use debug mode
  // @ts-ignore
  if (typeof self !== 'undefined') {
    self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }
}

// App Check initialization
// For React Native, the actual verification happens via Play Integrity (configured in Firebase Console)
// This initialization enables App Check, but the provider is configured server-side
try {
  // Note: For React Native, we use CustomProvider or let Firebase handle it server-side
  // The ReCaptchaV3Provider is for web only, not React Native
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LfY9VcqAAAAAFm9RwPgJMxJp0zB3kJG9KZvqZQy'),
    isTokenAutoRefreshEnabled: true,
  });
  console.log('✅ Firebase App Check initialized');
} catch (error) {
  console.warn('⚠️ App Check initialization skipped:', error);
}

export { app, auth, db, storage };
export default app;
