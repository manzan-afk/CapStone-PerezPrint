import {
  collection,
  doc,
  getDoc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot,
  runTransaction,
  writeBatch,
} from "firebase/firestore";

import { db } from "../firebase-config";
import { normalizePaymentStatus } from "../utils/orderStatus";
import { uploadServiceImage } from "./servicesService";

const PAYMENT_SETTINGS_REF = () => doc(db, "settings", "payment");

// Shop's GCash details shown to customers (settings/payment). Returns null if not set yet.
export async function getPaymentSettings() {
  const snapshot = await getDoc(PAYMENT_SETTINGS_REF());
  return snapshot.exists() ? snapshot.data() : null;
}

// Admin only (enforced by firestore.rules)
export async function savePaymentSettings({ accountName, gcashNumber, qrUrl }) {
  await setDoc(
    PAYMENT_SETTINGS_REF(),
    {
      accountName: accountName.trim(),
      gcashNumber: gcashNumber.trim(),
      qrUrl: qrUrl || "",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}

// Uploads the QR image through the shared Cloudinary upload helper
export function uploadPaymentQr(file) {
  return uploadServiceImage(file, "payment");
}

// ---------- Payment records (collection: "payments") ----------

export const PAYMENT_OPTIONS = ["GCash Number", "QR Code"];

// GCash reference numbers are compared without spaces/dashes and case.
export function normalizeReference(value) {
  return String(value || "").replace(/[\s-]/g, "").toUpperCase();
}

function toMillis(value) {
  return value?.toMillis?.() ?? 0;
}

// Maps a payments document to the current field names, falling back to the ones
// used before the verification workflow (status, proofUrl, reviewedBy, reviewedAt).
function mapPayment(id, data) {
  return {
    ...data,
    id,
    paymentId: id,
    paymentStatus: normalizePaymentStatus(data.paymentStatus ?? data.status),
    receiptUrl: data.receiptUrl || data.proofUrl || "",
    verifiedBy: data.verifiedBy || (data.status === "verified" ? data.reviewedBy : "") || "",
    verifiedAt: data.verifiedAt || (data.status === "verified" ? data.reviewedAt : null) || null,
    rejectedBy: data.rejectedBy || (data.status === "rejected" ? data.reviewedBy : "") || "",
    rejectedAt: data.rejectedAt || (data.status === "rejected" ? data.reviewedAt : null) || null,
  };
}

/**
 * Finds another payment that already uses this payment's reference number:
 * a verified/refunded one, or a pending one that was submitted earlier.
 */
export function findDuplicateReference(payment, payments) {
  const key = normalizeReference(payment.referenceNumber);
  if (!key) return null;
  return (
    payments.find(
      (other) =>
        other.id !== payment.id &&
        normalizeReference(other.referenceNumber) === key &&
        other.paymentStatus !== "rejected" &&
        (other.paymentStatus === "verified" ||
          other.paymentStatus === "refunded" ||
          toMillis(other.createdAt) <= toMillis(payment.createdAt))
    ) || null
  );
}

const toCents = (value) => Math.round(Number(value) * 100);

/**
 * Customer submits a payment for an order: creates the payment record and moves the
 * order's payment status to "pending" together. The order itself stays "placed".
 */
export async function submitPayment(data) {
  const paymentRef = doc(collection(db, "payments"));
  const batch = writeBatch(db);

  batch.set(paymentRef, {
    paymentId: paymentRef.id,
    orderId: data.orderId,
    orderReference: data.orderReference,
    orderAmount: Number(data.orderAmount),
    customerId: data.customerId,
    customerEmail: data.customerEmail || "",
    customerName: data.customerName || "",
    paymentMethod: "GCash",
    paymentOption: data.paymentOption,
    referenceNumber: normalizeReference(data.referenceNumber),
    amount: Number(data.amount),
    receiptUrl: data.receiptUrl,
    paymentStatus: "pending",
    createdAt: serverTimestamp(),
  });
  batch.update(doc(db, "orders", data.orderId), {
    paymentStatus: "pending",
    paymentId: paymentRef.id,
    updatedAt: serverTimestamp(),
  });

  await batch.commit();
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
  return snapshot.docs.map((item) => mapPayment(item.id, item.data()));
}

// Staff/admin: live list of every payment, newest first
export function subscribeAllPayments(onPayments, onError) {
  const q = query(collection(db, "payments"), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snapshot) => onPayments(snapshot.docs.map((item) => mapPayment(item.id, item.data()))),
    onError
  );
}

// Staff/admin: live count of payments waiting for review (sidebar badge)
export function subscribePendingPaymentCount(onCount, onError) {
  return subscribeAllPayments(
    (payments) => onCount(payments.filter((payment) => payment.paymentStatus === "pending").length),
    onError
  );
}

function serviceError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

/**
 * Staff/admin reviews a payment. The payment and its order's payment status change
 * together; the order's own status (Placed, Printing…) is never touched here.
 *  - "verified": pending → verified. Requires the amount to equal the full order total and
 *    a reference number not used by another payment. Records verifiedBy / verifiedAt.
 *  - "rejected": pending → rejected, with a reason shown to the customer.
 *  - "refunded": verified → refunded.
 * @param {string} paymentId
 * @param {"verified"|"rejected"|"refunded"} status
 * @param {{ reviewerId: string, reason?: string }} review
 */
export async function updatePaymentStatus(paymentId, status, { reviewerId, reason = "" } = {}) {
  if (!["verified", "rejected", "refunded"].includes(status)) {
    throw new Error("Invalid payment status.");
  }
  if (!reviewerId) {
    throw new Error("Reviewer is required.");
  }
  const trimmedReason = reason.trim();
  if (status === "rejected" && !trimmedReason) {
    throw new Error("A reason is required to reject a payment.");
  }

  const paymentRef = doc(db, "payments", paymentId);

  if (status === "verified") {
    const current = await getDoc(paymentRef);
    if (current.exists()) {
      const payment = mapPayment(current.id, current.data());
      const sameReference = await getDocs(
        query(collection(db, "payments"), where("referenceNumber", "==", payment.referenceNumber))
      );
      const duplicate = findDuplicateReference(
        payment,
        sameReference.docs.map((item) => mapPayment(item.id, item.data()))
      );
      if (duplicate) {
        throw serviceError(
          "This reference number is already used by another payment.",
          "duplicate-reference"
        );
      }
    }
  }

  return runTransaction(db, async (transaction) => {
    const paymentSnap = await transaction.get(paymentRef);
    if (!paymentSnap.exists()) {
      throw new Error("This payment no longer exists.");
    }
    const payment = mapPayment(paymentSnap.id, paymentSnap.data());
    const expectedStatus = status === "refunded" ? "verified" : "pending";
    if (payment.paymentStatus !== expectedStatus) {
      throw serviceError("This payment has already been reviewed.", "payment-already-reviewed");
    }

    const orderRef = doc(db, "orders", payment.orderId);
    const orderSnap = await transaction.get(orderRef);
    if (!orderSnap.exists()) {
      throw serviceError("The order for this payment no longer exists.", "order-missing");
    }
    if (status === "verified" && toCents(payment.amount) !== toCents(orderSnap.data().totalPrice)) {
      throw serviceError(
        "The amount sent does not match the full order amount.",
        "amount-mismatch"
      );
    }

    const paymentUpdate =
      status === "verified"
        ? { paymentStatus: "verified", verifiedBy: reviewerId, verifiedAt: serverTimestamp() }
        : status === "rejected"
        ? {
            paymentStatus: "rejected",
            rejectedBy: reviewerId,
            rejectedAt: serverTimestamp(),
            rejectionReason: trimmedReason,
          }
        : { paymentStatus: "refunded", refundedBy: reviewerId, refundedAt: serverTimestamp() };

    transaction.update(paymentRef, paymentUpdate);
    transaction.update(orderRef, {
      paymentStatus: status,
      paymentId,
      updatedAt: serverTimestamp(),
      ...(status === "verified" ? { paidAt: serverTimestamp() } : {}),
    });
  });
}


