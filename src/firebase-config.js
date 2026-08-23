import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBSW184ElTWZchfYOe1jAE0lrwJZkYtzkY",
  authDomain: "capstone-projectwtms.firebaseapp.com",
  projectId: "capstone-projectwtms",
  storageBucket: "capstone-projectwtms.firebasestorage.app",
  messagingSenderId: "306632596429",
  appId: "1:306632596429:web:4cbb1584a45f658a930284",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);