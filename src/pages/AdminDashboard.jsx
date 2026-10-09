import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, updateUserProfile } from "../services/userServices";
import {
  getAllServices,
  getAllServiceCategories,
  addServiceCategory,
  deleteServiceCategory,
  addService,
  updateService,
  deleteService,
  uploadServiceImage,
} from "../services/servicesService";
import { getAllOrders, getAllOrdersForReports, updateOrderStatus, requestOrderRevision, deleteOrder } from "../services/ordersService";
import {
  sendOrderRevisionMessage,
} from "../services/messagingService";
import DirectMessages from "../components/DirectMessages";
import PrintableReceipt from "../components/PrintableReceipt";
import UnreadMessageBadge from "../components/UnreadMessageBadge";
import SidebarCountBadge from "../components/SidebarCountBadge";
import useSidebarOrderCounts from "../hooks/useSidebarOrderCounts";
import ProfileInfo from "../components/ProfileInfo";
import PickupOrders from "../components/PickupOrders";
import OrderDetails from "../components/OrderDetails";
import "./AdminDashboard.css";
import { lineOptionsSuffix, getServiceUnits, formatPerUnit, formatTypeLabel } from "../utils/orderLines";

const ROLES = ["customer", "staff", "admin"];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("dashboard");
  const [profileImageFailed, setProfileImageFailed] = useState(false);
  const navigate = useNavigate();
  const { logout, user, profile } = useAuth();
  const orderCounts = useSidebarOrderCounts(user?.uid, "admin");

  async function handleLogout() {
    await logout();
    navigate("/");
  }

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
          <a
            href="#"
            className={`nav-item ${view === "dashboard" ? "nav-item--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setView("dashboard");
              setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z"
              />
            </svg>
            Dashboard
          </a>

          <a
            href="#"
            className={`nav-item ${view === "users" ? "nav-item--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setView("users");
              setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3Zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3Zm0 2c-2.3 0-7 1.2-7 3.5V19h9v-2.5c0-.9.3-2 .9-2.9C10.1 13.2 8.9 13 8 13Zm8 0c-.3 0-.6 0-.9.1.7 1 1 2.2 1 3.4V19h7v-2.5c0-2.3-4.7-3.5-7-3.5Z"
              />
            </svg>
            User Management
          </a>

          <a
            href="#"
            className={`nav-item ${view === "services" ? "nav-item--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setView("services");
              setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm13.5 0 1.6 3.4L21.5 17l-2.6 2.4L19.6 23l-3.1-1.8L13.4 23l.7-3.6L11.5 17l3.4-.6L16.5 13Z"
              />
            </svg>
            Services
          </a>

          <a
            href="#"
            className={`nav-item ${view === "orders" ? "nav-item--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setView("orders");
              setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Zm0 2h12l1.5 2h-15L6 4Zm-1 4h14v12H5V8Zm3 2v2h8v-2H8Z"
              />
            </svg>
            Orders
            <SidebarCountBadge count={orderCounts.ordersNeedingAction} label="orders needing action" />
          </a>

          <a
            href="#"
            className={`nav-item ${view === "pickup" ? "nav-item--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setView("pickup");
              setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm-2 8h14v10H5V10Z"
              />
            </svg>
            Pickups
            <SidebarCountBadge count={orderCounts.readyPickups} label="orders ready for pickup" />
          </a>

          <a
            href="#"
            className={`nav-item ${view === "reports" ? "nav-item--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setView("reports");
              setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 2v14h14V5H5Zm2 10h2v2H7v-2Zm4-4h2v6h-2v-6Zm4-3h2v9h-2V8Z"
              />
            </svg>
            Reports
          </a>

          <a
            href="#"
            className={`nav-item ${view === "messages" ? "nav-item--active" : ""}`}
            onClick={(e) => {
              e.preventDefault();
              setView("messages");
              setSidebarOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="currentColor"
                d="M4 4h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-9l-5 3v-3H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v11h3v1.5l2.5-1.5H20V6H4Zm3 3h10v2H7V9Zm0 4h7v2H7v-2Z"
              />
            </svg>
            Messages
            <UnreadMessageBadge uid={user?.uid} />
          </a>
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
                  : "Admin"}
              </span>
              {user?.email && (
                <span className="user-email">{user.email}</span>
              )}
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
          <h2>
            {view === "dashboard"
              ? "Dashboard"
              : view === "users"
              ? "User Management"
              : view === "services"
              ? "Services"
              : view === "orders"
              ? "Orders"
              : view === "pickup"
              ? "Pickups"
              : view === "reports"
              ? "Reports"
              : view === "profile"
              ? "Personal Information"
              : "Messages"}
          </h2>
        </header>

        {view === "dashboard" && <DashboardOverview onNavigate={setView} />}

        {view === "users" && <UserManagement currentUid={user?.uid} />}

        {view === "services" && <ServicesManagement />}

        {view === "orders" && (
          <OrderManagement
            sender={{
              id: user?.uid,
              name: `${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || user?.email || "Admin",
              role: profile?.role || "admin",
            }}
          />
        )}

        {view === "reports" && <ReportsManagement />}

        {view === "pickup" && <PickupOrders />}

        {view === "profile" && <ProfileInfo user={user} profile={profile} />}

        {view === "messages" && (
          <DirectMessages
            uid={user?.uid}
            displayName={`${profile?.firstName || ""} ${profile?.lastName || ""}`.trim() || user?.email || "Admin"}
            role={profile?.role || "admin"}
          />
        )}
      </main>
    </div>
  );
}

const ROLE_BADGE_LABELS = {
  admin: "ADMIN",
  staff: "STAFF",
  customer: "CUSTOMER",
};

// Normalizes an order into its line items, whether it uses the current
// "items[]" shape or the older single-service fields.
function getOverviewOrderLines(order) {
  if (order.items?.length > 0) return order.items;
  if (order.serviceName) {
    return [
      {
        serviceName: order.serviceName,
        varietyName: order.varietyName || "",
        quantity: order.quantity || 1,
      },
    ];
  }
  return [];
}

function DashboardOverview({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [allUsers, allServices, allOrders] = await Promise.all([
        getAllUsers(),
        getAllServices(),
        getAllOrders(),
      ]);
      setUsers(allUsers);
      setServices(allServices);
      setOrders(allOrders);
    } catch (err) {
      setError("Failed to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="dashboard-content">Loading dashboard...</div>;
  }

  const customerCount = users.filter((u) => (u.role || "customer") === "customer").length;
  const staffCount = users.filter((u) => u.role === "staff").length;
  const adminCount = users.filter((u) => u.role === "admin").length;

  const ordersByStatus = {
    placed: orders.filter((o) => (o.status || "placed") === "placed").length,
    printing: orders.filter((o) => o.status === "printing").length,
    ready: orders.filter((o) => o.status === "ready").length,
    completed: orders.filter((o) => o.status === "completed").length,
  };

  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + (Number(o.totalPrice) || 0), 0);

  const recentOrders = [...orders]
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5);

  function formatDate(ts) {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  }

  function formatTime(ts) {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      {/* Stat cards */}
      <div className="stat-grid">
        <button
          type="button"
          className="stat-card stat-card--interactive"
          onClick={() => onNavigate("users")}
          aria-label="Open User Management"
        >
          <div className="stat-card__icon stat-card__icon--users">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M16 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3Zm-8 0c1.7 0 3-1.3 3-3S9.7 5 8 5 5 6.3 5 8s1.3 3 3 3Zm0 2c-2.3 0-7 1.2-7 3.5V19h9v-2.5c0-.9.3-2 .9-2.9C10.1 13.2 8.9 13 8 13Zm8 0c-.3 0-.6 0-.9.1.7 1 1 2.2 1 3.4V19h7v-2.5c0-2.3-4.7-3.5-7-3.5Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Total Users</span>
          <span className="stat-card__value">{users.length}</span>
          <span className="stat-card__sub">
            {customerCount} customers · {staffCount} staff · {adminCount} admin
          </span>
        </button>

        <button
          type="button"
          className="stat-card stat-card--interactive"
          onClick={() => onNavigate("services")}
          aria-label="Open Services"
        >
          <div className="stat-card__icon stat-card__icon--services">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M3 3h8v8H3V3Zm10 0h8v8h-8V3ZM3 13h8v8H3v-8Zm13.5 0 1.6 3.4L21.5 17l-2.6 2.4L19.6 23l-3.1-1.8L13.4 23l.7-3.6L11.5 17l3.4-.6L16.5 13Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Services Offered</span>
          <span className="stat-card__value">{services.length}</span>
          <span className="stat-card__sub">across all categories</span>
        </button>

        <button
          type="button"
          className="stat-card stat-card--interactive"
          onClick={() => onNavigate("orders")}
          aria-label="Open Orders"
        >
          <div className="stat-card__icon stat-card__icon--orders">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6Zm0 2h12l1.5 2h-15L6 4Zm-1 4h14v12H5V8Zm3 2v2h8v-2H8Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Total Orders</span>
          <span className="stat-card__value">{orders.length}</span>
          <span className="stat-card__sub">
            {ordersByStatus.placed} awaiting review
          </span>
        </button>

        <button
          type="button"
          className="stat-card stat-card--accent stat-card--interactive"
          onClick={() => onNavigate("reports")}
          aria-label="Open Reports"
        >
          <div className="stat-card__icon stat-card__icon--revenue">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.5 15.5v1h-1v-1c-1.4-.2-2.5-1-2.9-2.4l1.4-.6c.3.9 1 1.4 2 1.4.9 0 1.6-.4 1.6-1.1 0-.7-.5-1-1.9-1.4-1.8-.5-2.9-1.1-2.9-2.7 0-1.3 1-2.2 2.4-2.4v-1h1v1c1.2.2 2.1.9 2.5 2l-1.4.6c-.3-.7-.9-1.1-1.7-1.1-.8 0-1.4.4-1.4 1s.5.9 1.8 1.3c2 .6 3 1.2 3 2.8 0 1.4-1.1 2.3-2.5 2.5Z"/>
            </svg>
          </div>
          <span className="stat-card__label">Total Revenue</span>
          <span className="stat-card__value">₱{totalRevenue.toFixed(2)}</span>
          <span className="stat-card__sub">across all orders</span>
        </button>
      </div>

      {/* Order status breakdown */}
      <div className="status-breakdown">
        <button
          type="button"
          className="status-pill status-pill--placed status-pill--interactive"
          onClick={() => onNavigate("orders")}
          aria-label={`View ${ordersByStatus.placed} placed orders`}
        >
          <span className="status-pill__count">{ordersByStatus.placed}</span>
          <span className="status-pill__label">Placed</span>
        </button>
        <button
          type="button"
          className="status-pill status-pill--printing status-pill--interactive"
          onClick={() => onNavigate("orders")}
          aria-label={`View ${ordersByStatus.printing} printing orders`}
        >
          <span className="status-pill__count">{ordersByStatus.printing}</span>
          <span className="status-pill__label">Printing</span>
        </button>
        <button
          type="button"
          className="status-pill status-pill--ready status-pill--interactive"
          onClick={() => onNavigate("orders")}
          aria-label={`View ${ordersByStatus.ready} ready orders`}
        >
          <span className="status-pill__count">{ordersByStatus.ready}</span>
          <span className="status-pill__label">Ready</span>
        </button>
        <button
          type="button"
          className="status-pill status-pill--completed status-pill--interactive"
          onClick={() => onNavigate("orders")}
          aria-label={`View ${ordersByStatus.completed} picked up orders`}
        >
          <span className="status-pill__count">{ordersByStatus.completed}</span>
          <span className="status-pill__label">Picked Up</span>
        </button>
      </div>

      {/* Recent orders */}
      <h3 className="dashboard-section__title">Recent Orders</h3>
      {recentOrders.length === 0 ? (
        <div className="um-empty">No orders yet.</div>
      ) : (
        <div className="um-table-wrap">
          <table className="um-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const lines = getOverviewOrderLines(order);
                const summary =
                  lines.length > 1
                    ? `${lines[0].serviceName} + ${lines.length - 1} more`
                    : lines[0]?.serviceName || "—";
                return (
                  <tr key={order.id}>
                    <td className="um-muted">{order.customerEmail || "—"}</td>
                    <td>{summary}</td>
                    <td className="um-muted">
                      {order.totalPrice != null ? `₱${Number(order.totalPrice).toFixed(2)}` : "—"}
                    </td>
                    <td>
                      <span className={`order-status order-status--${order.status || "placed"}`}>
                        {order.status
                          ? order.status.charAt(0).toUpperCase() + order.status.slice(1)
                          : "Placed"}
                      </span>
                    </td>
                    <td className="um-muted">{formatDate(order.createdAt)}</td>
                    <td className="um-muted">{formatTime(order.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const REPORT_PERIODS = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

// Weeks start on Monday.
function getPeriodStart(date, period) {
  if (period === "month") return new Date(date.getFullYear(), date.getMonth(), 1);
  const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (period === "week") dayStart.setDate(dayStart.getDate() - ((dayStart.getDay() + 6) % 7));
  return dayStart;
}

function getPeriodLabel(start, period) {
  if (period === "month") {
    return start.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  if (period === "week") {
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const short = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", short)} \u2013 ${end.toLocaleDateString("en-US", { ...short, year: "numeric" })}`;
  }
  return start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function groupTransactions(orders, period) {
  const groups = new Map();
  orders.forEach((order) => {
    const created = order.createdAt?.toDate ? order.createdAt.toDate() : null;
    const start = created ? getPeriodStart(created, period) : null;
    const key = start ? start.getTime() : "none";
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        label: start ? getPeriodLabel(start, period) : "No date",
        sortValue: start ? start.getTime() : -Infinity,
        orders: [],
        total: 0,
      });
    }
    const group = groups.get(key);
    group.orders.push({ order, created });
    group.total += order.status === "cancelled" ? 0 : Number(order.totalPrice) || 0;
  });
  return [...groups.values()]
    .sort((a, b) => b.sortValue - a.sortValue)
    .map((group) => ({
      ...group,
      orders: group.orders.sort(
        (a, b) => (b.created?.getTime() || 0) - (a.created?.getTime() || 0)
      ),
    }));
}

function ReportsManagement() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("day");

  useEffect(() => {
    async function loadReports() {
      try {
        const [allOrders, allUsers, allServices] = await Promise.all([
          getAllOrdersForReports(),
          getAllUsers(),
          getAllServices(),
        ]);
        setOrders(allOrders);
        setUsers(allUsers);
        setServices(allServices);
      } catch (err) {
        setError("Failed to load reports. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadReports();
  }, []);

  if (loading) {
    return <div className="dashboard-content">Loading reports...</div>;
  }

  const completedOrders = orders.filter((order) => order.status === "completed");
  const billableOrders = orders.filter((order) => order.status !== "cancelled");
  const revenue = billableOrders.reduce((sum, order) => sum + (Number(order.totalPrice) || 0), 0);
  const completedRevenue = completedOrders.reduce(
    (sum, order) => sum + (Number(order.totalPrice) || 0),
    0
  );
  const customerCount = users.filter((user) => (user.role || "customer") === "customer").length;
  const serviceRows = services
    .map((service) => {
      const matchingOrders = billableOrders.filter((order) =>
        getOverviewOrderLines(order).some((line) => line.serviceName === service.name)
      );
      const serviceRevenue = matchingOrders.reduce(
        (sum, order) => sum + (Number(order.totalPrice) || 0),
        0
      );
      return { ...service, orderCount: matchingOrders.length, revenue: serviceRevenue };
    })
    .sort((a, b) => b.orderCount - a.orderCount || b.revenue - a.revenue);
  const transactionGroups = groupTransactions(orders, period);

  return (
    <div className="dashboard-content report-print-root">
      {error && <div className="um-error">{error}</div>}

      <div className="report-print-toolbar">
        <div className="report-print-heading">
          <h1>Perez Printing Shop</h1>
          <p>Business Report · Generated {new Date().toLocaleDateString()}</p>
        </div>
        <button className="report-print-button" onClick={() => window.print()}>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path fill="currentColor" d="M7 3h10v5H7V3Zm10 2H9v1h8V5ZM6 10h12a3 3 0 0 1 3 3v5h-4v3H7v-3H3v-5a3 3 0 0 1 3-3Zm10 9v-5H8v5h8Zm2-5h1v-1h-1v1ZM5 13v3h1v-2h12v2h1v-3a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1Z" />
          </svg>
          Print report
        </button>
      </div>

      <div className="stat-grid report-stat-grid">
        <div className="stat-card">
          <span className="stat-card__label">Gross Revenue</span>
          <span className="stat-card__value">₱{revenue.toFixed(2)}</span>
          <span className="stat-card__sub">from {billableOrders.length} total orders</span>
        </div>
        <div className="stat-card stat-card--accent">
          <span className="stat-card__label">Picked Up Revenue</span>
          <span className="stat-card__value">₱{completedRevenue.toFixed(2)}</span>
          <span className="stat-card__sub">from {completedOrders.length} picked up orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Average Order Value</span>
          <span className="stat-card__value">
            ₱{billableOrders.length ? (revenue / billableOrders.length).toFixed(2) : "0.00"}
          </span>
          <span className="stat-card__sub">across all orders</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">Active Customers</span>
          <span className="stat-card__value">{customerCount}</span>
          <span className="stat-card__sub">registered customer accounts</span>
        </div>
      </div>

      <div className="report-grid">
        <section className="report-panel">
          <h3 className="dashboard-section__title">Service Performance</h3>
          {serviceRows.length === 0 ? (
            <div className="um-empty">No services available.</div>
          ) : (
            <div className="um-table-wrap report-table-wrap">
              <table className="um-table">
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Orders</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRows.map((service) => (
                    <tr key={service.id}>
                      <td>{service.name}</td>
                      <td className="um-muted">{service.orderCount}</td>
                      <td className="um-muted">₱{service.revenue.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="report-panel report-transactions">
        <div className="report-transactions__header">
          <h3 className="dashboard-section__title">
            Transactions by {REPORT_PERIODS.find((item) => item.value === period).label}
          </h3>
          <div className="report-period-toggle" role="group" aria-label="Group transactions by">
            {REPORT_PERIODS.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`report-period-btn ${period === item.value ? "report-period-btn--active" : ""}`}
                aria-pressed={period === item.value}
                onClick={() => setPeriod(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {orders.length === 0 ? (
          <div className="um-empty">No transactions yet.</div>
        ) : (
          <div className="um-table-wrap report-table-wrap">
            <table className="um-table">
              <thead>
                <tr>
                  <th>{REPORT_PERIODS.find((item) => item.value === period).label}</th>
                  <th>Transactions</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {transactionGroups.map((group) => (
                  <tr key={group.key}>
                    <td>{group.label}</td>
                    <td className="um-muted">{group.orders.length}</td>
                    <td className="um-muted">₱{group.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="report-panel report-transactions">
        <h3 className="dashboard-section__title">All Transactions</h3>
        {orders.length === 0 ? (
          <div className="um-empty">No transactions yet.</div>
        ) : (
          <div className="um-table-wrap report-table-wrap">
            <table className="um-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {transactionGroups.flatMap((group) => group.orders).map(({ order, created }) => (
                  <tr key={order.id}>
                    <td className="um-muted">
                      {created
                        ? created.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })
                        : "—"}
                    </td>
                    <td className="um-muted">
                      {created
                        ? created.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
                        : "—"}
                    </td>
                    <td className="um-muted">{order.customerEmail || "—"}</td>
                    <td>
                      {getOverviewOrderLines(order)
                          .map((line) => `${line.serviceName}${line.varietyName ? ` (${line.varietyName})` : ""}${lineOptionsSuffix(line)} x${line.quantity || 1}`)
                        .join(", ") || "—"}
                    </td>
                    <td>
                      <span className={`order-status order-status--${order.status || "placed"}`}>
                        {statusLabel(order.status || "placed")}
                      </span>
                    </td>
                    <td className="um-muted">
                      {order.totalPrice != null ? `₱${Number(order.totalPrice).toFixed(2)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function UserManagement({ currentUid }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);

  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setError("");
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function displayName(u) {
    if (u.firstName || u.lastName) {
      return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    }
    return u.email || "—";
  }

  function initial(u) {
    const name = displayName(u);
    return name.charAt(0).toUpperCase() || "?";
  }

  async function handleRoleChange(uid, newRole) {
    setSavingId(uid);
    setUsers((prev) =>
      prev.map((u) => (u.id === uid ? { ...u, role: newRole } : u))
    );
    try {
      await updateUserProfile(uid, { role: newRole });
    } catch (err) {
      setError("Failed to update role. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  // Filter by search term (name or email) and role
  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" || (u.role || "customer") === roleFilter;
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !term ||
      displayName(u).toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term);
    return matchesRole && matchesSearch;
  });

  const roleTabs = [
    { value: "all", label: "All users", count: users.length },
    {
      value: "customer",
      label: "Customers",
      count: users.filter((u) => (u.role || "customer") === "customer").length,
    },
    { value: "staff", label: "Staff", count: users.filter((u) => u.role === "staff").length },
    { value: "admin", label: "Admins", count: users.filter((u) => u.role === "admin").length },
  ];

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const pageUsers = filteredUsers.slice(pageStart, pageStart + pageSize);

  if (loading) {
    return <div className="dashboard-content">Loading users...</div>;
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      <div className="um-management-heading">
        <div>
          <h3>User directory</h3>
          <p>Manage account roles and access.</p>
        </div>
      </div>

      <div className="um-role-tabs" role="group" aria-label="Filter users by role">
        {roleTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`um-role-tab ${roleFilter === tab.value ? "um-role-tab--active" : ""}`}
            onClick={() => {
              setRoleFilter(tab.value);
              setPage(1);
            }}
            aria-pressed={roleFilter === tab.value}
          >
            {tab.label}
            <span>{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="um-toolbar">
        <div className="um-search">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              d="m21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            />
          </svg>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="um-show-control">
          <span>Show</span>
          <select
            className="um-toolbar-select um-toolbar-select--small"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={8}>8</option>
            <option value={12}>12</option>
            <option value={24}>24</option>
          </select>
        </div>
      </div>

      {/* User cards */}
      {pageUsers.length === 0 ? (
        <div className="um-empty">No users match your search.</div>
      ) : (
        <div className="um-grid">
          {pageUsers.map((u) => {
            const role = u.role || "customer";
            const isYou = u.id === currentUid;
            return (
              <div key={u.id} className="um-card">
                <div className="um-card__top">
                  <div className={`um-avatar um-avatar--${role}`}>
                    {u.photoURL ? (
                      <img src={u.photoURL} alt="" className="um-avatar-img" />
                    ) : (
                      initial(u)
                    )}
                  </div>
                  <div className="um-card__info">
                    <div className="um-card__name-row">
                      <span className="um-card__name">
                        {displayName(u)}
                        {isYou && <span className="um-you-tag">You</span>}
                      </span>
                    </div>
                    <span className="um-card__email">{u.email || "—"}</span>
                  </div>
                </div>

                <div className="um-card__bottom">
                  <select
                    className={`um-role-badge um-role-badge--${role}`}
                    value={role}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={isYou || savingId === u.id}
                    title={isYou ? "You can't change your own role" : "Change role"}
                  >
                    <option value="customer">CUSTOMER</option>
                    <option value="staff">STAFF</option>
                    <option value="admin">ADMIN</option>
                  </select>
                  <span className="um-card__id" title={u.id}>
                    ID: {u.id.slice(0, 6)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination footer */}
      {filteredUsers.length > 0 && (
        <div className="um-footer">
          <span className="um-footer__count">
            Showing {pageStart + 1} to {Math.min(pageStart + pageSize, filteredUsers.length)} of{" "}
            {filteredUsers.length} users
          </span>
          <div className="um-pagination">
            <button
              className="um-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              ‹
            </button>
            <span className="um-page-current">{currentPage}</span>
            <button
              className="um-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ServicesManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [categoryName, setCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [deletingCategory, setDeletingCategory] = useState(null);
  const [modalService, setModalService] = useState(null); // null = closed, {} = add, {...} = edit
  const [newServiceCategory, setNewServiceCategory] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    setError("");
    try {
      const [all, allCategories] = await Promise.all([
        getAllServices(),
        getAllServiceCategories(),
      ]);
      setServices(all);
      setCategoryRecords(allCategories);
    } catch (err) {
      setError("Failed to load services. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteService(id);
      setServices((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError("Failed to delete service. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleAvailability(svc) {
    const nextAvailable = svc.available === false;
    setError("");
    try {
      await updateService(svc.id, { available: nextAvailable });
      setServices((prev) =>
        prev.map((s) => (s.id === svc.id ? { ...s, available: nextAvailable } : s))
      );
    } catch (err) {
      setError("Failed to update availability. Please try again.");
    }
  }

  function handleSaved(saved, isNew) {
    if (isNew) {
      setServices((prev) => [...prev, saved]);
    } else {
      setServices((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
    }
    setModalService(null);
    setNewServiceCategory("");
  }

  async function handleAddCategory(event) {
    event.preventDefault();
    const trimmedName = categoryName.trim();
    if (!trimmedName) return;
    if (categories.some((category) => category.toLowerCase() === trimmedName.toLowerCase())) {
      setError("That category already exists.");
      return;
    }

    setSavingCategory(true);
    setError("");
    try {
      const category = await addServiceCategory(trimmedName);
      setCategoryRecords((previous) => [...previous, category]);
      setCategoryFilter(category.name);
      setCategoryName("");
      setAddingCategory(false);
    } catch (err) {
      setError("Failed to add category. Please try again.");
    } finally {
      setSavingCategory(false);
    }
  }

  async function handleDeleteCategory(category) {
    const categoryServices = services.filter(
      (service) => service.category?.trim() === category.name,
    );
    const serviceCount = categoryServices.length;
    const serviceMessage = serviceCount
      ? ` Its ${serviceCount} ${serviceCount === 1 ? "service will" : "services will"} remain in the catalog but become uncategorized.`
      : "";
    if (!window.confirm(`Delete the ${category.name} category?${serviceMessage}`)) return;

    setDeletingCategory(category.name);
    setError("");
    try {
      const categoryIds = categoryRecords
        .filter((record) => record.name === category.name)
        .map((record) => record.id);
      await deleteServiceCategory(categoryIds, categoryServices.map((service) => service.id));
      setCategoryRecords((previous) => previous.filter((record) => record.name !== category.name));
      setServices((previous) => previous.map((service) => (
        service.category?.trim() === category.name ? { ...service, category: "" } : service
      )));
      if (categoryFilter === category.name) setCategoryFilter("all");
    } catch (err) {
      setError("Failed to delete category. Please try again.");
    } finally {
      setDeletingCategory(null);
    }
  }

  const categories = [...new Set([
    ...categoryRecords.map((category) => category.name?.trim()),
    ...services.map((service) => service.category?.trim()),
  ].filter(Boolean))].sort((first, second) => first.localeCompare(second));
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredServices = services.filter((service) => {
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    const searchableText = [
      service.name,
      service.category,
      service.description,
      ...(service.varieties || []).map((variety) => variety.name),
    ].join(" ").toLowerCase();
    return matchesCategory && (!normalizedSearch || searchableText.includes(normalizedSearch));
  });
  const uncategorizedServices = filteredServices.filter((service) => !service.category?.trim());
  const serviceGroups = [
    ...(categoryFilter === "all" ? categories : [categoryFilter])
    .map((category) => ({
      name: category,
      services: filteredServices.filter((service) => service.category?.trim() === category),
    })),
    ...(categoryFilter === "all" && uncategorizedServices.length > 0
      ? [{ name: "", services: uncategorizedServices }]
      : []),
  ]
    .filter((group) => group.services.length > 0 || !normalizedSearch);

  if (loading) {
    return <div className="dashboard-content">Loading services...</div>;
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      <div className="svc-toolbar">
        <div className="svc-toolbar__copy">
          <h3>Service catalog</h3>
          <p>{categories.length} categories · {filteredServices.length} of {services.length} services</p>
        </div>
        <div className="svc-toolbar__controls">
          <label className="svc-search">
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path d="m21 21-4.3-4.3m2.3-5.2a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" stroke="currentColor" strokeWidth="2" fill="none" />
            </svg>
            <input
              type="search"
              placeholder="Search services..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              aria-label="Search services"
            />
          </label>
          <select
            className="svc-category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            aria-label="Filter services by category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <button
            type="button"
            className="svc-add-btn"
            onClick={() => setAddingCategory((previous) => !previous)}
          >
            <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
              <path fill="currentColor" d="M3 5h7l2 2h9v12H3V5Zm2 2v10h14V9h-8l-2-2H5Z" />
            </svg>
            Add Category
          </button>
        </div>
      </div>

      {addingCategory && (
        <form className="svc-category-form" onSubmit={handleAddCategory}>
          <label htmlFor="new-service-category">New category</label>
          <input
            id="new-service-category"
            autoFocus
            type="text"
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="e.g. Large Format Printing"
            maxLength={60}
          />
          <button type="submit" className="svc-category-save" disabled={savingCategory || !categoryName.trim()}>
            {savingCategory ? "Creating..." : "Create category"}
          </button>
          <button
            type="button"
            className="svc-category-cancel"
            onClick={() => {
              setAddingCategory(false);
              setCategoryName("");
            }}
          >
            Cancel
          </button>
        </form>
      )}

      {categories.length === 0 && services.length === 0 ? (
        <div className="um-empty">Create a category to start building the service catalog.</div>
      ) : filteredServices.length === 0 && normalizedSearch ? (
        <div className="um-empty">No services match these filters.</div>
      ) : (
        <div className="svc-category-list">
          {serviceGroups.map((group) => (
            <section className="svc-category-section" key={group.name || "uncategorized"}>
              <header className="svc-category-heading">
                <div>
                  <h4>{group.name || "Uncategorized"}</h4>
                  <span>{group.services.length} {group.services.length === 1 ? "service" : "services"}</span>
                </div>
                <button
                  type="button"
                  className="svc-category-add-service"
                  onClick={() => {
                    setNewServiceCategory(group.name);
                    setModalService({});
                  }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                    <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />
                  </svg>
                  Add service
                </button>
                {group.name && (
                  <button
                    type="button"
                    className="svc-category-delete"
                    onClick={() => handleDeleteCategory({ name: group.name })}
                    disabled={deletingCategory === group.name}
                    aria-label={`Delete ${group.name} category`}
                  >
                    {deletingCategory === group.name ? "Deleting..." : "Delete category"}
                  </button>
                )}
              </header>

              {group.services.length === 0 ? (
                <div className="svc-category-empty">No services in this category yet.</div>
              ) : (
                <div className="svc-manage-grid">
                  {group.services.map((svc) => (
                    <article key={svc.id} className="svc-manage-card">
                      {svc.imageUrl && (
                        <img className="svc-manage-card__image" src={svc.imageUrl} alt={svc.name} loading="lazy" />
                      )}
                      <div className="svc-manage-card__header">
                        <div className="svc-manage-card__identity">
                          <h3>{svc.name}</h3>
                          {svc.available === false && (
                            <span className="svc-unavailable-tag">Unavailable</span>
                          )}
                          {getServiceUnits(svc).length > 0 && (
                            <span className="svc-manage-card__unit">
                              {getServiceUnits(svc).map(formatPerUnit).join(" / ")}
                            </span>
                          )}
                        </div>
                        <div className="svc-actions">
                          <button
                            type="button"
                            className="svc-edit-btn"
                            onClick={() => handleToggleAvailability(svc)}
                          >
                            {svc.available === false ? "Set available" : "Set unavailable"}
                          </button>
                          <button
                            type="button"
                            className="svc-edit-btn"
                            onClick={() => setModalService(svc)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="svc-delete-btn"
                            onClick={() => handleDelete(svc.id)}
                            disabled={deletingId === svc.id}
                          >
                            {deletingId === svc.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>

                      {svc.description && (
                        <p className="svc-manage-card__description">{svc.description}</p>
                      )}

                      {svc.varieties?.length > 0 && (
                        <div className="svc-manage-card__variants">
                          <span className="svc-manage-card__eyebrow">Variants</span>
                          {svc.varieties.map((variety, index) => (
                            <div key={`${svc.id}-${variety.name}-${index}`} className="svc-variant-item">
                              <div className="svc-variant-item__head">
                                <span>{variety.name}</span>
                                <span className="svc-variant-item__price">
                                  {variety.price != null ? `₱${Number(variety.price).toFixed(2)}` : "—"}
                                </span>
                              </div>
                              {variety.serviceOptions?.length > 0 && (
                                <dl className="svc-variant-item__options">
                                  {variety.serviceOptions.map((option) => (
                                    <div key={option.name} className="svc-variant-item__option">
                                      <dt>{option.name}</dt>
                                      <dd>
                                        {option.types.map((type) => (
                                          <span key={type} className="svc-variety-tag">
                                            {formatTypeLabel(option, type)}
                                          </span>
                                        ))}
                                      </dd>
                                    </div>
                                  ))}
                                </dl>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {modalService && (
        <ServiceModal
          initialService={Object.keys(modalService).length ? modalService : null}
          initialCategory={newServiceCategory}
          categories={categories}
          onClose={() => setModalService(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function OptionTypesEditor({ option, onChange, onRemove }) {
  const [typeInput, setTypeInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [priceError, setPriceError] = useState("");

  function addType() {
    const trimmed = typeInput.trim();
    if (!trimmed || option.types.some((type) => type.toLowerCase() === trimmed.toLowerCase())) {
      setTypeInput("");
      return;
    }
    const price = priceInput.trim() === "" ? 0 : Number(priceInput);
    if (!Number.isFinite(price) || price < 0) {
      setPriceError("Type price must be a number of 0 or more.");
      return;
    }
    setPriceError("");
    setTypeInput("");
    setPriceInput("");
    onChange({
      types: [...option.types, trimmed],
      typePrices: price > 0 ? { ...option.typePrices, [trimmed]: price } : option.typePrices,
    });
  }

  function removeType(type) {
    const typePrices = { ...option.typePrices };
    delete typePrices[type];
    onChange({ types: option.types.filter((item) => item !== type), typePrices });
  }

  return (
    <div className="svc-option-group">
      <div className="svc-option-group__header">
        <strong>{option.name}</strong>
        <button type="button" className="svc-option-group__remove" onClick={onRemove}>
          Remove option
        </button>
      </div>
      <div className="svc-variety-input-row">
        <input
          type="text"
          className="order-select"
          placeholder={`Add a type for ${option.name}`}
          value={typeInput}
          onChange={(e) => setTypeInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addType();
            }
          }}
        />
        <input
          type="number"
          min="0"
          step="0.01"
          className="order-select svc-variety-price-input"
          placeholder="+ Price"
          aria-label={`Extra price for the new ${option.name} type`}
          value={priceInput}
          onChange={(e) => setPriceInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addType();
            }
          }}
        />
        <button type="button" className="svc-variety-add-btn" onClick={addType}>
          Add type
        </button>
      </div>
      {priceError && <div className="field-error">{priceError}</div>}
      {option.types.length > 0 && (
        <div className="svc-variety-tags svc-variety-tags--editable">
          {option.types.map((type) => (
            <span key={type} className="svc-variety-tag">
              {formatTypeLabel(option, type)}
              <button
                type="button"
                className="svc-variety-remove"
                onClick={() => removeType(type)}
                aria-label={`Remove ${type}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ServiceOptionsField({ options, onChange }) {
  const [optionName, setOptionName] = useState("");

  function addOption() {
    const trimmed = optionName.trim();
    setOptionName("");
    if (!trimmed || options.some((option) => option.name.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...options, { name: trimmed, types: [] }]);
  }

  return (
    <div className="svc-options-field">
      <label className="field-label">Option name</label>
      <div className="svc-variety-input-row">
        <input
          type="text"
          className="order-select"
          placeholder="e.g. Paper Size, Color, Binding"
          value={optionName}
          onChange={(e) => setOptionName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOption();
            }
          }}
        />
        <button type="button" className="svc-variety-add-btn" onClick={addOption}>
          Add option
        </button>
      </div>
      {options.map((option, index) => (
        <OptionTypesEditor
          key={option.name}
          option={option}
          onChange={(patch) =>
            onChange(options.map((item, i) => (i === index ? { ...item, ...patch } : item)))
          }
          onRemove={() => onChange(options.filter((_, i) => i !== index))}
        />
      ))}
    </div>
  );
}

function ServiceModal({ initialService, initialCategory = "", categories = [], onClose, onSaved }) {
  const isEdit = !!initialService;

  const [name, setName] = useState(initialService?.name || "");
  const [category, setCategory] = useState(initialService?.category || initialCategory);
  const [description, setDescription] = useState(initialService?.description || "");
  const [unit, setUnit] = useState(initialService ? getServiceUnits(initialService)[0] || "" : "");
  const [varieties, setVarieties] = useState(initialService?.varieties || []);
  const [varietyName, setVarietyName] = useState("");
  const [varietyPrice, setVarietyPrice] = useState("");
  const [imageUrl, setImageUrl] = useState(initialService?.imageUrl || "");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [available, setAvailable] = useState(initialService?.available !== false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function addVariety() {
    const trimmedName = varietyName.trim();
    if (!trimmedName) return;
    if (varietyPrice && isNaN(Number(varietyPrice))) {
      setFormError("Variant price must be a number.");
      return;
    }
    setFormError("");
    setVarieties((prev) => [
      ...prev,
      { name: trimmedName, price: varietyPrice ? Number(varietyPrice) : null, serviceOptions: [] },
    ]);
    setVarietyName("");
    setVarietyPrice("");
  }

  function removeVariety(index) {
    setVarieties((prev) => prev.filter((_, i) => i !== index));
  }

  function updateVariety(index, patch) {
    setVarieties((prev) => prev.map((variety, i) => (i === index ? { ...variety, ...patch } : variety)));
  }

  function updateVarietyOptions(index, nextOptions) {
    setVarieties((prev) =>
      prev.map((variety, i) => (i === index ? { ...variety, serviceOptions: nextOptions } : variety))
    );
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setFormError("");
    setUploadingImage(true);
    try {
      setImageUrl(await uploadServiceImage(file));
    } catch (err) {
      setFormError(err.message || "Image upload failed.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Service name is required.");
      return;
    }
    if (varieties.some((variety) => !variety.name.trim())) {
      setFormError("Every variant needs a name.");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: trimmedName,
        category: category.trim(),
        description: description.trim(),
        price: null,
        units: unit.trim() ? [unit.trim()] : [],
        unit: "",
        varieties: varieties.map((variety) => ({ ...variety, name: variety.name.trim() })),
        imageUrl,
        available,
      };

      if (isEdit) {
        await updateService(initialService.id, data);
        onSaved({ id: initialService.id, ...data }, false);
      } else {
        const newId = await addService(data);
        onSaved({ id: newId, ...data }, true);
      }
    } catch (err) {
      setFormError("Failed to save service. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleDescriptionKeyDown(event) {
    if (event.key !== "Enter" || event.shiftKey) return;

    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal service-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="order-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        <h3 className="order-modal__title">
          {isEdit ? "Edit Service" : "Add New Service"}
        </h3>

        <form onSubmit={handleSubmit} className="order-form order-form--modal">
          {/* ---------- Basic Information ---------- */}
          <div className="svc-modal-section">
            <h4 className="svc-modal-section__title">Basic Information</h4>

            <label className="field-label" htmlFor="svcName">Service Name</label>
            <input
              id="svcName"
              type="text"
              className="order-select"
              placeholder="e.g. Document Printing"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <label className="field-label" htmlFor="svcCategory">Category</label>
            <select
              id="svcCategory"
              className="order-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required={!isEdit}
            >
              <option value="">Select a category</option>
              {categories.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
              {category && !categories.includes(category) && (
                <option value={category}>{category}</option>
              )}
            </select>

            <label className="field-label" htmlFor="svcDescription">Description</label>
            <textarea
              id="svcDescription"
              className="order-textarea"
              placeholder="Short description of this service"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleDescriptionKeyDown}
            />

            <label className="svc-availability">
              <input
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
              />
              <span>
                Available for ordering
                <small>Uncheck to show this service as unavailable to customers.</small>
              </span>
            </label>

            <label className="field-label" htmlFor="svcImage">
              Image <span className="field-label__hint">(optional, JPG/PNG/WebP up to 5 MB)</span>
            </label>
            {imageUrl && (
              <div className="svc-image-preview">
                <img src={imageUrl} alt="Service preview" />
                <button type="button" className="svc-option-group__remove" onClick={() => setImageUrl("")}>
                  Remove image
                </button>
              </div>
            )}
            <input
              id="svcImage"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="order-select"
              onChange={handleImageChange}
              disabled={uploadingImage}
            />
            {uploadingImage && <span className="svc-modal-section__hint">Uploading image...</span>}
          </div>

          {/* ---------- Pricing ---------- */}
          <div className="svc-modal-section">
            <h4 className="svc-modal-section__title">Pricing</h4>

            <label className="field-label" htmlFor="svcUnit">Per Unit</label>
            <input
              id="svcUnit"
              type="text"
              className="order-select"
              placeholder="e.g. page"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />

            <label className="field-label">
              Variants <span className="field-label__hint">(each with its own price)</span>
            </label>
            <div className="svc-variety-input-row">
              <input
                type="text"
                className="order-select"
                placeholder="Variant name (e.g. Rush Order)"
                value={varietyName}
                onChange={(e) => setVarietyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addVariety();
                  }
                }}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                className="order-select svc-variety-price-input"
                placeholder="Price"
                value={varietyPrice}
                onChange={(e) => setVarietyPrice(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addVariety();
                  }
                }}
              />
              <button type="button" className="svc-variety-add-btn" onClick={addVariety}>
                Add
              </button>
            </div>
            {varieties.length > 0 && (
              <div className="svc-variant-list">
                {varieties.map((v, i) => (
                  <div key={i} className="svc-variant-block">
                    <div className="svc-option-group__header">
                      <div className="svc-variant-edit-row">
                        <input
                          type="text"
                          className="order-select"
                          aria-label="Variant name"
                          value={v.name}
                          onChange={(e) => updateVariety(i, { name: e.target.value })}
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="order-select svc-variety-price-input"
                          aria-label={`Price for ${v.name}`}
                          placeholder="Price"
                          value={v.price ?? ""}
                          onChange={(e) =>
                            updateVariety(i, { price: e.target.value === "" ? null : Number(e.target.value) })
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="svc-option-group__remove"
                        onClick={() => removeVariety(i)}
                        aria-label={`Remove ${v.name}`}
                      >
                        Remove variant
                      </button>
                    </div>
                    <span className="svc-modal-section__hint">Service options for {v.name}</span>
                    <ServiceOptionsField
                      options={v.serviceOptions || []}
                      onChange={(next) => updateVarietyOptions(i, next)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="field-error">{formError}</div>

          <button type="submit" className="login-btn order-submit-btn" disabled={saving || uploadingImage}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Service"}
          </button>
        </form>
      </div>
    </div>
  );
}

const ORDER_STATUSES = ["placed", "printing", "ready", "completed", "needs_revision", "cancelled"];

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

function summarizeOrder(order) {
  const lines = getOverviewOrderLines(order);
  if (lines.length > 1) return `${lines[0].serviceName} + ${lines.length - 1} more`;
  return lines[0]?.serviceName || "Order";
}

function OrderManagement({ sender }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [detailsOrder, setDetailsOrder] = useState(null);

  // Clicks on the card's own controls shouldn't open the details.
  function handleCardClick(event, order) {
    if (event.target.closest("button, select, a, textarea, input, label")) return;
    setDetailsOrder(order);
  }

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
    setError("");
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  }

  function handleRevisionNoteChange(orderId, note) {
    setError("");
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, staffNote: note } : order))
    );
  }

  async function handleSaveStatus(orderId, status) {
    const revisionNote = orders.find((order) => order.id === orderId)?.staffNote?.trim();
    if (status === "needs_revision" && !revisionNote) {
      setError("Enter the problem details before setting this order to Needs Revision.");
      return;
    }

    setSavingId(orderId);
    setSavedId(null);
    try {
      if (status === "needs_revision") {
        await requestOrderRevision(orderId, revisionNote);
        try {
          await sendOrderRevisionMessage({
            order: orders.find((order) => order.id === orderId),
            sender,
            note: revisionNote,
          });
        } catch (messageError) {
          console.error("Failed to message customer about order revision:", messageError);
          setError("Revision saved, but the direct message could not be sent. The customer can still see the note in Notifications.");
        }
      } else {
        await updateOrderStatus(orderId, status);
      }
      setSavedId(orderId);
      if (status === "cancelled") {
        setOrders((prev) => prev.filter((order) => order.id !== orderId));
      }
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      setError("Failed to update status. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDeleteOrder(order) {
    if (order.status !== "completed") return;
    const confirmed = window.confirm(
      `Delete the picked up order${order.referenceId ? ` ${order.referenceId}` : ""}? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingId(order.id);
    setError("");
    try {
      await deleteOrder(order.id);
      setOrders((previous) => previous.filter((item) => item.id !== order.id));
    } catch (err) {
      setError(err.code === "permission-denied"
        ? "Firestore rules do not allow this account to delete or archive orders."
        : "Failed to delete order. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function formatDate(ts) {
    if (!ts?.toDate) return "—";
    return ts.toDate().toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    });
  }

  const filteredOrders = orders.filter((order) => {
    const searchValue = searchTerm.trim().toLowerCase();
    if (!searchValue) return true;

    const orderLines = getOverviewOrderLines(order)
      .map((line) => `${line.serviceName} ${line.varietyName || ""}`)
      .join(" ");
    return [
      order.referenceId,
      order.customerEmail,
      order.status,
      order.description,
      order.serviceName,
      orderLines,
    ].some((value) => value?.toLowerCase().includes(searchValue));
  });

  if (loading) {
    return <div className="dashboard-content">Loading orders...</div>;
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      <div className="um-toolbar">
        <div className="um-search">
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
            placeholder="Search orders..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="um-empty">No orders have been placed yet.</div>
      ) : filteredOrders.length === 0 ? (
        <div className="um-empty">No orders match your search.</div>
      ) : (
        <div className="ord-list">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="ord-card ord-card--clickable"
              onClick={(event) => handleCardClick(event, order)}
              onKeyDown={(event) => {
                if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                  event.preventDefault();
                  setDetailsOrder(order);
                }
              }}
              tabIndex={0}
            >
              <div className="ord-card__header">
                <div>
                  <span className="ord-card__service">{summarizeOrder(order)}</span>
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
                  disabled={
                    savingId === order.id ||
                    (order.status === "needs_revision" && !order.staffNote?.trim())
                  }
                >
                  {savingId === order.id
                    ? "Saving..."
                    : savedId === order.id
                    ? "Saved ✓"
                    : "Save"}
                </button>
                {order.status === "completed" && (
                  <button
                    type="button"
                    className="ord-delete-btn"
                    onClick={() => handleDeleteOrder(order)}
                    disabled={deletingId === order.id}
                  >
                    {deletingId === order.id ? "Deleting..." : "Delete"}
                  </button>
                )}
                {(order.status === "ready" || order.status === "completed") && (
                  <button
                    type="button"
                    className="ord-print-btn"
                    onClick={() => setReceiptOrder(order)}
                  >
                    Print Receipt
                  </button>
                )}
              </div>
              {order.status === "needs_revision" && (
                <div className="ord-revision-field">
                  <label htmlFor={`admin-revision-note-${order.id}`}>Problem with the order</label>
                  <textarea
                    id={`admin-revision-note-${order.id}`}
                    value={order.staffNote || ""}
                    onChange={(event) => handleRevisionNoteChange(order.id, event.target.value)}
                    placeholder="Describe what needs to be corrected..."
                    required
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {detailsOrder && (
        <OrderDetails order={detailsOrder} onClose={() => setDetailsOrder(null)} />
      )}

      {receiptOrder && (
        <PrintableReceipt
          order={receiptOrder}
          customerName={receiptOrder.customerEmail}
          onClose={() => setReceiptOrder(null)}
        />
      )}
    </div>
  );
}