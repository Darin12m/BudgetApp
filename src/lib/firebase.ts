// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDRPUg0bBrvSaI9A6NvnepjEOoekyVzXQY", // <--- VERIFY THIS
  authDomain: "budgetappv2-35d9e.firebaseapp.com", // <--- VERIFY THIS
  projectId: "budgetappv2-35d9e", // <--- VERIFY THIS
  storageBucket: "budgetappv2-35d9e.firebasestorage.app", // <--- VERIFY THIS
  messagingSenderId: "195381507027", // <--- VERIFY THIS
  appId: "1:195381507027:web:9930fa2ed91a2214327526", // <--- VERIFY THIS
  measurementId: "G-J6FXQL5BEP" // <--- VERIFY THIS
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, analytics, db, auth };