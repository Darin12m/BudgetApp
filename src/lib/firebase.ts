// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"; // Added Firestore import
import { getAuth } from "firebase/auth"; // Added Auth import

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRPUg0bBrvSaI9A6NvnepjEOoekyVzXQY",
  authDomain: "budgetappv2-35d9e.firebaseapp.com",
  projectId: "budgetappv2-35d9e",
  storageBucket: "budgetappv2-35d9e.firebasestorage.app",
  messagingSenderId: "195381507027",
  appId: "1:195381507027:web:9930fa2ed91a2214327526",
  measurementId: "G-J6FXQL5BEP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app); // Initialized Firestore
const auth = getAuth(app); // Initialized Auth

export { app, analytics, db, auth };