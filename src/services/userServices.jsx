// userServices.jsx
// Handles reading/writing user profile data in Firestore, keyed by
// the Firebase Auth UID (see authService.jsx for authentication itself).

import { doc, getDoc, getDocs, collection, onSnapshot, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase-config";

/**
 * Creates a new user profile document in Firestore.
 * Call this right after a successful signup (authService.signupUser).
 * @param {string} uid - Firebase Auth UID
 * @param {object} data - profile fields, e.g. { name, email, role }
 * @returns {Promise<void>}
 */
export function createUserProfile(uid, data) {
  return setDoc(doc(db, "users", uid), {
    ...data,
    createdAt: serverTimestamp(),
    orderNotificationsViewedAt: serverTimestamp(),
  });
}

export function subscribeUserProfile(uid, onProfile, onError) {
  return onSnapshot(
    doc(db, "users", uid),
    (snapshot) => onProfile(snapshot.exists() ? snapshot.data() : null),
    onError
  );
}

export function markOrderNotificationsViewed(uid) {
  return setDoc(
    doc(db, "users", uid),
    { orderNotificationsViewedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Fetches a user's profile document.
 * @param {string} uid - Firebase Auth UID
 * @returns {Promise<object|null>} profile data, or null if it doesn't exist
 */
export async function getUserProfile(uid) {
  const snapshot = await getDoc(doc(db, "users", uid));
  return snapshot.exists() ? snapshot.data() : null;
}

/**
 * Updates fields on an existing user profile document.
 * @param {string} uid - Firebase Auth UID
 * @param {object} data - fields to update, e.g. { name: "New Name" }
 * @returns {Promise<void>}
 */
export function updateUserProfile(uid, data) {
  return updateDoc(doc(db, "users", uid), data);
}

/**
 * Saves a user's first and last name, creating the profile document if needed.
 * @param {string} uid - Firebase Auth UID
 * @param {string} firstName
 * @param {string} lastName
 * @returns {Promise<void>}
 */
export function saveUserName(uid, firstName, lastName) {
  return setDoc(doc(db, "users", uid), { firstName, lastName }, { merge: true });
}

/**
 * Fetches every user profile document — for admin user management.
 * @returns {Promise<Array<object>>} array of profiles, each including its `id` (UID)
 */
export async function getAllUsers() {
  const snapshot = await getDocs(collection(db, "users"));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}