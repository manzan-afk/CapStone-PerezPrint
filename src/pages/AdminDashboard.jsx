import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllUsers, updateUserProfile } from "../services/userServices";
import { getAllServices, addService, updateService, deleteService } from "../services/servicesService";
import { getAllOrders, updateOrderStatus } from "../services/ordersService";
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
          <h2>
            {view === "dashboard"
              ? "Dashboard"
              : view === "users"
              ? "User Management"
              : view === "services"
              ? "Services"
              : "Orders"}
          </h2>
        </header>

        {view === "dashboard" && (
          <div className="dashboard-content dashboard-content--empty">
            {/* Intentionally blank — content coming later */}
          </div>
        )}

        {view === "users" && <UserManagement currentUid={user?.uid} />}

        {view === "services" && <ServicesManagement />}

        {view === "orders" && <OrderManagement />}
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

function ServicesManagement() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // New service form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("");
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState("");

  // Per-row edit state
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

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

  async function handleAddService(e) {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Service name is required.");
      return;
    }
    if (price && isNaN(Number(price))) {
      setFormError("Price must be a number.");
      return;
    }

    setAdding(true);
    try {
      const newId = await addService({
        name: trimmedName,
        description: description.trim(),
        price: price ? Number(price) : null,
        unit: unit.trim(),
      });
      setServices((prev) => [
        ...prev,
        { id: newId, name: trimmedName, description: description.trim(), price: price ? Number(price) : null, unit: unit.trim() },
      ]);
      setName("");
      setDescription("");
      setPrice("");
      setUnit("");
    } catch (err) {
      setFormError("Failed to add service. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  function startEdit(svc) {
    setEditingId(svc.id);
    setEditValues({
      name: svc.name || "",
      description: svc.description || "",
      price: svc.price ?? "",
      unit: svc.unit || "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setEditValues({});
  }

  async function saveEdit(id) {
    if (!editValues.name?.trim()) return;

    setSavingId(id);
    try {
      const updated = {
        name: editValues.name.trim(),
        description: (editValues.description || "").trim(),
        price: editValues.price === "" ? null : Number(editValues.price),
        unit: (editValues.unit || "").trim(),
      };
      await updateService(id, updated);
      setServices((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...updated } : s))
      );
      setEditingId(null);
    } catch (err) {
      setError("Failed to update service. Please try again.");
    } finally {
      setSavingId(null);
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

  if (loading) {
    return <div className="dashboard-content">Loading services...</div>;
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      {/* Add new service form */}
      <form className="svc-form" onSubmit={handleAddService}>
        <div className="svc-form__row">
          <input
            type="text"
            placeholder="Service name (e.g. Business Cards)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="svc-input svc-input--name"
          />
          <input
            type="text"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="svc-input svc-input--desc"
          />
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="svc-input svc-input--price"
            min="0"
            step="0.01"
          />
          <input
            type="text"
            placeholder="Unit (e.g. per piece)"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="svc-input svc-input--unit"
          />
          <button type="submit" className="svc-add-btn" disabled={adding}>
            {adding ? "Adding..." : "+ Add Service"}
          </button>
        </div>
        {formError && <div className="field-error">{formError}</div>}
      </form>

      {/* Services table */}
      <div className="um-table-wrap">
        <table className="um-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Price</th>
              <th>Unit</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => {
              const isEditing = editingId === svc.id;
              return (
                <tr key={svc.id}>
                  {isEditing ? (
                    <>
                      <td>
                        <input
                          className="svc-edit-input"
                          value={editValues.name}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, name: e.target.value }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="svc-edit-input"
                          value={editValues.description}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, description: e.target.value }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="svc-edit-input svc-edit-input--price"
                          type="number"
                          min="0"
                          step="0.01"
                          value={editValues.price}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, price: e.target.value }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="svc-edit-input"
                          value={editValues.unit}
                          onChange={(e) =>
                            setEditValues((v) => ({ ...v, unit: e.target.value }))
                          }
                        />
                      </td>
                      <td className="svc-actions">
                        <button
                          className="um-save-btn"
                          onClick={() => saveEdit(svc.id)}
                          disabled={savingId === svc.id}
                        >
                          {savingId === svc.id ? "Saving..." : "Save"}
                        </button>
                        <button className="svc-cancel-btn" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{svc.name}</td>
                      <td className="um-muted">{svc.description || "—"}</td>
                      <td className="um-muted">
                        {svc.price != null ? `₱${svc.price.toFixed(2)}` : "—"}
                      </td>
                      <td className="um-muted">{svc.unit || "—"}</td>
                      <td className="svc-actions">
                        <button className="svc-edit-btn" onClick={() => startEdit(svc)}>
                          Edit
                        </button>
                        <button
                          className="svc-delete-btn"
                          onClick={() => handleDelete(svc.id)}
                          disabled={deletingId === svc.id}
                        >
                          {deletingId === svc.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {services.length === 0 && (
          <div className="um-empty">No services added yet.</div>
        )}
      </div>
    </div>
  );
}

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