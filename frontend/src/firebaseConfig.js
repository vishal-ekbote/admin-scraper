// frontend/src/firebaseConfig.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

console.log("Attempting to load VITE_FIREBASE_PROJECT_ID:", import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log("All VITE env vars:", import.meta.env); // This will show all VITE vars Vite sees

// Web app's Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Optional
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

const callScrapeData = httpsCallable(functions, 'scrapeData');
// Define the constant with the new, clear name
const callGetScrapedBooks = httpsCallable(functions, 'getScrapedBooks');

// Export the new constant name
export { auth, db, callScrapeData, callGetScrapedBooks, analytics };

