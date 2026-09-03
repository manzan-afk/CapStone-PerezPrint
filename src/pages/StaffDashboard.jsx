import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllOrders, updateOrderStatus } from "../services/ordersService";
import "./StaffDashboard.css";

const ORDER_STATUSES = ["placed", "printing", "ready", "completed"];

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
          <div className="dashboard-content dashboard-content--empty">
            {/* Intentionally blank — content coming later */}
          </div>
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

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

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
          {orders.map((order) => (
            <div key={order.id} className="ord-card">
              <div className="ord-card__header">
                <div>
                  <span className="ord-card__service">{order.serviceName || "Service"}</span>
                  <span className="ord-card__date">{formatDate(order.createdAt)}</span>
                </div>
                <span className={`order-status order-status--${order.status || "placed"}`}>
                  {statusLabel(order.status)}
                </span>
              </div>

              <div className="ord-card__customer">{order.customerEmail || "Unknown customer"}</div>

              {order.description && (
                <p className="ord-card__desc">{order.description}</p>
              )}

              {(order.quantity || order.totalPrice != null) && (
                <div className="ord-card__meta">
                  {order.quantity && (
                    <span>
                      Qty: {order.quantity} {order.unit || ""}
                    </span>
                  )}
                  {order.totalPrice != null && (
                    <span className="ord-card__total">
                      Total: ₱{Number(order.totalPrice).toFixed(2)}
                    </span>
                  )}
                </div>
              )}

              {order.files?.length > 0 && (
                <div className="ord-card__files">
                  {order.files.map((f, i) => (
                    <a
                      key={i}
                      href={f.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ord-card__file-link"
                    >
                      📎 {f.name}
                    </a>
                  ))}
                </div>
              )}

              <div className="ord-card__actions">
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}