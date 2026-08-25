// authService.jsx
// Auth service layer — connects to Firebase Authentication.
// Login.jsx (and any other component) calls these functions instead of
// talking to Firebase directly.

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase-config";

const googleProvider = new GoogleAuthProvider();

/**
 * Logs a user in with Firebase Authentication.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export function loginUser(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Creates a new account with Firebase Authentication.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export function signupUser(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Signs in (or signs up, if it's their first time) using a Google account.
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

/**
 * Sends a password reset email via Firebase Authentication.
 * @param {string} email
 * @returns {Promise<void>}
 */
export function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Maps a Firebase Auth error code to a user-friendly message.
 * @param {string} code
 * @returns {string}
 */
export function friendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/weak-password":
      return "Password is too weak — use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    default:
      return "Something went wrong. Please try again.";
  }
}