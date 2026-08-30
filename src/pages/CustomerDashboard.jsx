import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllServices } from "../services/servicesService";
import "./CustomerDashboard.css";

export default function CustomerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("dashboard"); // "dashboard" | "services"
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
    {
      key: "contacts",
      label: "Contacts",
      icon: (
        <path
          fill="currentColor"
          d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm0 2v.01L12 12l8-5.99V6H4Zm0 2.24V18h16V8.24l-8 6-8-6Z"
        />
      ),
    },
    {
      key: "faqs",
      label: "FAQs",
      icon: (
        <path
          fill="currentColor"
          d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm.9 15h-1.8v-1.8h1.8Zm1.86-7.05-.81.83A2.53 2.53 0 0 0 13 12.5V13h-1.8v-.62a3.1 3.1 0 0 1 1.1-2.15l1.1-1.1a1.5 1.5 0 1 0-2.6-1.02H8a3.5 3.5 0 1 1 6.76 1.24Z"
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
                  : "Customer"}
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

        {view === "services" && <ServicesBrowser />}

        {view !== "dashboard" && view !== "services" && (
          <div className="dashboard-content dashboard-content--empty">
            Coming soon.
          </div>
        )}
      </main>
    </div>
  );
}

function ServicesBrowser() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  return (
    <div className="dashboard-content">
      {error && <div className="svc-browse-error">{error}</div>}

      {services.length === 0 ? (
        <div className="svc-browse-empty">
          No services are available yet — check back soon.
        </div>
      ) : (
        <div className="svc-browse-grid">
          {services.map((svc) => (
            <div key={svc.id} className="svc-card">
              <h3 className="svc-card__name">{svc.name}</h3>
              {svc.description && (
                <p className="svc-card__desc">{svc.description}</p>
              )}
              <div className="svc-card__footer">
                <span className="svc-card__price">
                  {svc.price != null ? `₱${Number(svc.price).toFixed(2)}` : "Contact for pricing"}
                </span>
                {svc.unit && <span className="svc-card__unit">{svc.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}