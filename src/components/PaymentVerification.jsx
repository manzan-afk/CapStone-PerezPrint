import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  subscribeAllPayments,
  updatePaymentStatus,
  findDuplicateReference,
  PAYMENT_OPTIONS,
} from "../services/paymentService";
import { subscribeAllOrders } from "../services/ordersService";
import { sendPaymentReviewMessage } from "../services/messagingService";
import { getAllUsers } from "../services/userServices";
import PaymentBadge from "./PaymentBadge";
import "./CustomerPayments.css";
import "./OrderStatusTabs.css";
import "./PaymentVerification.css";

const ORDER_STATUS_LABELS = {
  placed: "Placed",
  printing: "Printing",
  ready: "Ready for Pickup",
  completed: "Picked Up",
  needs_revision: "Needs Revision",
  cancelled: "Cancelled",
};

const TABS = [
  { value: "all", label: "All Transactions" },
  { value: "pending", label: "Pending Payments" },
  { value: "verified", label: "Verified Payments" },
  { value: "rejected", label: "Rejected Payments" },
  { value: "completed", label: "Completed Transactions" },
];

const MAX_REASON_LENGTH = 200;

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

function displayName(user) {
  if (!user) return "";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "";
}

const sameAmount = (first, second) =>
  Math.round(Number(first) * 100) === Math.round(Number(second) * 100);

// Only staff and admin may open this page (the dashboards are guarded too; this is a second check).
export default function PaymentVerification() {
  const { user, profile, role } = useAuth();

  if (role !== "staff" && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  const reviewerName =
    `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || user?.email || "Staff";
  return (
    <TransactionManagement
      reviewer={{ id: user?.uid, name: reviewerName, role }}
    />
  );
}

function TransactionManagement({ reviewer }) {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [usersById, setUsersById] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [tab, setTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [optionFilter, setOptionFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState({ text: "", type: "" });
  const [detailsId, setDetailsId] = useState(null);
  // { payment, action: "verify" | "reject" | "refund" }
  const [dialog, setDialog] = useState(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stop = subscribeAllPayments(
      (list) => {
        setPayments(list);
        setLoadError("");
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load payments:", err);
        setLoadError("Failed to load payments. Please refresh and try again.");
        setLoading(false);
      }
    );
    return stop;
  }, []);

  useEffect(
    () =>
      subscribeAllOrders(setOrders, (err) => {
        console.error("Failed to load orders for transactions:", err);
      }),
    []
  );

  useEffect(() => {
    getAllUsers()
      .then((users) => setUsersById(Object.fromEntries(users.map((u) => [u.id, u]))))
      .catch((err) => console.error("Failed to load customer names:", err));
  }, []);

  const ordersById = Object.fromEntries(orders.map((order) => [order.id, order]));

  // One row per payment, joined with its order and customer.
  const transactions = payments.map((payment) => {
    const order = ordersById[payment.orderId] || null;
    const customer = usersById[payment.customerId] || null;
    const orderTotal = order?.totalPrice ?? payment.orderAmount ?? null;
    return {
      ...payment,
      order,
      customer,
      customerLabel: displayName(customer) || payment.customerName || payment.customerEmail || "Unknown customer",
      orderTotal,
      amountMatches: orderTotal != null && sameAmount(payment.amount, orderTotal),
      duplicateOf: payment.paymentStatus === "pending" ? findDuplicateReference(payment, payments) : null,
      isCompleted: payment.paymentStatus === "verified" && order?.status === "completed",
    };
  });

  const counts = {
    all: transactions.length,
    pending: transactions.filter((t) => t.paymentStatus === "pending").length,
    verified: transactions.filter((t) => t.paymentStatus === "verified").length,
    rejected: transactions.filter((t) => t.paymentStatus === "rejected").length,
    completed: transactions.filter((t) => t.isCompleted).length,
  };

  const searchValue = searchTerm.trim().toLowerCase();
  const fromMs = dateFrom ? new Date(`${dateFrom}T00:00:00`).getTime() : null;
  const toMs = dateTo ? new Date(`${dateTo}T23:59:59.999`).getTime() : null;

  const visibleTransactions = transactions.filter((t) => {
    if (tab === "completed" ? !t.isCompleted : tab !== "all" && t.paymentStatus !== tab) return false;
    if (optionFilter !== "all" && t.paymentOption !== optionFilter) return false;

    const createdMs = t.createdAt?.toMillis?.() ?? null;
    if (fromMs !== null && (createdMs === null || createdMs < fromMs)) return false;
    if (toMs !== null && (createdMs === null || createdMs > toMs)) return false;

    if (!searchValue) return true;
    return [
      t.customerLabel,
      t.customerEmail,
      t.customer?.email,
      t.orderReference,
      t.referenceNumber,
      String(t.amount),
    ].some((value) => value?.toLowerCase().includes(searchValue));
  });

  const hasFilters = Boolean(searchValue || optionFilter !== "all" || dateFrom || dateTo);
  const detailsTransaction = transactions.find((t) => t.id === detailsId) || null;
  const dialogTransaction = dialog ? transactions.find((t) => t.id === dialog.payment.id) || dialog.payment : null;

  function reviewerOf(userId) {
    return displayName(usersById[userId]) || "staff";
  }

  // Why a pending payment can't be approved yet, or "" when it can.
  function approveBlocker(t) {
    if (!t.order) return "The order for this payment no longer exists.";
    if (!t.amountMatches) return "The amount sent doesn't match the full order amount.";
    if (t.duplicateOf) return "This reference number is already used by another payment.";
    return "";
  }

  function openDialog(payment, action) {
    setDetailsId(null);
    setDialog({ payment, action });
    setReason("");
    setReasonError("");
  }

  function closeDialog() {
    if (!busy) setDialog(null);
  }

  async function handleConfirm() {
    const { payment, action } = dialog;
    const trimmedReason = reason.trim();
    if (action === "reject" && !trimmedReason) {
      setReasonError("Enter a short reason so the customer knows what to fix.");
      return;
    }

    const nextStatus = action === "verify" ? "verified" : action === "reject" ? "rejected" : "refunded";
    const orderLabel = payment.orderReference || "the order";

    setBusy(true);
    setStatus({ text: "", type: "" });
    try {
      await updatePaymentStatus(payment.id, nextStatus, {
        reviewerId: reviewer.id,
        reason: trimmedReason,
      });

      let text =
        action === "verify"
          ? `Payment for ${orderLabel} verified. The order can now go to printing.`
          : action === "reject"
          ? `Payment for ${orderLabel} rejected.`
          : `Payment for ${orderLabel} marked as refunded.`;

      if (action !== "refund") {
        try {
          await sendPaymentReviewMessage({
            payment,
            sender: reviewer,
            outcome: nextStatus,
            reason: trimmedReason,
          });
        } catch (messageError) {
          console.error("Failed to notify customer about payment review:", messageError);
          text += " The customer could not be messaged, but they can see the status on their Payments page.";
        }
      }

      setStatus({ text, type: "success" });
      setDialog(null);
    } catch (err) {
      console.error("Failed to review payment:", err);
      setDialog(null);
      const messages = {
        "payment-already-reviewed": "This payment was already reviewed by someone else.",
        "amount-mismatch": "The amount sent does not match the full order amount, so it can't be verified.",
        "duplicate-reference": "This reference number is already used by another payment.",
        "order-missing": "The order for this payment no longer exists.",
        "permission-denied": "You don't have permission to review this payment.",
      };
      setStatus({
        text: messages[err.code] || "Failed to update the payment. Please try again.",
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  function renderActions(t) {
    if (t.paymentStatus === "pending") {
      const blocker = approveBlocker(t);
      return (
        <>
          <button
            type="button"
            className="pverify-btn pverify-btn--verify"
            onClick={() => openDialog(t, "verify")}
            disabled={Boolean(blocker)}
            title={blocker || "Approve this payment"}
          >
            Approve
          </button>
          <button
            type="button"
            className="pverify-btn pverify-btn--reject"
            onClick={() => openDialog(t, "reject")}
          >
            Reject
          </button>
        </>
      );
    }
    if (t.paymentStatus === "verified") {
      return (
        <button type="button" className="pverify-btn" onClick={() => openDialog(t, "refund")}>
          Refund
        </button>
      );
    }
    return null;
  }

  if (loading) {
    return <div className="dashboard-content">Loading payments...</div>;
  }

  return (
    <div className="dashboard-content cpay">
      {loadError && <div className="um-error">{loadError}</div>}

      <section className="cpay-card cpay-history">
        <header className="cpay-card__header">
          <h3>Transactions</h3>
          <p>
            Verify each GCash receipt against the full order amount. Orders can only start
            printing once their payment is verified.
          </p>
        </header>

        {status.text && (
          <div className={`cpay-status cpay-status--${status.type}`} role="status">
            {status.text}
          </div>
        )}

        <div className="order-status-tabs" role="tablist" aria-label="Filter transactions">
          {TABS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              className={`order-status-tabs__btn${tab === item.value ? " order-status-tabs__btn--active" : ""}`}
              onClick={() => setTab(item.value)}
            >
              {item.label}
              <span className="order-status-tabs__count">{counts[item.value]}</span>
            </button>
          ))}
        </div>

        <div className="pverify-filters">
          <input
            type="search"
            className="cpay-input pverify-filters__search"
            placeholder="Search customer, order, reference no. or amount..."
            aria-label="Search transactions"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
          <select
            className="cpay-input"
            aria-label="Filter by payment option"
            value={optionFilter}
            onChange={(event) => setOptionFilter(event.target.value)}
          >
            <option value="all">All payment options</option>
            {PAYMENT_OPTIONS.map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <label className="pverify-filters__date">
            From
            <input
              type="date"
              className="cpay-input"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>
          <label className="pverify-filters__date">
            To
            <input
              type="date"
              className="cpay-input"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>
          {hasFilters && (
            <button
              type="button"
              className="cpay-link-btn"
              onClick={() => {
                setSearchTerm("");
                setOptionFilter("all");
                setDateFrom("");
                setDateTo("");
              }}
            >
              Clear filters
            </button>
          )}
        </div>

        {visibleTransactions.length === 0 ? (
          <div className="cpay-empty">
            <strong>
              {hasFilters
                ? "No transactions match your filters"
                : tab === "pending"
                ? "Nothing to review"
                : "No transactions found"}
            </strong>
            <span>
              {hasFilters
                ? "Try a different search or date range."
                : tab === "pending"
                ? "New payments waiting for verification will appear here."
                : "There are no transactions in this category."}
            </span>
          </div>
        ) : (
          <div className="cpay-table pverify-table" role="table">
            <div className="cpay-table__row cpay-table__row--head" role="row">
              <span role="columnheader">Customer</span>
              <span role="columnheader">Order</span>
              <span role="columnheader">Amount sent</span>
              <span role="columnheader">Reference no.</span>
              <span role="columnheader">Submitted</span>
              <span role="columnheader">Status</span>
              <span role="columnheader">Receipt</span>
              <span role="columnheader">Actions</span>
            </div>
            {visibleTransactions.map((t) => (
              <div className="cpay-table__row" role="row" key={t.id}>
                <span role="cell" data-label="Customer" className="cpay-table__strong">
                  {t.customerLabel}
                </span>
                <span role="cell" data-label="Order">
                  {t.orderReference || "—"}
                  {t.order && (
                    <span className="pverify-review">
                      {ORDER_STATUS_LABELS[t.order.status || "placed"] || t.order.status}
                    </span>
                  )}
                </span>
                <span role="cell" data-label="Amount sent">
                  {formatPeso(t.amount)}
                  {t.orderTotal != null && (
                    <span className={`pverify-review${t.amountMatches ? "" : " pverify-review--warn"}`}>
                      {t.amountMatches ? "Matches order total" : `Order total ${formatPeso(t.orderTotal)}`}
                    </span>
                  )}
                </span>
                <span role="cell" data-label="Reference no.">
                  {t.referenceNumber}
                  {t.duplicateOf && (
                    <span className="pverify-review pverify-review--warn">Duplicate reference</span>
                  )}
                </span>
                <span role="cell" data-label="Submitted">{formatDate(t.createdAt)}</span>
                <span role="cell" data-label="Status">
                  <PaymentBadge status={t.paymentStatus} />
                  {t.paymentStatus === "verified" && t.verifiedAt && (
                    <span className="pverify-review">
                      by {reviewerOf(t.verifiedBy)} · {formatDate(t.verifiedAt)}
                    </span>
                  )}
                  {t.paymentStatus === "rejected" && t.rejectedAt && (
                    <span className="pverify-review">
                      by {reviewerOf(t.rejectedBy)} · {formatDate(t.rejectedAt)}
                    </span>
                  )}
                  {t.paymentStatus === "rejected" && t.rejectionReason && (
                    <span className="pverify-review">Reason: {t.rejectionReason}</span>
                  )}
                </span>
                <span role="cell" data-label="Receipt">
                  {t.receiptUrl ? (
                    <a
                      className="cpay-thumb"
                      href={t.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open full image"
                    >
                      <img src={t.receiptUrl} alt="Payment receipt" loading="lazy" />
                    </a>
                  ) : (
                    "—"
                  )}
                </span>
                <span role="cell" data-label="Actions" className="pverify-actions">
                  <button type="button" className="pverify-btn" onClick={() => setDetailsId(t.id)}>
                    Details
                  </button>
                  {renderActions(t)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {detailsTransaction && (
        <div className="pverify-overlay" onClick={() => setDetailsId(null)}>
          <div
            className="pverify-dialog pverify-dialog--wide"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pverifyDetailsTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="pverifyDetailsTitle">Transaction details</h3>
            <dl className="pverify-details">
              <div>
                <dt>Customer</dt>
                <dd>{detailsTransaction.customerLabel}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{detailsTransaction.customer?.email || detailsTransaction.customerEmail || "—"}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{detailsTransaction.customer?.phone || "—"}</dd>
              </div>
              <div>
                <dt>Order</dt>
                <dd>
                  {detailsTransaction.orderReference || "—"}
                  {detailsTransaction.order
                    ? ` · ${ORDER_STATUS_LABELS[detailsTransaction.order.status || "placed"]}`
                    : ""}
                </dd>
              </div>
              <div>
                <dt>Order total</dt>
                <dd>
                  {detailsTransaction.orderTotal != null ? formatPeso(detailsTransaction.orderTotal) : "—"}
                </dd>
              </div>
              <div>
                <dt>Amount sent</dt>
                <dd>
                  {formatPeso(detailsTransaction.amount)}
                  {detailsTransaction.orderTotal != null && !detailsTransaction.amountMatches && (
                    <span className="pverify-review pverify-review--warn">Does not match the order total</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Payment option</dt>
                <dd>
                  {detailsTransaction.paymentMethod || "GCash"}
                  {detailsTransaction.paymentOption ? ` · ${detailsTransaction.paymentOption}` : ""}
                </dd>
              </div>
              <div>
                <dt>Reference no.</dt>
                <dd>
                  {detailsTransaction.referenceNumber}
                  {detailsTransaction.duplicateOf && (
                    <span className="pverify-review pverify-review--warn">Duplicate reference</span>
                  )}
                </dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(detailsTransaction.createdAt)}</dd>
              </div>
              <div>
                <dt>Payment status</dt>
                <dd><PaymentBadge status={detailsTransaction.paymentStatus} /></dd>
              </div>
              {detailsTransaction.verifiedAt && (
                <div>
                  <dt>Verified</dt>
                  <dd>
                    {reviewerOf(detailsTransaction.verifiedBy)} · {formatDate(detailsTransaction.verifiedAt)}
                  </dd>
                </div>
              )}
              {detailsTransaction.rejectedAt && (
                <div>
                  <dt>Rejected</dt>
                  <dd>
                    {reviewerOf(detailsTransaction.rejectedBy)} · {formatDate(detailsTransaction.rejectedAt)}
                    {detailsTransaction.rejectionReason && (
                      <span className="pverify-review">Reason: {detailsTransaction.rejectionReason}</span>
                    )}
                  </dd>
                </div>
              )}
              {detailsTransaction.refundedAt && (
                <div>
                  <dt>Refunded</dt>
                  <dd>
                    {reviewerOf(detailsTransaction.refundedBy)} · {formatDate(detailsTransaction.refundedAt)}
                  </dd>
                </div>
              )}
            </dl>

            {detailsTransaction.receiptUrl && (
              <a
                href={detailsTransaction.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open full image"
              >
                <img
                  className="pverify-receipt"
                  src={detailsTransaction.receiptUrl}
                  alt="Payment receipt"
                />
              </a>
            )}

            <div className="pverify-dialog__actions">
              <button type="button" className="pverify-btn" onClick={() => setDetailsId(null)}>
                Close
              </button>
              {renderActions(detailsTransaction)}
            </div>
          </div>
        </div>
      )}

      {dialog && dialogTransaction && (
        <div className="pverify-overlay" onClick={closeDialog}>
          <div
            className="pverify-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pverifyTitle"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 id="pverifyTitle">
              {dialog.action === "verify"
                ? "Approve this payment?"
                : dialog.action === "reject"
                ? "Reject this payment"
                : "Mark this payment as refunded?"}
            </h3>
            <p className="pverify-dialog__summary">
              {dialogTransaction.customerLabel || dialogTransaction.customerEmail} ·{" "}
              {dialogTransaction.orderReference || "—"}
              <br />
              Amount sent: <strong>{formatPeso(dialogTransaction.amount)}</strong>
              {dialogTransaction.orderTotal != null && (
                <> · Order total: <strong>{formatPeso(dialogTransaction.orderTotal)}</strong></>
              )}
              <br />
              Ref. {dialogTransaction.referenceNumber}
            </p>

            {dialog.action === "verify" && (
              <p className="pverify-dialog__text">
                This confirms the full amount was received. The order stays as it is, but it can
                then be moved to Printing. This can't be undone.
              </p>
            )}
            {dialog.action === "refund" && (
              <p className="pverify-dialog__text">
                Use this after returning the money to the customer. The order's payment status
                becomes Refunded.
              </p>
            )}
            {dialog.action === "reject" && (
              <div className="cpay-field">
                <label className="cpay-label" htmlFor="pverifyReason">
                  Reason (shown to the customer)
                </label>
                <textarea
                  id="pverifyReason"
                  className="cpay-input"
                  rows={3}
                  maxLength={MAX_REASON_LENGTH}
                  placeholder="e.g. Amount doesn't match the order total"
                  value={reason}
                  autoFocus
                  onChange={(event) => {
                    setReason(event.target.value);
                    setReasonError("");
                  }}
                />
                {reasonError && <span className="cpay-error">{reasonError}</span>}
              </div>
            )}

            <div className="pverify-dialog__actions">
              <button type="button" className="pverify-btn" onClick={closeDialog} disabled={busy}>
                Cancel
              </button>
              <button
                type="button"
                className={`pverify-btn ${
                  dialog.action === "reject" ? "pverify-btn--reject" : "pverify-btn--verify"
                }`}
                onClick={handleConfirm}
                disabled={busy}
              >
                {busy
                  ? "Saving..."
                  : dialog.action === "verify"
                  ? "Yes, approve"
                  : dialog.action === "reject"
                  ? "Reject payment"
                  : "Mark refunded"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
