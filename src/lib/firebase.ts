// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRPUg0bBrvSaI9A6NvnepjEOoekyVzXQY", // <--- MAKE SURE THIS EXACTLY MATCHES YOUR FIREBASE CONSOLE
  authDomain: "budgetappv2-35d9e.firebaseapp.com", // <--- MAKE SURE THIS EXACTLY MATCHES YOUR FIREBASE CONSOLE
  projectId: "budgetappv2-35d9e", // <--- MAKE SURE THIS EXACTLY MATCHES YOUR FIREBASE CONSOLE
  storageBucket: "budgetappv2-35d9e.firebasestorage.app", // <--- MAKE SURE THIS EXACTLY MATCHES YOUR FIREBASE CONSOLE
  messagingSenderId: "195381507027", // <--- MAKE SURE THIS EXACTLY MATCHES YOUR FIREBASE CONSOLE
  appId: "1:195381507027:web:9930fa2ed91a2214327526", // <--- MAKE SURE THIS EXACTLY MATCHES YOUR FIREBASE CONSOLE
  measurementId: "G-J6FXQL5BEP" // <--- MAKE SURE THIS EXACTLY MATCHES YOUR FIREBASE CONSOLE
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };