// userServices.jsx
// Handles reading/writing user profile data in Firestore, keyed by
// the Firebase Auth UID (see authService.jsx for authentication itself).

import { doc, getDoc, getDocs, collection, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
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
  }).then(async () => {
    try {
      await syncMessageProfile(uid, data);
    } catch (error) {
      console.error("Failed to add profile to the messaging directory:", error);
    }
  });
}

export function syncMessageProfile(uid, profile) {
  const displayName = [profile.firstName, profile.lastName].filter(Boolean).join(" ")
    || profile.email?.split("@")[0]
    || "User";
  return setDoc(doc(db, "messageProfiles", uid), {
    displayName,
    role: profile.role || "customer",
    updatedAt: serverTimestamp(),
  }, { merge: true });
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
  return updateDoc(doc(db, "users", uid), data).then(async () => {
    try {
      const updatedProfile = await getUserProfile(uid);
      if (updatedProfile) await syncMessageProfile(uid, updatedProfile);
    } catch (error) {
      console.error("Failed to update messaging directory profile:", error);
    }
  });
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