import {
  collection,
  addDoc,
  doc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase-config";

// Submit a manual GCash payment
export async function submitPayment(data) {
  const paymentData = {
    orderId: data.orderId,
    orderReference: data.orderReference,
    customerId: data.customerId,
    customerEmail: data.customerEmail || "",
    amount: Number(data.amount),
    paymentMethod: "GCash",
    referenceNumber: data.referenceNumber.trim(),
    proofUrl: data.proofUrl,
    status: "pending",
    createdAt: serverTimestamp(),
  };

  const paymentRef = await addDoc(
    collection(db, "payments"),
    paymentData
  );

  return paymentRef.id;
}

// Get payments belonging to a customer
export async function getCustomerPayments(uid) {
  const q = query(
    collection(db, "payments"),
    where("customerId", "==", uid),
    orderBy("createdAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
}

// Admin approves or rejects a payment
export async function updatePaymentStatus(paymentId, status) {
  if (!["verified", "rejected"].includes(status)) {
    throw new Error("Invalid payment status.");
  }

  return updateDoc(doc(db, "payments", paymentId), {
    status,
    verifiedAt: serverTimestamp(),
  });
}