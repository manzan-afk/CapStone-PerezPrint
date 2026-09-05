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

const ROLE_BADGE_LABELS = {
  admin: "ADMIN",
  staff: "STAFF",
  customer: "CUSTOMER",
};

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

        <select
          className="um-toolbar-select"
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Roles</option>
          <option value="admin">Admin</option>
          <option value="staff">Staff</option>
          <option value="customer">Customer</option>
        </select>

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
  const [modalService, setModalService] = useState(null); // null = closed, {} = add, {...} = edit
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

  function handleSaved(saved, isNew) {
    if (isNew) {
      setServices((prev) => [...prev, saved]);
    } else {
      setServices((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
    }
    setModalService(null);
  }

  if (loading) {
    return <div className="dashboard-content">Loading services...</div>;
  }

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      <div className="svc-toolbar">
        <button
          type="button"
          className="svc-add-btn"
          onClick={() => setModalService({})}
        >
          <svg viewBox="0 0 24 24" width="15" height="15">
            <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />
          </svg>
          Add Service
        </button>
      </div>

      {/* Services table */}
      <div className="um-table-wrap">
        <table className="um-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Description</th>
              <th>Base Price</th>
              <th>Unit</th>
              <th>Varieties (price)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {services.map((svc) => (
              <tr key={svc.id}>
                <td>{svc.name}</td>
                <td className="um-muted">{svc.category || "—"}</td>
                <td className="um-muted">{svc.description || "—"}</td>
                <td className="um-muted">
                  {svc.price != null ? `₱${Number(svc.price).toFixed(2)}` : "—"}
                </td>
                <td className="um-muted">{svc.unit || "—"}</td>
                <td className="um-muted">
                  {svc.varieties?.length > 0 ? (
                    <div className="svc-variety-tags">
                      {svc.varieties.map((v, i) => (
                        <span key={i} className="svc-variety-tag">
                          {v.name}
                          {v.price != null ? ` · ₱${Number(v.price).toFixed(2)}` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="svc-actions">
                  <button className="svc-edit-btn" onClick={() => setModalService(svc)}>
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
              </tr>
            ))}
          </tbody>
        </table>

        {services.length === 0 && (
          <div className="um-empty">No services added yet.</div>
        )}
      </div>

      {modalService && (
        <ServiceModal
          initialService={Object.keys(modalService).length ? modalService : null}
          onClose={() => setModalService(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function ServiceModal({ initialService, onClose, onSaved }) {
  const isEdit = !!initialService;

  const [name, setName] = useState(initialService?.name || "");
  const [category, setCategory] = useState(initialService?.category || "");
  const [description, setDescription] = useState(initialService?.description || "");
  const [price, setPrice] = useState(
    initialService?.price != null ? String(initialService.price) : ""
  );
  const [unit, setUnit] = useState(initialService?.unit || "");
  const [varieties, setVarieties] = useState(initialService?.varieties || []);
  const [varietyName, setVarietyName] = useState("");
  const [varietyPrice, setVarietyPrice] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function addVariety() {
    const trimmedName = varietyName.trim();
    if (!trimmedName) return;
    if (varietyPrice && isNaN(Number(varietyPrice))) {
      setFormError("Variety price must be a number.");
      return;
    }
    setFormError("");
    setVarieties((prev) => [
      ...prev,
      { name: trimmedName, price: varietyPrice ? Number(varietyPrice) : null },
    ]);
    setVarietyName("");
    setVarietyPrice("");
  }

  function removeVariety(index) {
    setVarieties((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFormError("Service name is required.");
      return;
    }
    if (price && isNaN(Number(price))) {
      setFormError("Base price must be a number.");
      return;
    }

    setSaving(true);
    try {
      const data = {
        name: trimmedName,
        category: category.trim(),
        description: description.trim(),
        price: price ? Number(price) : null,
        unit: unit.trim(),
        varieties,
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

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal" onClick={(e) => e.stopPropagation()}>
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
          <label className="field-label" htmlFor="svcName">Service Name</label>
          <input
            id="svcName"
            type="text"
            className="order-select"
            placeholder="e.g. Business Cards"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <label className="field-label" htmlFor="svcCategory">Category</label>
          <input
            id="svcCategory"
            type="text"
            className="order-select"
            placeholder="e.g. Cards, Apparel, Signage"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <label className="field-label" htmlFor="svcDescription">Description</label>
          <textarea
            id="svcDescription"
            className="order-textarea"
            placeholder="Short description of this service"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="svc-form__row--split">
            <div className="svc-form__col">
              <label className="field-label" htmlFor="svcPrice">
                Base Price <span className="field-label__hint">(optional)</span>
              </label>
              <input
                id="svcPrice"
                type="number"
                min="0"
                step="0.01"
                className="order-select"
                placeholder="e.g. 250"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
            <div className="svc-form__col">
              <label className="field-label" htmlFor="svcUnit">Unit</label>
              <input
                id="svcUnit"
                type="text"
                className="order-select"
                placeholder="e.g. per piece"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              />
            </div>
          </div>

          <label className="field-label">
            Varieties <span className="field-label__hint">(each with its own price)</span>
          </label>
          <div className="svc-variety-input-row">
            <input
              type="text"
              className="order-select"
              placeholder="Variety name (e.g. Small)"
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
            <div className="svc-variety-tags svc-variety-tags--editable">
              {varieties.map((v, i) => (
                <span key={i} className="svc-variety-tag">
                  {v.name}
                  {v.price != null ? ` · ₱${Number(v.price).toFixed(2)}` : ""}
                  <button
                    type="button"
                    className="svc-variety-remove"
                    onClick={() => removeVariety(i)}
                    aria-label={`Remove ${v.name}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="field-error">{formError}</div>

          <button type="submit" className="login-btn order-submit-btn" disabled={saving}>
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Service"}
          </button>
        </form>
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