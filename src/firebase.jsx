// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
import { auth } from "./firebase-config";
import { getFirestore} from "firebase/firestore";
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
  appId: "1:306632596429:web:e28a46015e07a1c7930284",
  measurementId: "G-41X4YWVHTY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
