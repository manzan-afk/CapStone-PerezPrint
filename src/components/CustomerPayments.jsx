import { useState, useEffect } from "react";
import { getUserOrders, uploadOrderFiles } from "../services/ordersService";
import { submitPayment, getCustomerPayments } from "../services/paymentService";
import "./CustomerPayments.css";

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PAYMENT_STATUS_LABELS = {
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date) return "—";
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export default function CustomerPayments({ uid, email }) {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [orderId, setOrderId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (uid) loadData();
  }, [uid]);

  async function loadData() {
    setLoading(true);
    setLoadError("");
    try {
      const [userOrders, userPayments] = await Promise.all([
        getUserOrders(uid),
        getCustomerPayments(uid),
      ]);
      setOrders(userOrders);
      setPayments(userPayments);
    } catch (err) {
      console.error("Failed to load payments:", err);
      setLoadError(
        err.code === "failed-precondition"
          ? "A Firestore index is required for this query — check the browser console for a link to create it."
          : "Failed to load payments. Please refresh and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Orders that can still be paid: priced, not cancelled, and without a pending or verified payment.
  const blockedOrderIds = new Set(
    payments
      .filter((payment) => payment.status === "pending" || payment.status === "verified")
      .map((payment) => payment.orderId)
  );
  const payableOrders = orders.filter(
    (order) =>
      order.status !== "cancelled" &&
      Number(order.totalPrice) > 0 &&
      !blockedOrderIds.has(order.id)
  );
  const selectedOrder = payableOrders.find((order) => order.id === orderId) || null;

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setProofFile(file);
    setErrors((previous) => ({ ...previous, proof: "" }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus({ text: "", type: "" });

    const nextErrors = {};
    const trimmedReference = referenceNumber.trim();

    if (!selectedOrder) nextErrors.order = "Select the order you are paying for.";

    if (!trimmedReference) {
      nextErrors.reference = "Enter the GCash reference number.";
    } else if (!/^[A-Za-z0-9\s-]{6,30}$/.test(trimmedReference)) {
      nextErrors.reference = "Enter a valid reference number (6–30 letters or numbers).";
    }

    if (!proofFile) {
      nextErrors.proof = "Upload a screenshot of your GCash receipt.";
    } else if (!proofFile.type.startsWith("image/")) {
      nextErrors.proof = "The proof of payment must be an image.";
    } else if (proofFile.size > MAX_PROOF_BYTES) {
      nextErrors.proof = "The image must be 5 MB or smaller.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const [proof] = await uploadOrderFiles(uid, [proofFile]);
      await submitPayment({
        orderId: selectedOrder.id,
        orderReference: selectedOrder.referenceId || "",
        customerId: uid,
        customerEmail: email,
        amount: selectedOrder.totalPrice,
        referenceNumber: trimmedReference,
        proofUrl: proof.url,
      });

      setOrderId("");
      setReferenceNumber("");
      setProofFile(null);
      setFileInputKey((key) => key + 1);
      setStatus({
        text: "Payment submitted. The shop will verify it shortly.",
        type: "success",
      });
      await loadData();
    } catch (err) {
      console.error("Failed to submit payment:", err);
      setStatus({
        text:
          err.code === "permission-denied"
            ? "You don't have permission to submit payments yet. Please contact the shop."
            : "Failed to submit your payment. Please try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="dashboard-content">Loading payments...</div>;
  }

  return (
    <div className="dashboard-content">
      {loadError && <div className="um-error">{loadError}</div>}

      <section className="cpay-card">
        <h3 className="cpay-card__title">Pay with GCash</h3>
        <p className="cpay-card__hint">
          Send the exact amount through GCash, then enter the reference number and upload a
          screenshot of your receipt so the shop can verify your payment.
        </p>

        {payableOrders.length === 0 ? (
          <div className="um-empty">You have no orders waiting for payment.</div>
        ) : (
          <form className="cpay-form" onSubmit={handleSubmit} noValidate>
            <label className="field-label" htmlFor="payOrder">Order</label>
            <select
              id="payOrder"
              className="order-select"
              value={orderId}
              onChange={(event) => {
                setOrderId(event.target.value);
                setErrors((previous) => ({ ...previous, order: "" }));
              }}
            >
              <option value="">Select an order</option>
              {payableOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.referenceId || order.id} — ₱{Number(order.totalPrice).toFixed(2)}
                </option>
              ))}
            </select>
            <div className="field-error">{errors.order}</div>

            <label className="field-label" htmlFor="payAmount">Amount to pay</label>
            <input
              id="payAmount"
              className="order-select"
              type="text"
              readOnly
              value={selectedOrder ? `₱${Number(selectedOrder.totalPrice).toFixed(2)}` : ""}
              placeholder="Select an order first"
            />
            <div className="field-error"></div>

            <label className="field-label" htmlFor="payReference">GCash reference number</label>
            <input
              id="payReference"
              className="order-select"
              type="text"
              inputMode="numeric"
              placeholder="e.g. 1234567890123"
              value={referenceNumber}
              onChange={(event) => {
                setReferenceNumber(event.target.value);
                setErrors((previous) => ({ ...previous, reference: "" }));
              }}
            />
            <div className="field-error">{errors.reference}</div>

            <label className="field-label" htmlFor="payProof">Proof of payment (screenshot)</label>
            <input
              key={fileInputKey}
              id="payProof"
              className="cpay-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="field-error">{errors.proof}</div>

            <button type="submit" className="cpay-submit" disabled={submitting}>
              {submitting ? "Submitting..." : "Submit payment"}
            </button>

            {status.text && (
              <div className={`cpay-status cpay-status--${status.type}`}>{status.text}</div>
            )}
          </form>
        )}

        {payableOrders.length === 0 && status.text && (
          <div className={`cpay-status cpay-status--${status.type}`}>{status.text}</div>
        )}
      </section>

      <section className="cpay-history">
        <h3 className="cpay-card__title">Payment history</h3>
        {payments.length === 0 ? (
          <div className="um-empty">No payments submitted yet.</div>
        ) : (
          <div className="cpay-list">
            {payments.map((payment) => (
              <article className="cpay-item" key={payment.id}>
                <div className="cpay-item__header">
                  <strong>{payment.orderReference || "Order"}</strong>
                  <span className={`cpay-badge cpay-badge--${payment.status}`}>
                    {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                  </span>
                </div>
                <div className="cpay-item__meta">
                  <span>₱{Number(payment.amount).toFixed(2)}</span>
                  <span>Ref: {payment.referenceNumber}</span>
                  <span>{formatDate(payment.createdAt)}</span>
                </div>
                {payment.proofUrl && (
                  <a
                    className="cpay-item__proof"
                    href={payment.proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img src={payment.proofUrl} alt="Proof of payment" loading="lazy" />
                  </a>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
