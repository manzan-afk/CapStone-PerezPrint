// servicesService.jsx
// Handles reading/writing print shop services in Firestore (collection: "services").

import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase-config";

// Reuses the existing unsigned Cloudinary upload preset used for orders.
const CLOUDINARY_CLOUD_NAME = "fl6yl7z7";
const CLOUDINARY_UPLOAD_PRESET = "Perez Orders";
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Uploads a service image to Cloudinary.
 * @param {File} file
 * @returns {Promise<string>} the image's public URL
 */
export async function uploadServiceImage(file) {
  if (!file || !IMAGE_TYPES.has(file.type)) {
    throw new Error("Please choose a JPG, PNG, or WebP image.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", "services");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Image upload failed.");
  }
  return data.secure_url;
}

/**
 * Fetches every service.
 * @returns {Promise<Array<object>>} array of services, each including its `id`
 */
export async function getAllServices() {
  const snapshot = await getDocs(collection(db, "services"));
  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .filter((service) => service.recordType !== "category");
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

export async function getAllServiceCategories() {
  const snapshot = await getDocs(collection(db, "services"));
  return snapshot.docs
    .map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    }))
    .filter((record) => record.recordType === "category");
}

export async function addServiceCategory(name) {
  const normalizedName = (name || "").trim();
  if (!normalizedName) throw new Error("Category name is required.");

  const docRef = await addDoc(collection(db, "services"), {
    recordType: "category",
    name: normalizedName,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, name: normalizedName };
}

export async function deleteServiceCategory(categoryIds, serviceIds) {
  const serviceRefs = serviceIds.map((id) => doc(db, "services", id));
  const categoryRefs = categoryIds.map((id) => doc(db, "services", id));
  const operationRefs = [...serviceRefs, ...categoryRefs];
  const categoryRefSet = new Set(categoryRefs);

  for (let index = 0; index < operationRefs.length; index += 500) {
    const batch = writeBatch(db);
    const batchRefs = operationRefs.slice(index, index + 500);
    batchRefs.forEach((ref) => {
      if (categoryRefSet.has(ref)) {
        batch.delete(ref);
      } else {
        batch.update(ref, { category: "" });
      }
    });
    await batch.commit();
  }
}