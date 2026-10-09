import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import DirectMessages from "../components/DirectMessages";
import UnreadMessageBadge from "../components/UnreadMessageBadge";
import SidebarCountBadge from "../components/SidebarCountBadge";
import useSidebarOrderCounts from "../hooks/useSidebarOrderCounts";
import { markOrderNotificationsViewed } from "../services/userServices";
import { getAllServices } from "../services/servicesService";
import {
  uploadOrderFiles,
  createOrder,
  getUserOrders,
  subscribeUserOrders,
  cancelOrder,
} from "../services/ordersService";
import ProfileInfo from "../components/ProfileInfo";
import "./CustomerDashboard.css";
import { lineOptionsSuffix, getServiceUnits, formatPerUnit } from "../utils/orderLines";

export default function CustomerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("dashboard"); // "dashboard" | "services" | "orders" | ...
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const navigate = useNavigate();
  const { logout, user, profile } = useAuth();
  const orderCounts = useSidebarOrderCounts(user?.uid, "customer");

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
      key: "services",
      label: "Services",
      icon: (
        <path
          fill="currentColor"
          d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm13.5 0 1.6 3.4L21.5 17l-2.6 2.4L19.6 23l-3.1-1.8L13.4 23l.7-3.6L11.5 17l3.4-.6L16.5 13Z"
        />
      ),
    },
    {
      key: "orders",
      label: "My Orders",
      icon: (
        <path
          fill="currentColor"
          d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Zm0 2h12l1.5 2h-15L6 4Zm-1 4h14v12H5V8Zm3 2v2h8v-2H8Z"
        />
      ),
    },
    {
      key: "messages",
      label: "Messages",
      icon: (
        <path
          fill="currentColor"
          d="M4 4h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-9l-5 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v11h3v1.5l2.5-1.5H20V6H4Zm3 3h10v2H7V9Zm0 4h7v2H7v-2Z"
        />
      ),
    },
    {
      key: "payments",
      label: "Payments",
      icon: (
        <path
          fill="currentColor"
          d="M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2Zm0 4H4V6h16v2Zm0 2v8H4v-8h16Z"
        />
      ),
    },
    {
      key: "pickup",
      label: "Pickup",
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

  const activeLabel =
    view === "profile"
      ? "Personal Information"
      : navItems.find((item) => item.key === view)?.label || "Dashboard";

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
                if (item.key === "notifications" && user?.uid) {
                  markOrderNotificationsViewed(user.uid).catch((error) => {
                    console.error("Failed to mark order notifications as viewed:", error);
                  });
                }
              }}
            >
              <svg viewBox="0 0 24 24" width="20" height="20">
                {item.icon}
              </svg>
              {item.label}
              {item.key === "orders" && (
                <SidebarCountBadge count={orderCounts.activeOrders} label="active orders" />
              )}
              {item.key === "pickup" && (
                <SidebarCountBadge count={orderCounts.readyPickups} label="ready pickups" />
              )}
              {item.key === "notifications" && (
                <SidebarCountBadge
                  count={orderCounts.unreadOrderNotifications}
                  label="unread order notifications"
                />
              )}
              {item.key === "messages" && <UnreadMessageBadge uid={user?.uid} />}
            </a>
          ))}
        </nav>

        <div className="sidebar__footer">
          <button
            type="button"
            className={`user-info user-info--button ${view === "profile" ? "user-info--active" : ""}`}
            onClick={() => {
              setView("profile");
              setSidebarOpen(false);
            }}
            aria-label="Open personal information"
          >
            <div className="user-avatar">
              {(profile?.photoURL || user?.photoURL) && !profileImageFailed ? (
                <img
                  src={profile?.photoURL || user.photoURL}
                  alt="Profile photo"
                  className="user-avatar-img"
                  onError={() => setProfileImageFailed(true)}
                />
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
                  : "Customer"}
              </span>
              {user?.email && <span className="user-email">{user.email}</span>}
            </div>
          </button>

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
          <CustomerOverview
            uid={user?.uid}
            displayName={
              profile?.firstName || profile?.lastName
                ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
                : user?.email || "Customer"
            }
            customerName={
              profile?.firstName || profile?.lastName
                ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
                : user?.email || "Customer"
            }
            onGoToServices={() => setView("services")}
            onGoToOrders={() => setView("orders")}
            onGoToSchedule={() => setView("pickup")}
          />
        )}

        {view === "services" && (
          <ServicesBrowser
            uid={user?.uid}
            email={user?.email}
            customerName={
              profile?.firstName || profile?.lastName
                ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
                : user?.email || "Customer"
            }
            onOrderPlaced={() => setView("orders")}
          />
        )}

        {view === "orders" && (
          <OrderHistory
            uid={user?.uid}
            customerName={
              profile?.firstName || profile?.lastName
                ? `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim()
                : user?.email || "Customer"
            }
          />
        )}

        {view === "notifications" && <OrderNotifications uid={user?.uid} />}

        {view === "pickup" && <PickupSchedule uid={user?.uid} />}

        {view === "profile" && <ProfileInfo user={user} profile={profile} />}

        {view === "messages" && (
          <DirectMessages
            uid={user?.uid}
            displayName={`${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || user?.email || "Customer"}
            role={profile?.role || "customer"}
          />
        )}

        {view !== "dashboard" && view !== "services" && view !== "orders" && view !== "notifications" && view !== "pickup" && view !== "messages" && (
          <div className="dashboard-content dashboard-content--empty">
            Coming soon.
          </div>
        )}
      </main>
    </div>
  );
}

function PickupSchedule({ uid }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return undefined;

    return subscribeUserOrders(
      uid,
      (userOrders) => {
        setOrders(userOrders);
        setError("");
        setLoading(false);
      },
      () => {
        setError("Failed to load your schedule. Please refresh and try again.");
        setLoading(false);
      }
    );
  }, [uid]);

  if (loading) {
    return <div className="dashboard-content">Loading your schedule...</div>;
  }

  const readyOrders = orders
    .filter((order) => order.status === "ready")
    .sort((first, second) => {
      const firstTime = first.pickupReadyAt?.toDate?.()?.getTime() || 0;
      const secondTime = second.pickupReadyAt?.toDate?.()?.getTime() || 0;
      return secondTime - firstTime;
    });

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      {readyOrders.length === 0 ? (
        <div className="um-empty">No orders are ready for pickup yet.</div>
      ) : (
        <div className="order-notifications" aria-live="polite">
          {readyOrders.map((order) => {
            const lines = getOrderLines(order);
            return (
              <article className="order-notification" key={order.id}>
                <div className="order-notification__header">
                  <h3>Ready for pickup</h3>
                  <time>{formatTimestamp(order.pickupReadyAt || order.statusUpdatedAt)}</time>
                </div>
                <p>Please bring your tracking number when collecting this order.</p>
                <dl className="order-notification__details">
                  <div>
                    <dt>Tracking number</dt>
                    <dd>{order.referenceId || "Not available"}</dd>
                  </div>
                  <div>
                    <dt>Order details</dt>
                    <dd>
                      {lines.length > 0
                        ? lines.map((line) => (
                          `${line.serviceName}${line.varietyName ? ` (${line.varietyName})` : ""}${lineOptionsSuffix(line)} x${line.quantity || 1}`
                        )).join(", ")
                        : "Order details unavailable"}
                    </dd>
                  </div>
                  {order.description && (
                    <div>
                      <dt>Specifications</dt>
                      <dd>{order.description}</dd>
                    </div>
                  )}
                  {order.totalPrice != null && (
                    <div>
                      <dt>Total</dt>
                      <dd>₱{Number(order.totalPrice).toFixed(2)}</dd>
                    </div>
                  )}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OrderNotifications({ uid }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!uid) return undefined;

    return subscribeUserOrders(
      uid,
      (userOrders) => {
        setOrders(userOrders);
        setError("");
        setLoading(false);
      },
      (subscriptionError) => {
        console.error("Failed to load order notifications:", subscriptionError);
        setError("Failed to load notifications. Please refresh and try again.");
        setLoading(false);
      }
    );
  }, [uid]);

  if (loading) {
    return <div className="dashboard-content">Loading notifications...</div>;
  }

  const notifications = [...orders].sort((first, second) => {
    const firstTime = first.statusUpdatedAt?.toDate?.()?.getTime()
      || first.createdAt?.toDate?.()?.getTime()
      || 0;
    const secondTime = second.statusUpdatedAt?.toDate?.()?.getTime()
      || second.createdAt?.toDate?.()?.getTime()
      || 0;
    return secondTime - firstTime;
  });

  const statusCopy = {
    placed: "We received your order and will begin processing it.",
    printing: "Your order is now being printed.",
    ready: "Your order is ready for pickup.",
    completed: "Your order has been picked up.",
    needs_revision: "Your order needs attention. Review the staff note below.",
    cancelled: "This order was cancelled.",
  };

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      {notifications.length === 0 ? (
        <div className="um-empty">No order notifications yet.</div>
      ) : (
        <div className="order-notifications" aria-live="polite">
          {notifications.map((order) => {
            const status = order.status || "placed";
            const lines = getOrderLines(order);
            const messageTime = order.statusUpdatedAt
              || order.pickupReadyAt
              || order.revisionRequestedAt
              || order.createdAt;

            return (
              <article className="order-notification" key={order.id}>
                <div className="order-notification__header">
                  <h3>
                    {status === "ready"
                      ? "Ready for pickup"
                      : status === "needs_revision"
                      ? "Order needs attention"
                      : status === "completed"
                      ? "Order picked up"
                      : `Order ${status.replaceAll("_", " ")}`}
                  </h3>
                  <time>{formatTimestamp(messageTime)}</time>
                </div>
                <p>{statusCopy[status] || `Your order status is ${status}.`}</p>

                <dl className="order-notification__details">
                  <div>
                    <dt>Tracking number</dt>
                    <dd>{order.referenceId || "Not available"}</dd>
                  </div>
                  <div>
                    <dt>Order details</dt>
                    <dd>
                      {lines.length > 0
                        ? lines.map((line) =>
                            `${line.serviceName}${line.varietyName ? ` (${line.varietyName})` : ""}${lineOptionsSuffix(line)} x${line.quantity || 1}`
                          ).join(", ")
                        : "Order details unavailable"}
                    </dd>
                  </div>
                  {order.staffNote && (
                    <div>
                      <dt>Staff note</dt>
                      <dd>{order.staffNote}</dd>
                    </div>
                  )}
                  {order.description && (
                    <div>
                      <dt>Additional details</dt>
                      <dd>{order.description}</dd>
                    </div>
                  )}
                  {order.totalPrice != null && (
                    <div>
                      <dt>Total</dt>
                      <dd>₱{Number(order.totalPrice).toFixed(2)}</dd>
                    </div>
                  )}
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomerOverview({ uid, displayName, customerName, onGoToServices, onGoToOrders, onGoToSchedule }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (uid) loadOrders();
  }, [uid]);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const userOrders = await getUserOrders(uid);
      setOrders(userOrders);
    } catch (err) {
      console.error("Failed to load orders (overview):", err);
      setError("Failed to load your orders.");
    } finally {
      setLoading(false);
    }
  }

  function statusLabel(s) {
    switch (s) {
      case "placed":
        return "Placed";
      case "printing":
        return "Printing";
      case "ready":
        return "Ready for Pickup";
      case "completed":
        return "Picked Up";
      case "needs_revision":
        return "Needs Revision";
      case "cancelled":
        return "Cancelled";
      default:
        return s || "Placed";
    }
  }

  if (loading) {
    return <div className="dashboard-content">Loading your dashboard...</div>;
  }

  const activeCount = orders.filter((o) =>
    ["placed", "printing", "ready"].includes(o.status || "placed")
  ).length;
  const completedCount = orders.filter((o) => o.status === "completed").length;
  const totalSpent = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);
  const readyForPickup = orders.filter((o) => o.status === "ready");

  const recentOrders = [...orders]
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 3);

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      <h3 className="welcome-title">Welcome back, {displayName.split(" ")[0]} 👋</h3>

      {readyForPickup.length > 0 && (
        <div className="pickup-banner">
          <span>
            🎉 You have {readyForPickup.length} order
            {readyForPickup.length > 1 ? "s" : ""} ready for pickup!
          </span>
          <button type="button" className="pickup-banner__btn" onClick={onGoToSchedule}>
            View Schedule
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--total">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Zm0 2h12l1.5 2h-15L6 4Zm-1 4h14v12H5V8Zm3 2v2h8v-2H8Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Total Orders</span>
          <span className="stat-card__value">{orders.length}</span>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--active">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2Zm6-6v-5a6 6 0 0 0-4-5.65V4a2 2 0 0 0-4 0v1.35A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Active Orders</span>
          <span className="stat-card__value">{activeCount}</span>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon stat-card__icon--completed">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="m9 16.2-3.5-3.5L4 14.2 9 19.2 20 8.2l-1.5-1.5Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Picked Up</span>
          <span className="stat-card__value">{completedCount}</span>
        </div>
        <div className="stat-card stat-card--accent">
          <div className="stat-card__icon stat-card__icon--spent">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.5 15.5v1h-1v-1c-1.4-.2-2.5-1-2.9-2.4l1.4-.6c.3.9 1 1.4 2 1.4.9 0 1.6-.4 1.6-1.1 0-.7-.5-1-1.9-1.4-1.8-.5-2.9-1.1-2.9-2.7 0-1.3 1-2.2 2.4-2.4v-1h1v1c1.2.2 2.1.9 2.5 2l-1.4.6c-.3-.7-.9-1.1-1.7-1.1-.8 0-1.4.4-1.4 1s.5.9 1.8 1.3c2 .6 3 1.2 3 2.8 0 1.4-1.1 2.3-2.5 2.5Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Total Spent</span>
          <span className="stat-card__value">₱{totalSpent.toFixed(2)}</span>
        </div>
      </div>

      {/* Quick actions */}
      <div className="quick-actions">
        <button type="button" className="quick-action-btn" onClick={onGoToServices}>
          <svg viewBox="0 0 24 24" width="18" height="18">
            <path
              fill="currentColor"
              d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm13.5 0 1.6 3.4L21.5 17l-2.6 2.4L19.6 23l-3.1-1.8L13.4 23l.7-3.6L11.5 17l3.4-.6L16.5 13Z"
            />
          </svg>
          Browse Services
        </button>
        <button type="button" className="quick-action-btn quick-action-btn--outline" onClick={onGoToOrders}>
          View All Orders
        </button>
      </div>

      {/* Recent orders */}
      <h3 className="dashboard-section__title">Recent Orders</h3>
      {recentOrders.length === 0 ? (
        <div className="um-empty">
          You haven't placed any orders yet. Browse Services to get started.
        </div>
      ) : (
        <div className="order-history">
          {recentOrders.map((order) => {
            const lines = getOrderLines(order);
            const summary =
              lines.length > 1
                ? `${lines[0].serviceName} + ${lines.length - 1} more item${
                    lines.length - 1 > 1 ? "s" : ""
                  }`
                : lines[0]
                ? `${lines[0].serviceName}${lines[0].varietyName ? ` (${lines[0].varietyName})` : ""}`
                : "Order";

            return (
              <div
                key={order.id}
                className="order-card order-card--clickable"
                onClick={() => setSelectedOrder(order)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedOrder(order);
                }}
              >
                <div className="order-card__top">
                  <span className="order-card__service">{summary}</span>
                  <span className={`order-status order-status--${order.status || "placed"}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>
                {order.totalPrice != null && (
                  <div className="order-card__meta">
                    <span className="order-card__total">
                      Total: ₱{Number(order.totalPrice).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <Receipt
          order={selectedOrder}
          customerName={customerName}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}

function ServicesBrowser({ uid, email, customerName, onOrderPlaced }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartService, setCartService] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    setError("");
    try {
      const all = await getAllServices();
      setServices(all);
    } catch (err) {
      setError("Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="dashboard-content">Loading services...</div>;
  }

  const categories = [...new Set(services.map((service) => service.category?.trim()).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second));
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredServices = services.filter((service) => {
    const matchesCategory = categoryFilter === "all" || service.category?.trim() === categoryFilter;
    const searchableText = [
      service.name,
      service.category,
      service.description,
      ...(service.varieties || []).map((variety) => variety.name),
    ].join(" ").toLowerCase();
    return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch));
  });

  return (
    <div className="dashboard-content">
      {error && <div className="svc-browse-error">{error}</div>}

      {services.length === 0 ? (
        <div className="svc-browse-empty">
          No services are available yet — check back soon.
        </div>
      ) : (
        <>
          <div className="svc-browse-toolbar">
            <div>
              <h3>Browse print services</h3>
              <p>{filteredServices.length} of {services.length} services</p>
            </div>
            <label className="svc-browse-search">
              <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">
                <path d="m21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <input
                type="search"
                placeholder="Search services or options"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search services"
              />
            </label>
          </div>

          {categories.length > 0 && (
            <div className="svc-browse-categories" role="group" aria-label="Filter services by category">
              <button
                type="button"
                className={`svc-browse-category ${categoryFilter === "all" ? "svc-browse-category--active" : ""}`}
                onClick={() => setCategoryFilter("all")}
                aria-pressed={categoryFilter === "all"}
              >
                All services <span>{services.length}</span>
              </button>
              {categories.map((category) => {
                const count = services.filter((service) => service.category?.trim() === category).length;
                return (
                  <button
                    key={category}
                    type="button"
                    className={`svc-browse-category ${categoryFilter === category ? "svc-browse-category--active" : ""}`}
                    onClick={() => setCategoryFilter(category)}
                    aria-pressed={categoryFilter === category}
                  >
                    {category} <span>{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {filteredServices.length === 0 ? (
            <div className="svc-browse-empty svc-browse-empty--filtered">
              No services match your search. Try another term or category.
            </div>
          ) : (
            <div className="svc-browse-grid">
              {filteredServices.map((svc) => {
            const varietyPrices = (svc.varieties || [])
              .map((v) => v.price)
              .filter((p) => p != null);
            const minPrice = varietyPrices.length ? Math.min(...varietyPrices) : null;
            const maxPrice = varietyPrices.length ? Math.max(...varietyPrices) : null;

            let priceDisplay;
            if (minPrice != null) {
              priceDisplay =
                minPrice === maxPrice
                  ? `₱${minPrice.toFixed(2)}`
                  : `From ₱${minPrice.toFixed(2)}`;
            } else if (svc.price != null) {
              priceDisplay = `₱${Number(svc.price).toFixed(2)}`;
            } else {
              priceDisplay = "";
            }

            return (
              <button
                key={svc.id}
                type="button"
                className={`svc-card svc-card--clickable ${svc.available === false ? "svc-card--unavailable" : ""}`}
                onClick={() => setCartService(svc)}
                disabled={svc.available === false}
              >
                {svc.available === false && (
                  <span className="svc-card__unavailable">Currently unavailable</span>
                )}
                {svc.imageUrl && (
                  <img className="svc-card__image" src={svc.imageUrl} alt={svc.name} loading="lazy" />
                )}
                {svc.category && (
                  <span className="svc-card__category">{svc.category}</span>
                )}
                <h3 className="svc-card__name">{svc.name}</h3>
                {svc.description && (
                  <p className="svc-card__desc">{svc.description}</p>
                )}
                {svc.varieties?.length > 0 && (
                  <div className="svc-card__varieties">
                    <span className="svc-card__options-count">
                      {svc.varieties.length} {svc.varieties.length === 1 ? "variant" : "variants"}
                    </span>
                    {svc.varieties.slice(0, 3).map((v, i) => (
                      <span key={i} className="svc-card__variety-chip">
                        {v.name}
                      </span>
                    ))}
                    {svc.varieties.length > 3 && (
                      <span className="svc-card__variety-chip svc-card__variety-chip--more">
                        +{svc.varieties.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                {(priceDisplay || getServiceUnits(svc).length > 0) && (
                  <div className="svc-card__footer">
                    {priceDisplay && <span className="svc-card__price">{priceDisplay}</span>}
                    {getServiceUnits(svc).length > 0 && (
                      <span className="svc-card__unit">
                        {getServiceUnits(svc).map(formatPerUnit).join(" / ")}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
            </div>
          )}
        </>
      )}

      {cartService && (
        <OrderCartModal
          initialService={cartService}
          uid={uid}
          email={email}
          customerName={customerName}
          onClose={() => setCartService(null)}
          onSubmitted={() => {
            setCartService(null);
            if (onOrderPlaced) onOrderPlaced();
          }}
        />
      )}
    </div>
  );
}

// A "block" represents one service added to the cart, with either:
// - a single quantity (service has no varieties), or
// - one or more checked varieties, each with its own quantity.
function makeBlock(service) {
  return {
    key: `${service.id}-${Date.now()}-${Math.random()}`,
    service,
    singleQuantity: 1,
    checkedVarieties: {},
    variantOptions: {},
    selectedUnit: getServiceUnits(service).length === 1 ? getServiceUnits(service)[0] : "",
  };
}

function blockLines(block) {
  const { service, singleQuantity, checkedVarieties, selectedUnit, variantOptions } = block;
  if (!service.varieties?.length) {
    const unitPrice = service.price != null ? Number(service.price) : null;
    return [
      {
        serviceId: service.id,
        serviceName: service.name,
        varietyName: "",
        options: [],
        unit: selectedUnit,
        quantity: Number(singleQuantity) || 0,
        unitPrice,
        lineTotal: unitPrice != null ? unitPrice * (Number(singleQuantity) || 0) : null,
      },
    ];
  }

  return Object.entries(checkedVarieties).map(([idx, qty]) => {
    const variety = service.varieties[Number(idx)];
    const unitPrice = variety.price != null ? Number(variety.price) : null;
    return {
      serviceId: service.id,
      serviceName: service.name,
      varietyName: variety.name,
      options: (variety.serviceOptions || [])
        .filter((option) => variantOptions[idx]?.[option.name])
        .map((option) => ({ name: option.name, type: variantOptions[idx][option.name] })),
      unit: selectedUnit,
      quantity: Number(qty) || 0,
      unitPrice,
      lineTotal: unitPrice != null ? unitPrice * (Number(qty) || 0) : null,
    };
  });
}

function OrderCartModal({ initialService, uid, email, customerName, onClose, onSubmitted }) {
  const [blocks, setBlocks] = useState([makeBlock(initialService)]);
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState([]);
  const [descriptionError, setDescriptionError] = useState("");
  const [itemsError, setItemsError] = useState("");
  const [status, setStatus] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

  const allLines = blocks.flatMap(blockLines).filter((l) => l.quantity > 0);
  const grandTotal = allLines.some((l) => l.lineTotal == null)
    ? null
    : allLines.reduce((sum, l) => sum + (l.lineTotal || 0), 0);

  function updateBlock(key, updater) {
    setBlocks((prev) => prev.map((b) => (b.key === key ? updater(b) : b)));
  }

  function toggleVariety(key, index) {
    updateBlock(key, (b) => {
      const next = { ...b.checkedVarieties };
      if (next[index] !== undefined) {
        delete next[index];
      } else {
        next[index] = 1;
      }
      return { ...b, checkedVarieties: next };
    });
  }

  function setVarietyQty(key, index, qty) {
    updateBlock(key, (b) => ({
      ...b,
      checkedVarieties: { ...b.checkedVarieties, [index]: qty },
    }));
  }

  function setVariantOption(key, index, optionName, type) {
    updateBlock(key, (b) => ({
      ...b,
      variantOptions: {
        ...b.variantOptions,
        [index]: { ...b.variantOptions[index], [optionName]: type },
      },
    }));
  }

  function setUnit(key, unit) {
    updateBlock(key, (b) => ({ ...b, selectedUnit: unit }));
  }

  function setSingleQty(key, qty) {
    updateBlock(key, (b) => ({ ...b, singleQuantity: qty }));
  }

  function handleFileChange(e) {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    e.target.value = "";
  }

  function removeFile(index) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setDescriptionError("");
    setItemsError("");
    setStatus({ text: "", type: "" });

    let valid = true;
    if (allLines.length === 0) {
      setItemsError("Select at least one option and quantity.");
      valid = false;
    } else {
      const missing = blocks
        .filter((b) => blockLines(b).some((l) => l.quantity > 0))
        .flatMap((b) => [
          ...(getServiceUnits(b.service).length > 0 && !b.selectedUnit
            ? [`a per unit for ${b.service.name}`]
            : []),
          ...Object.keys(b.checkedVarieties).flatMap((idx) =>
            (b.service.varieties[idx]?.serviceOptions || [])
              .filter((o) => o.types?.length && !b.variantOptions[idx]?.[o.name])
              .map((o) => `${o.name} for ${b.service.varieties[idx].name}`)
          ),
        ]);
      if (missing.length > 0) {
        setItemsError(`Please choose ${missing[0]}.`);
        valid = false;
      }
    }
    if (!description.trim()) {
      setDescriptionError("Please describe your order or add specifications.");
      valid = false;
    }
    if (!valid) return;

    setSubmitting(true);
    setUploadNote("");
    try {
      let uploadedFiles = [];
      if (files.length > 0) {
        setUploadNote(`Uploading ${files.length} file${files.length > 1 ? "s" : ""}...`);
        uploadedFiles = await uploadOrderFiles(uid, files);
      }

      const orderData = {
        customerId: uid,
        customerEmail: email || "",
        items: allLines,
        description: description.trim(),
        totalPrice: grandTotal,
        files: uploadedFiles,
      };

      const { id, referenceId } = await createOrder(orderData);

      setPlacedOrder({
        id,
        referenceId,
        ...orderData,
        createdAt: new Date(),
      });
    } catch (err) {
      // TEMPORARY DEBUG — shows the real error so we can diagnose it.
      console.log("ORDER SUBMIT ERROR:", err);
      setStatus({
        text: `Failed to submit order. (debug: ${err.code || err.message})`,
        type: "error",
      });
    } finally {
      setSubmitting(false);
      setUploadNote("");
    }
  }

  function handleDescriptionKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  if (placedOrder) {
    return (
      <Receipt
        order={placedOrder}
        customerName={customerName}
        onClose={() => onSubmitted()}
      />
    );
  }

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="order-modal__close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <h3 className="order-modal__title">Build Your Order</h3>

        <form onSubmit={handleSubmit} className="order-form order-form--modal">
          {blocks.map((block) => (
            <div key={block.key} className="cart-block">
              <div className="cart-block__header">
                <span className="cart-block__name">{block.service.name}</span>
              </div>

              {getServiceUnits(block.service).length > 0 && (
                <div className="cart-option-row">
                  <label className="field-label">Per unit</label>
                  <select
                    className="order-select"
                    value={block.selectedUnit}
                    onChange={(e) => setUnit(block.key, e.target.value)}
                  >
                    <option value="">Select per unit</option>
                    {getServiceUnits(block.service).map((unit) => (
                      <option key={unit} value={unit}>{formatPerUnit(unit)}</option>
                    ))}
                  </select>
                </div>
              )}

              {block.service.varieties?.length > 0 ? (
                <div className="cart-variety-list">
                  {block.service.varieties.map((v, i) => {
                    const checked = block.checkedVarieties[i] !== undefined;
                    return (
                      <div key={i} className="cart-variety-item">
                      <div className="cart-variety-row">
                        <label className="cart-variety-checkbox">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleVariety(block.key, i)}
                          />
                          <span>
                            {v.name}
                            {v.price != null ? ` — ₱${Number(v.price).toFixed(2)}` : ""}
                          </span>
                        </label>
                        {checked && (
                          <label className="cart-variety-qty-label">
                            <span>Quantity</span>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              className="cart-variety-qty"
                              value={block.checkedVarieties[i]}
                              onChange={(e) => setVarietyQty(block.key, i, e.target.value)}
                            />
                          </label>
                        )}
                      </div>
                      {checked &&
                        v.serviceOptions
                          ?.filter((option) => option.types?.length > 0)
                          .map((option) => (
                            <div key={option.name} className="cart-variety-option">
                              <label className="field-label">{option.name}</label>
                              <select
                                className="order-select"
                                value={block.variantOptions[i]?.[option.name] || ""}
                                onChange={(e) =>
                                  setVariantOption(block.key, i, option.name, e.target.value)
                                }
                              >
                                <option value="">Select {option.name}</option>
                                {option.types.map((type) => (
                                  <option key={type} value={type}>{type}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="cart-single-qty-row">
                  <label className="field-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    className="order-select"
                    value={block.singleQuantity}
                    onChange={(e) => setSingleQty(block.key, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}

          <div className="field-error">{itemsError}</div>

          {grandTotal != null && allLines.length > 0 && (
            <div className="order-modal__total">
              <span>Total ({allLines.length} item{allLines.length > 1 ? "s" : ""})</span>
              <span className="order-modal__total-amount">₱{grandTotal.toFixed(2)}</span>
            </div>
          )}

          <label className="field-label" htmlFor="cartDescription">
            Specifications / Description
          </label>
          <textarea
            id="cartDescription"
            className="order-textarea"
            placeholder="e.g. matte finish, double-sided, my logo attached"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={handleDescriptionKeyDown}
          />
          <div className="field-error">{descriptionError}</div>

          <label className="field-label">Attach Files</label>
          <label className="order-file-drop" htmlFor="cartFiles">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M12 3 7 8h3v6h4V8h3l-5-5Zm-7 14v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2h-2v2H7v-2H5Z"
              />
            </svg>
            <span>Click to attach files or drag them here</span>
            <input
              id="cartFiles"
              type="file"
              multiple
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>

          {files.length > 0 && (
            <ul className="order-file-list">
              {files.map((file, i) => (
                <li key={`${file.name}-${i}`} className="order-file-item">
                  <span className="order-file-name">{file.name}</span>
                  <span className="order-file-size">{formatFileSize(file.size)}</span>
                  <button
                    type="button"
                    className="order-file-remove"
                    onClick={() => removeFile(i)}
                    aria-label={`Remove ${file.name}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <button type="submit" className="login-btn order-submit-btn" disabled={submitting}>
            {submitting ? uploadNote || "Submitting..." : "Submit Order"}
          </button>

          {status.text && (
            <div className={`status ${status.type}`}>{status.text}</div>
          )}
        </form>
      </div>
    </div>
  );
}

// Normalizes an order into a flat list of line items, whether it uses the
// current "items[]" shape or the older single-service fields, so display
// components can handle both without branching everywhere.
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

function formatTimestamp(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
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

function Receipt({ order, customerName, onClose }) {
  const lines = getOrderLines(order);

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="receipt" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="order-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <div className="receipt__meta-row">
          <span>{formatTimestamp(order.createdAt)}</span>
          <span>Receipt · {order.referenceId}</span>
        </div>

        <h2 className="receipt__shop">PEREZ</h2>
        <p className="receipt__tagline">Printing Shop</p>

        <p className="receipt__date">{formatTimestamp(order.createdAt)}</p>

        {customerName && (
          <p className="receipt__served">Ordered by: {customerName}</p>
        )}

        <div className="receipt__divider" />

        {lines.map((line, i) => (
          <div key={i} className="receipt__line">
            <span>
              {line.serviceName}
              {line.varietyName ? ` (${line.varietyName})` : ""}{lineOptionsSuffix(line)} x{line.quantity || 1}
            </span>
            <span>
              {line.lineTotal != null ? `₱${Number(line.lineTotal).toFixed(2)}` : "—"}
            </span>
          </div>
        ))}

        {order.description && (
          <p className="receipt__desc">{order.description}</p>
        )}

        {order.status === "needs_revision" && order.staffNote && (
          <div className="receipt__revision-note">
            <strong>⚠️ Changes needed:</strong> {order.staffNote}
          </div>
        )}

        <div className="receipt__divider" />

        <p className="receipt__total">
          TOTAL: {order.totalPrice != null ? `₱${Number(order.totalPrice).toFixed(2)}` : "—"}
        </p>

        <div className="receipt__reference-box">
          <span className="receipt__reference-label">Reference / Tracking No.</span>
          <span className="receipt__reference-value">{order.referenceId}</span>
          <span className="receipt__reference-hint">
            Show this at pickup to claim your order.
          </span>
        </div>

        <p className="receipt__thanks">Thank you for your business!</p>

        <button type="button" className="login-btn receipt__done-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

function OrderHistory({ uid, customerName }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    if (uid) loadOrders();
  }, [uid]);

  async function loadOrders() {
    setLoading(true);
    setError("");
    try {
      const userOrders = await getUserOrders(uid);
      setOrders(userOrders);
    } catch (err) {
      console.error("Failed to load orders:", err);
      setError(
        err.code === "failed-precondition"
          ? "A Firestore index is required for this query — check the browser console for a link to create it."
          : "Failed to load your orders. Please refresh and try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(order) {
    if (!window.confirm("Cancel this order? This cannot be undone.")) return;
    setCancellingId(order.id);
    setError("");
    try {
      await cancelOrder(order.id);
      setOrders((previous) => previous.filter((item) => item.id !== order.id));
    } catch (err) {
      setError(
        err.code === "order-not-cancellable"
          ? err.message
          : "Failed to cancel the order. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  }

  function statusLabel(s) {
    switch (s) {
      case "placed":
        return "Placed";
      case "printing":
        return "Printing";
      case "ready":
        return "Ready for Pickup";
      case "completed":
        return "Picked Up";
      case "needs_revision":
        return "Needs Revision";
      case "cancelled":
        return "Cancelled";
      default:
        return s || "Placed";
    }
  }

  const filteredOrders = orders.filter((order) => {
    const searchValue = searchTerm.trim().toLowerCase();
    if (!searchValue) return true;

    const orderLines = getOrderLines(order)
      .map((line) => `${line.serviceName} ${line.varietyName || ""}`)
      .join(" ");
    return [
      order.referenceId,
      order.status,
      order.description,
      order.serviceName,
      orderLines,
    ].some((value) => value?.toLowerCase().includes(searchValue));
  });

  if (loading) {
    return <div className="dashboard-content">Loading your orders...</div>;
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      <div className="order-search">
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path
            d="m21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <input
          type="search"
          placeholder="Search your orders..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>

      {orders.length === 0 ? (
        <div className="um-empty">
          You haven't placed any orders yet. Browse Services to get started.
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="um-empty">No orders match your search.</div>
      ) : (
        <div className="order-history">
          {filteredOrders.map((order) => {
            const lines = getOrderLines(order);
            const summary =
              lines.length > 1
                ? `${lines[0].serviceName} + ${lines.length - 1} more item${
                    lines.length - 1 > 1 ? "s" : ""
                  }`
                : lines[0]
                ? `${lines[0].serviceName}${lines[0].varietyName ? ` (${lines[0].varietyName})` : ""}`
                : "Order";

            return (
              <div
                key={order.id}
                className="order-card order-card--clickable"
                onClick={() => setSelectedOrder(order)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") setSelectedOrder(order);
                }}
              >
                <div className="order-card__top">
                  <span className="order-card__service">{summary}</span>
                  <span className={`order-status order-status--${order.status || "placed"}`}>
                    {statusLabel(order.status)}
                  </span>
                </div>
                <div className="order-card__timestamp">
                  Placed: {formatTimestamp(order.createdAt)}
                </div>
                {order.referenceId && (
                  <div className="order-card__ref">Ref: {order.referenceId}</div>
                )}
                {order.status === "needs_revision" && order.staffNote && (
                  <div className="order-card__revision-note">
                    <strong>⚠️ Changes needed:</strong> {order.staffNote}
                  </div>
                )}
                {order.description && (
                  <p className="order-card__desc">{order.description}</p>
                )}
                {order.totalPrice != null && (
                  <div className="order-card__meta">
                    <span className="order-card__total">
                      Total: ₱{Number(order.totalPrice).toFixed(2)}
                    </span>
                  </div>
                )}
                {order.files?.length > 0 && (
                  <div className="order-card__files">
                    {order.files.map((f, i) => (
                      <a
                        key={i}
                        href={f.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="order-card__file-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        📎 {f.name}
                      </a>
                    ))}
                  </div>
                )}
                {(order.status || "placed") === "placed" && (
                  <button
                    type="button"
                    className="order-card__cancel-btn"
                    disabled={cancellingId === order.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancel(order);
                    }}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    {cancellingId === order.id ? "Cancelling..." : "Cancel order"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedOrder && (
        <Receipt
          order={selectedOrder}
          customerName={customerName}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}