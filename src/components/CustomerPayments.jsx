import { useState, useEffect, useRef } from "react";
import { getUserOrders, uploadOrderFiles } from "../services/ordersService";
import { submitPayment, getCustomerPayments } from "../services/paymentService";
import "./CustomerPayments.css";

const MAX_PROOF_BYTES = 5 * 1024 * 1024;
const PAYMENT_STATUS_LABELS = {
  pending: "Pending review",
  verified: "Verified",
  rejected: "Rejected",
};

const PAYMENT_STEPS = [
  "Send the exact order amount through GCash.",
  "Copy the reference number from your GCash receipt.",
  "Fill in the form and attach a screenshot of the receipt.",
  "The shop verifies your payment and updates its status here.",
];

function formatDate(value) {
  const date = value?.toDate ? value.toDate() : null;
  if (!date) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

function formatPeso(value) {
  return `₱${Number(value || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function CustomerPayments({ uid, email }) {
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [orderId, setOrderId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState("");
  const proofPreviewRef = useRef("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (uid) loadData();
  }, [uid]);

  // Preview URLs are created when a file is picked and revoked when it's replaced, cleared or unmounted.
  useEffect(() => () => {
    if (proofPreviewRef.current) URL.revokeObjectURL(proofPreviewRef.current);
  }, []);

  function setProof(file) {
    if (proofPreviewRef.current) URL.revokeObjectURL(proofPreviewRef.current);
    const previewUrl = file && file.type.startsWith("image/") ? URL.createObjectURL(file) : "";
    proofPreviewRef.current = previewUrl;
    setProofPreview(previewUrl);
    setProofFile(file);
  }

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

  const amountDue = payableOrders.reduce((sum, order) => sum + Number(order.totalPrice), 0);
  const pendingPayments = payments.filter((payment) => payment.status === "pending");
  const amountPending = pendingPayments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const amountVerified = payments
    .filter((payment) => payment.status === "verified")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  function handleFileChange(event) {
    setProof(event.target.files?.[0] || null);
    setErrors((previous) => ({ ...previous, proof: "" }));
  }

  function clearFile() {
    setProof(null);
    setFileInputKey((key) => key + 1);
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
      clearFile();
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
    <div className="dashboard-content cpay">
      {loadError && <div className="um-error">{loadError}</div>}

      <div className="cpay-stats">
        <div className="cpay-stat cpay-stat--due">
          <span className="cpay-stat__label">Awaiting payment</span>
          <strong className="cpay-stat__value">{formatPeso(amountDue)}</strong>
          <span className="cpay-stat__note">
            {payableOrders.length} order{payableOrders.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="cpay-stat cpay-stat--pending">
          <span className="cpay-stat__label">Pending review</span>
          <strong className="cpay-stat__value">{formatPeso(amountPending)}</strong>
          <span className="cpay-stat__note">
            {pendingPayments.length} payment{pendingPayments.length === 1 ? "" : "s"}
          </span>
        </div>
        <div className="cpay-stat cpay-stat--verified">
          <span className="cpay-stat__label">Verified</span>
          <strong className="cpay-stat__value">{formatPeso(amountVerified)}</strong>
          <span className="cpay-stat__note">Total confirmed</span>
        </div>
      </div>

      <div className="cpay-layout">
        <section className="cpay-card">
          <header className="cpay-card__header">
            <h3>Submit a GCash payment</h3>
            <p>Provide your receipt details so we can confirm your payment.</p>
          </header>

          {status.text && (
            <div className={`cpay-status cpay-status--${status.type}`} role="status">
              {status.text}
            </div>
          )}

          {payableOrders.length === 0 ? (
            <div className="cpay-empty">
              <strong>You're all caught up</strong>
              <span>No orders are waiting for payment right now.</span>
            </div>
          ) : (
            <form className="cpay-form" onSubmit={handleSubmit} noValidate>
              <div className="cpay-field">
                <label className="cpay-label" htmlFor="payOrder">Order</label>
                <select
                  id="payOrder"
                  className="cpay-input"
                  value={orderId}
                  onChange={(event) => {
                    setOrderId(event.target.value);
                    setErrors((previous) => ({ ...previous, order: "" }));
                  }}
                >
                  <option value="">Select an order</option>
                  {payableOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.referenceId || order.id} — {formatPeso(order.totalPrice)}
                    </option>
                  ))}
                </select>
                {errors.order && <span className="cpay-error">{errors.order}</span>}
              </div>

              <div className="cpay-field">
                <label className="cpay-label" htmlFor="payReference">GCash reference number</label>
                <input
                  id="payReference"
                  className="cpay-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="e.g. 1234567890123"
                  value={referenceNumber}
                  onChange={(event) => {
                    setReferenceNumber(event.target.value);
                    setErrors((previous) => ({ ...previous, reference: "" }));
                  }}
                />
                {errors.reference && <span className="cpay-error">{errors.reference}</span>}
              </div>

              <div className="cpay-field">
                <span className="cpay-label">Proof of payment</span>
                {proofFile ? (
                  <div className="cpay-proof">
                    {proofPreview && <img src={proofPreview} alt="Selected receipt" />}
                    <div className="cpay-proof__info">
                      <strong>{proofFile.name}</strong>
                      <span>{(proofFile.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <button type="button" className="cpay-link-btn" onClick={clearFile}>
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="cpay-dropzone" htmlFor="payProof">
                    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M19 18H6.5a4.5 4.5 0 0 1-.7-8.95A6 6 0 0 1 17.4 7.7 5.2 5.2 0 0 1 19 18Zm-6-7.6-3 3 1.4 1.4 1.6-1.6V17h2v-3.8l1.6 1.6 1.4-1.4-3-3a1.4 1.4 0 0 0-2 0Z"
                      />
                    </svg>
                    <strong>Click to upload a screenshot</strong>
                    <span>PNG or JPG, up to 5 MB</span>
                  </label>
                )}
                <input
                  key={fileInputKey}
                  id="payProof"
                  className="cpay-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {errors.proof && <span className="cpay-error">{errors.proof}</span>}
              </div>

              <div className="cpay-total">
                <span>Amount to pay</span>
                <strong>{selectedOrder ? formatPeso(selectedOrder.totalPrice) : "—"}</strong>
              </div>

              <button type="submit" className="cpay-submit" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit payment"}
              </button>
            </form>
          )}
        </section>

        <aside className="cpay-card cpay-card--steps">
          <header className="cpay-card__header">
            <h3>How it works</h3>
          </header>
          <ol className="cpay-steps">
            {PAYMENT_STEPS.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <p className="cpay-note">
            Make sure the amount matches your order total exactly. Payments that don't match may
            be rejected, and you can resubmit them from this page.
          </p>
        </aside>
      </div>

      <section className="cpay-card cpay-history">
        <header className="cpay-card__header">
          <h3>Payment history</h3>
          <p>Every payment you've submitted and its current status.</p>
        </header>

        {payments.length === 0 ? (
          <div className="cpay-empty">
            <strong>No payments yet</strong>
            <span>Your submitted payments will appear here.</span>
          </div>
        ) : (
          <div className="cpay-table" role="table">
            <div className="cpay-table__row cpay-table__row--head" role="row">
              <span role="columnheader">Order</span>
              <span role="columnheader">Amount</span>
              <span role="columnheader">Reference no.</span>
              <span role="columnheader">Submitted</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Proof</span>
            </div>
            {payments.map((payment) => (
              <div className="cpay-table__row" role="row" key={payment.id}>
                <span role="cell" data-label="Order" className="cpay-table__strong">
                  {payment.orderReference || "—"}
                </span>
                <span role="cell" data-label="Amount">{formatPeso(payment.amount)}</span>
                <span role="cell" data-label="Reference no.">{payment.referenceNumber}</span>
                <span role="cell" data-label="Submitted">{formatDate(payment.createdAt)}</span>
                <span role="cell" data-label="Status">
                  <span className={`cpay-badge cpay-badge--${payment.status}`}>
                    {PAYMENT_STATUS_LABELS[payment.status] || payment.status}
                  </span>
                </span>
                <span role="cell" data-label="Proof">
                  {payment.proofUrl ? (
                    <a
                      className="cpay-thumb"
                      href={payment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View proof of payment"
                    >
                      <img src={payment.proofUrl} alt="Proof of payment" loading="lazy" />
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
