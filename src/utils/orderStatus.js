export function getSavedStatus(order) {
  return order.savedStatus || order.status || "placed";
}

export function matchesStatusTab(order, tab) {
  return tab === "all" || getSavedStatus(order) === tab;
}

// ---------- Payment status (independent from the order status) ----------

export const PAYMENT_STATUS_LABELS = {
  unpaid: "Unpaid",
  pending: "Pending Verification",
  verified: "Verified",
  rejected: "Rejected",
  refunded: "Refunded",
};

// Orders and payments created before the payment workflow used "paid" and `status`.
export function normalizePaymentStatus(value) {
  if (value === "paid") return "verified";
  return PAYMENT_STATUS_LABELS[value] ? value : "unpaid";
}

export function getOrderPaymentStatus(order) {
  return normalizePaymentStatus(order?.paymentStatus);
}

// Business rule: 100% payment must be verified before work (printing onward) can start.
const PAYMENT_GATED_STATUSES = ["printing", "ready", "completed"];

export function canSetOrderStatus(order, nextStatus) {
  const current = getSavedStatus(order);
  if (!PAYMENT_GATED_STATUSES.includes(nextStatus) || nextStatus === current) return true;
  if (getOrderPaymentStatus(order) === "verified") return true;
  // Orders already past the gate before this rule existed may still move forward, never back to printing.
  return ["printing", "ready"].includes(current) && nextStatus !== "printing";
}

export const PAYMENT_REQUIRED_MESSAGE =
  "Payment must be verified before this order can move to Printing, Ready for Pickup or Picked Up.";
