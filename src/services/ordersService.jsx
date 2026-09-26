// ordersService.jsx
// Handles customer print orders: file uploads (via Cloudinary — no
// Firebase billing plan required) and order records (Firestore
// collection: "orders").

import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase-config";

// From your Cloudinary dashboard (Settings → Upload → Upload presets).
// Cloud name is shown on your dashboard home page.
const CLOUDINARY_CLOUD_NAME = "fl6yl7z7";
const CLOUDINARY_UPLOAD_PRESET = "Perez Orders";

/**
 * Uploads one or more files to Cloudinary and returns their names and
 * public URLs.
 * @param {string} uid - the customer's Firebase Auth UID (used to tag/organize uploads)
 * @param {File[]} files
 * @returns {Promise<Array<{ name: string, url: string, size: number }>>}
 */
export async function uploadOrderFiles(uid, files) {
  const uploads = await Promise.all(
    files.map(async (file) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
      formData.append("folder", `orders/${uid}`);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`,
        { method: "POST", body: formData }
      );

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      const data = await response.json();
      return { name: file.name, url: data.secure_url, size: file.size };
    })
  );
  return uploads;
}

/**
 * Generates a short, human-readable reference/tracking number,
 * e.g. "PPS-20260903-7F2K", used for order pickup lookup.
 * @returns {string}
 */
function generateReferenceId() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `PPS-${datePart}-${randomPart}`;
}

/**
 * Creates a new order.
 * @param {object} data - e.g. { customerId, customerEmail, serviceId, serviceName, description, files }
 * @returns {Promise<{ id: string, referenceId: string }>} the new order's id and tracking reference
 */
export async function createOrder(data) {
  const referenceId = generateReferenceId();
  const docRef = await addDoc(collection(db, "orders"), {
    ...data,
    referenceId,
    status: "placed",
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, referenceId };
}

/**
 * Fetches all orders placed by a specific customer, newest first.
 * @param {string} uid - the customer's Firebase Auth UID
 * @returns {Promise<Array<object>>}
 */
export async function getUserOrders(uid) {
  const q = query(
    collection(db, "orders"),
    where("customerId", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Subscribes to a customer's orders so status notifications update live.
 * @param {string} uid - the customer's Firebase Auth UID
 * @param {(orders: Array<object>) => void} onOrders
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe function
 */
export function subscribeUserOrders(uid, onOrders, onError) {
  const q = query(
    collection(db, "orders"),
    where("customerId", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      onOrders(snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })));
    },
    onError
  );
}

/**
 * Subscribes to all orders for staff and admin message feeds.
 * @param {(orders: Array<object>) => void} onOrders
 * @param {(error: Error) => void} onError
 * @returns {() => void} unsubscribe function
 */
export function subscribeAllOrders(onOrders, onError) {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      onOrders(snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })));
    },
    onError
  );
}

/**
 * Updates an order's status (e.g. "placed", "printing", "ready", "completed").
 * @param {string} orderId
 * @param {string} status
 * @returns {Promise<void>}
 */
export function updateOrderStatus(orderId, status) {
  const updates = { status, statusUpdatedAt: serverTimestamp() };
  if (status === "ready") {
    updates.pickupReadyAt = serverTimestamp();
  }
  return updateDoc(doc(db, "orders", orderId), updates);
}

/**
 * Sends an order back to the customer with a note explaining what needs
 * to be fixed (wrong file, unclear specs, etc.), instead of accepting it.
 * @param {string} orderId
 * @param {string} note - explanation shown to the customer
 * @returns {Promise<void>}
 */
export function requestOrderRevision(orderId, note) {
  return updateDoc(doc(db, "orders", orderId), {
    status: "needs_revision",
    staffNote: note,
    statusUpdatedAt: serverTimestamp(),
    revisionRequestedAt: serverTimestamp(),
  });
}

/**
 * Fetches every order — for admin/staff order management.
 * @returns {Promise<Array<object>>}
 */
export async function getAllOrders() {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Deletes an order after it has been picked up (completed).
 * @param {string} orderId
 * @returns {Promise<void>}
 */
export function deleteOrder(orderId) {
  return deleteDoc(doc(db, "orders", orderId));
}