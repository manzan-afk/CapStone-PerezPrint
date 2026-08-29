// servicesService.jsx
// Handles reading/writing print shop services in Firestore (collection: "services").

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase-config";

/**
 * Fetches every service.
 * @returns {Promise<Array<object>>} array of services, each including its `id`
 */
export async function getAllServices() {
  const snapshot = await getDocs(collection(db, "services"));
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Creates a new service.
 * @param {object} data - e.g. { name, description, price, unit }
 * @returns {Promise<string>} the new document's id
 */
export async function addService(data) {
  const docRef = await addDoc(collection(db, "services"), {
    ...data,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

/**
 * Updates fields on an existing service.
 * @param {string} id - service document id
 * @param {object} data - fields to update
 * @returns {Promise<void>}
 */
export function updateService(id, data) {
  return updateDoc(doc(db, "services", id), data);
}

/**
 * Deletes a service.
 * @param {string} id - service document id
 * @returns {Promise<void>}
 */
export function deleteService(id) {
  return deleteDoc(doc(db, "services", id));
}