import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, updateUserProfile } from "../services/userServices";
import "./AdminDashboard.css";

const ROLES = ["customer", "staff", "admin"];

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("dashboard"); // "dashboard" | "users"
  const navigate = useNavigate();
  const { logout, user, profile } = useAuth();

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
                  : "Admin"}
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
          <h2>{view === "dashboard" ? "Dashboard" : "User Management"}</h2>
        </header>

        {view === "dashboard" ? (
          <div className="dashboard-content dashboard-content--empty">
            {/* Intentionally blank — content coming later */}
          </div>
        ) : (
          <UserManagement currentUid={user?.uid} />
        )}
      </main>
    </div>
  );
}

function UserManagement({ currentUid }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [savedId, setSavedId] = useState(null);

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

  function handleRoleChange(uid, newRole) {
    setUsers((prev) =>
      prev.map((u) => (u.id === uid ? { ...u, role: newRole } : u))
    );
  }

  async function handleSaveRole(uid, newRole) {
    setSavingId(uid);
    setSavedId(null);
    try {
      await updateUserProfile(uid, { role: newRole });
      setSavedId(uid);
      setTimeout(() => setSavedId(null), 2000);
    } catch (err) {
      setError("Failed to update role. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  function displayName(u) {
    if (u.firstName || u.lastName) {
      return `${u.firstName || ""} ${u.lastName || ""}`.trim();
    }
    return u.email || "—";
  }

  if (loading) {
    return <div className="dashboard-content">Loading users...</div>;
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      <div className="um-table-wrap">
        <table className="um-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>
                  {displayName(u)}
                  {u.id === currentUid && <span className="um-you-tag">You</span>}
                </td>
                <td className="um-muted">{u.email || "—"}</td>
                <td className="um-muted">{u.phone || "—"}</td>
                <td>
                  <select
                    className="um-role-select"
                    value={u.role || "customer"}
                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                    disabled={u.id === currentUid}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r.charAt(0).toUpperCase() + r.slice(1)}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    className="um-save-btn"
                    onClick={() => handleSaveRole(u.id, u.role || "customer")}
                    disabled={savingId === u.id || u.id === currentUid}
                  >
                    {savingId === u.id
                      ? "Saving..."
                      : savedId === u.id
                      ? "Saved ✓"
                      : "Save"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="um-empty">No registered users yet.</div>
        )}
      </div>
    </div>
  );
}