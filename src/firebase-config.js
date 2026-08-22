// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBSW184ElTWZchfYOe1jAE0lrwJZkYtzkY",
  authDomain: "capstone-projectwtms.firebaseapp.com",
  projectId: "capstone-projectwtms",
  storageBucket: "capstone-projectwtms.firebasestorage.app",
  messagingSenderId: "306632596429",
  appId: "1:306632596429:web:4cbb1584a45f658a930284",
  measurementId: "G-1TEM56CMNN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);