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
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "../firebase-config";

const googleProvider = new GoogleAuthProvider();

// Always show Google's "choose an account" screen, even if the browser
// is already signed into a Google account — lets the person pick a
// different one instead of silently reusing whichever is active.
googleProvider.setCustomParameters({ prompt: "select_account" });

// "Remember me" on: the session survives closing the browser.
// Off: the session ends when the tab/browser is closed.
function applyPersistence(remember) {
  return setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
}

/**
 * Logs a user in with Firebase Authentication.
 * @param {string} email
 * @param {string} password
 * @param {boolean} [remember=true] keep the user signed in after the browser is closed
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function loginUser(email, password, remember = true) {
  await applyPersistence(remember);
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
 * @param {boolean} [remember=true] keep the user signed in after the browser is closed
 * @returns {Promise<import("firebase/auth").UserCredential>}
 */
export async function signInWithGoogle(remember = true) {
  await applyPersistence(remember);
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
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google sign-in was cancelled. Please try again.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
    case "auth/unauthorized-domain":
      return "This website address isn't authorized for Google sign-in. Please contact the shop.";
    case "auth/operation-not-allowed":
      return "Google sign-in is not enabled for this shop yet. Please contact the shop.";
    case "auth/account-exists-with-different-credential":
      return "An account with this email already exists. Sign in with your email and password instead.";
    case "auth/user-disabled":
      return "Your account has been deactivated. Please contact the administrator.";
    case "permission-denied":
      return "Signed in, but your profile couldn't be loaded (permission denied). Please contact the shop.";
    default:
      return "Something went wrong. Please try again.";
  }
}