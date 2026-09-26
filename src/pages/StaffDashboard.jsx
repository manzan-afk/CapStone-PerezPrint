import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllOrders, updateOrderStatus, requestOrderRevision } from "../services/ordersService";
import "./StaffDashboard.css";

const ORDER_STATUSES = ["placed", "printing", "ready", "completed", "needs_revision"];

function statusLabel(s) {
  switch (s) {
    case "placed":
      return "Placed";
    case "printing":
      return "Printing";
    case "ready":
      return "Ready for Pickup";
    case "completed":
      return "Completed";
    case "needs_revision":
      return "Needs Revision";
    default:
      return s || "Placed";
  }
}

export default function StaffDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("dashboard"); // "dashboard" | "orders"
  const navigate = useNavigate();
  const { logout, user, profile } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/");
  }

  const navItems = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: (
        <path
          fill="currentColor"
          d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z"
        />
      ),
    },
    {
      key: "orders",
      label: "Orders",
      icon: (
        <path
          fill="currentColor"
          d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Zm0 2h12l1.5 2h-15L6 4Zm-1 4h14v12H5V8Zm3 2v2h8v-2H8Z"
        />
      ),
    },
    {
      key: "pickup",
      label: "Pickup Schedule",
      icon: (
        <path
          fill="currentColor"
          d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm-2 8h14v10H5V10Z"
        />
      ),
    },
    {
      key: "notifications",
      label: "Notifications",
      icon: (
        <path
          fill="currentColor"
          d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5a6 6 0 0 0-4-5.65V4a2 2 0 0 0-4 0v1.35A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"
        />
      ),
    },
  ];

  const activeLabel = navItems.find((item) => item.key === view)?.label || "Dashboard";

  return (
    <div className="dashboard-layout">
      {/* Mobile top bar */}
      <div className="mobile-topbar">
        <button
          className="mobile-menu-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path fill="currentColor" d="M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z" />
          </svg>
        </button>
        <div className="mobile-topbar__brand">
          <span className="brand-title">PEREZ</span>
        </div>
      </div>

      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          <img src="/logo.png" alt="Perez Printing Shop logo" className="sidebar__logo" />
          <div>
            <h1 className="brand-title">PEREZ</h1>
            <p className="brand-subtitle">Printing Shop</p>
          </div>
        </div>

        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <a
              key={item.key}
              href="#"
              className={`nav-item ${view === item.key ? "nav-item--active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                setView(item.key);
                setSidebarOpen(false);
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                {item.icon}
              </svg>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Profile photo" className="user-avatar-img" />
              ) : (
                <svg viewBox="0 0 24 24" width="22" height="22">
                  <path
                    fill="currentColor"
                    d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z"
                  />
                </svg>
              )}
            </div>
            <div className="user-text">
              <span className="user-name">
                {profile?.firstName || profile?.lastName
                  ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
                  : user?.email || "User"}
              </span>
              <span className="user-role">
                {profile?.role
                  ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1)
                  : "Staff"}
              </span>
              {user?.email && (
                <span className="user-email">{user.email}</span>
              )}
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path
                fill="currentColor"
                d="M10 17v-3H3v-4h7V7l5 5-5 5Zm9 2H12v-2h7V7h-7V5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z"
              />
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="dashboard-main">
        <header className="dashboard-header">
          <h2>{activeLabel}</h2>
        </header>

        {view === "dashboard" && (
          <StaffOverview
            displayName={
              profile?.firstName || profile?.lastName
                ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
                : user?.email || "Staff"
            }
            onGoToOrders={() => setView("orders")}
          />
        )}

        {view === "orders" && <OrderManagement />}

        {view !== "dashboard" && view !== "orders" && (
          <div className="dashboard-content dashboard-content--empty">
            Coming soon.
          </div>
        )}
      </main>
    </div>
  );
}

// Normalizes an order into a flat list of line items, whether it uses the
// current "items[]" shape or the older single-service fields.
function getOrderLines(order) {
  if (order.items?.length > 0) return order.items;
  if (order.serviceName) {
    return [
      {
        serviceName: order.serviceName,
        varietyName: order.varietyName || "",
        quantity: order.quantity || 1,
        unitPrice: order.unitPrice ?? null,
        lineTotal: order.totalPrice ?? null,
      },
    ];
  }
  return [];
}

function StaffOverview({ displayName, onGoToOrders }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const all = await getAllOrders();
      setOrders(all);
    } catch (err) {
      setError("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="dashboard-content">Loading dashboard...</div>;
  }

  const placedOrders = orders.filter((o) => (o.status || "placed") === "placed");
  const printingOrders = orders.filter((o) => o.status === "printing");
  const readyOrders = orders.filter((o) => o.status === "ready");
  const completedCount = orders.filter((o) => o.status === "completed").length;

  function formatDate(ts) {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      <h3 className="welcome-title">Welcome back, {displayName.split(" ")[0]}</h3>

      {placedOrders.length > 0 && (
        <div className="attention-banner">
          <span>
            ⚠️ {placedOrders.length} order{placedOrders.length > 1 ? "s" : ""}{" "}
            waiting for review
          </span>
          <button type="button" className="attention-banner__btn" onClick={onGoToOrders}>
            Review Now
          </button>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--review">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.9 15h-1.8v-1.8h1.8Zm1.86-7.05-.81.83A2.53 2.53 0 0 0 13 12.5V13h-1.8v-.62a3.1 3.1 0 0 1 1.1-2.15l1.1-1.1a1.5 1.5 0 1 0-2.6-1.02H8a3.5 3.5 0 1 1 6.76 1.24Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Awaiting Review</span>
          <span className="stat-card__value">{placedOrders.length}</span>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--printing">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Zm0 2h12l1.5 2h-15L6 4Zm-1 4h14v12H5V8Zm3 2v2h8v-2H8Z"/>
            </svg>
          </div>
          <span className="stat-card__label">In Printing</span>
          <span className="stat-card__value">{printingOrders.length}</span>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--ready">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm-2 8h14v10H5V10Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Ready for Pickup</span>
          <span className="stat-card__value">{readyOrders.length}</span>
        </div>
        <div className="stat-card stat-card--accent">
          <div className="stat-card__icon stat-card__icon--completed">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="m9 16.2-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Completed</span>
          <span className="stat-card__value">{completedCount}</span>
        </div>
      </div>

      <button type="button" className="quick-action-btn" onClick={onGoToOrders}>
        View All Orders
      </button>

      <h3 className="dashboard-section__title" style={{ marginTop: 26 }}>
        Orders Awaiting Review
      </h3>
      {placedOrders.length === 0 ? (
        <div className="um-empty">No orders are waiting for review right now.</div>
      ) : (
        <div className="ord-list">
          {placedOrders.slice(0, 5).map((order) => {
            const lines = getOrderLines(order);
            const summary =
              lines.length > 1
                ? `${lines[0].serviceName} + ${lines.length - 1} more`
                : lines[0]?.serviceName || "Order";
            return (
              <div key={order.id} className="ord-card">
                <div className="ord-card__header">
                  <div>
                    <span className="ord-card__service">{summary}</span>
                    <span className="ord-card__date">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className="order-status order-status--placed">Placed</span>
                </div>
                <div className="ord-card__customer">{order.customerEmail || "Unknown customer"}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const all = await getAllOrders();
      setOrders(all);
    } catch (err) {
      setError("Failed to load orders. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleStatusChange(orderId, newStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  }

  async function handleSaveStatus(orderId, status) {
    setSavingId(orderId);
    setSavedId(null);
    try {
      await updateOrderStatus(orderId, status);
      setSavedId(orderId);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      setError("Failed to update status. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleAccept(orderId) {
    setSavingId(orderId);
    try {
      await updateOrderStatus(orderId, "printing");
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: "printing" } : o))
      );
      setReviewOrder(null);
    } catch (err) {
      setError("Failed to accept order. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleRequestRevision(orderId, note) {
    setSavingId(orderId);
    try {
      await requestOrderRevision(orderId, note);
      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId ? { ...o, status: "needs_revision", staffNote: note } : o
        )
      );
      setReviewOrder(null);
    } catch (err) {
      setError("Failed to send revision request. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  function formatDate(ts) {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  if (loading) {
    return <div className="dashboard-content">Loading orders...</div>;
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      {orders.length === 0 ? (
        <div className="um-empty">No orders have been placed yet.</div>
      ) : (
        <div className="ord-list">
          {orders.map((order) => {
            const lines = getOrderLines(order);
            const summary =
              lines.length > 1
                ? `${lines[0].serviceName} + ${lines.length - 1} more item${
                    lines.length - 1 > 1 ? "s" : ""
                  }`
                : lines[0]
                ? `${lines[0].serviceName}${lines[0].varietyName ? ` (${lines[0].varietyName})` : ""}`
                : "Order";
            const isPlaced = (order.status || "placed") === "placed";

            return (
              <div key={order.id} className="ord-card">
                <div className="ord-card__header">
                  <div>
                    <span className="ord-card__service">{summary}</span>
                    <span className="ord-card__date">{formatDate(order.createdAt)}</span>
                  </div>
                  <span className={`order-status order-status--${order.status || "placed"}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>

                <div className="ord-card__customer">{order.customerEmail || "Unknown customer"}</div>

                {order.status === "needs_revision" && order.staffNote && (
                  <div className="ord-card__staff-note">
                    <strong>Your note to customer:</strong> {order.staffNote}
                  </div>
                )}

                {order.referenceId && (
                  <div className="ord-card__ref">Ref: {order.referenceId}</div>
                )}

                {order.totalPrice != null && (
                  <div className="ord-card__meta">
                    <span className="ord-card__total">
                      Total: ₱{Number(order.totalPrice).toFixed(2)}
                    </span>
                  </div>
                )}

                <div className="ord-card__actions">
                  {isPlaced ? (
                    <button
                      className="um-save-btn"
                      onClick={() => setReviewOrder(order)}
                    >
                      Review &amp; Accept
                    </button>
                  ) : (
                    <>
                      <select
                        className="um-role-select"
                        value={order.status || "placed"}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {statusLabel(s)}
                          </option>
                        ))}
                      </select>
                      <button
                        className="um-save-btn"
                        onClick={() => handleSaveStatus(order.id, order.status || "placed")}
                        disabled={savingId === order.id}
                      >
                        {savingId === order.id
                          ? "Saving..."
                          : savedId === order.id
                          ? "Saved ✓"
                          : "Save"}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {reviewOrder && (
        <ReviewOrderModal
          order={reviewOrder}
          saving={savingId === reviewOrder.id}
          onClose={() => setReviewOrder(null)}
          onAccept={() => handleAccept(reviewOrder.id)}
          onRequestRevision={(note) => handleRequestRevision(reviewOrder.id, note)}
        />
      )}
    </div>
  );
}

function ReviewOrderModal({ order, saving, onClose, onAccept, onRequestRevision }) {
  const [confirmed, setConfirmed] = useState(false);
  const [showRevisionNote, setShowRevisionNote] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [revisionError, setRevisionError] = useState("");
  const lines = getOrderLines(order);

  function handleSendRevision() {
    if (!revisionNote.trim()) {
      setRevisionError("Please explain what needs to change.");
      return;
    }
    setRevisionError("");
    onRequestRevision(revisionNote.trim());
  }

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="order-modal__close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h3 className="order-modal__title">Review Order</h3>
        <div className="review-customer">{order.customerEmail || "Unknown customer"}</div>
        {order.referenceId && (
          <div className="review-ref">Ref: {order.referenceId}</div>
        )}

        <div className="review-lines">
          {lines.map((line, i) => (
            <div key={i} className="review-line">
              <span>
                {line.serviceName}
                {line.varietyName ? ` (${line.varietyName})` : ""} x{line.quantity || 1}
              </span>
              <span>
                {line.lineTotal != null ? `₱${Number(line.lineTotal).toFixed(2)}` : "—"}
              </span>
            </div>
          ))}
        </div>

        {order.description && (
          <div className="review-section">
            <span className="field-label">Specifications / Description</span>
            <p className="review-desc">{order.description}</p>
          </div>
        )}

        {order.files?.length > 0 && (
          <div className="review-section">
            <span className="field-label">Attached Files</span>
            <div className="review-files">
              {order.files.map((f, i) => (
                <a
                  key={i}
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="order-card__file-link"
                >
                  📎 {f.name}
                </a>
              ))}
            </div>
          </div>
        )}

        {order.totalPrice != null && (
          <div className="review-total">
            TOTAL: ₱{Number(order.totalPrice).toFixed(2)}
          </div>
        )}

        <label className="review-confirm-check">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>
            I have reviewed the specifications and files for this order and
            confirm they are complete and printable.
          </span>
        </label>

        {!showRevisionNote ? (
          <div className="review-actions">
            <button
              type="button"
              className="review-reject-btn"
              onClick={() => setShowRevisionNote(true)}
              disabled={saving}
            >
              Request Changes
            </button>
            <button
              type="button"
              className="login-btn order-submit-btn"
              disabled={!confirmed || saving}
              onClick={onAccept}
            >
              {saving ? "Accepting..." : "Accept Order"}
            </button>
          </div>
        ) : (
          <div className="revision-note-block">
            <label className="field-label" htmlFor="revisionNote">
              What needs to change?
            </label>
            <textarea
              id="revisionNote"
              className="order-textarea"
              rows={3}
              placeholder="e.g. The uploaded file is blurry — please re-upload a higher resolution version."
              value={revisionNote}
              onChange={(e) => setRevisionNote(e.target.value)}
            />
            <div className="field-error">{revisionError}</div>
            <div className="review-actions">
              <button
                type="button"
                className="review-cancel-btn"
                onClick={() => {
                  setShowRevisionNote(false);
                  setRevisionNote("");
                  setRevisionError("");
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                className="review-reject-btn review-reject-btn--solid"
                onClick={handleSendRevision}
                disabled={saving}
              >
                {saving ? "Sending..." : "Send to Customer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}