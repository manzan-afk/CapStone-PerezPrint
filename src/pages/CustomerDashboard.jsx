import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAllServices } from "../services/servicesService";
import { uploadOrderFiles, createOrder, getUserOrders } from "../services/ordersService";
import "./CustomerDashboard.css";

export default function CustomerDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("dashboard"); // "dashboard" | "services" | "orders" | ...
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
              {user?.email && <span className="user-email">{user.email}</span>}
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

        {view !== "dashboard" && view !== "services" && view !== "orders" && (
          <div className="dashboard-content dashboard-content--empty">
            Coming soon.
          </div>
        )}
      </main>
    </div>
  );
}

function ServicesBrowser({ uid, email, customerName, onOrderPlaced }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedService, setSelectedService] = useState(null);

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
            <button
              key={svc.id}
              type="button"
              className="svc-card svc-card--clickable"
              onClick={() => setSelectedService(svc)}
            >
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
              <span className="svc-card__cta">Order this service →</span>
            </button>
          ))}
        </div>
      )}

      {selectedService && (
        <OrderModal
          service={selectedService}
          uid={uid}
          email={email}
          customerName={customerName}
          onClose={() => setSelectedService(null)}
          onSubmitted={() => {
            setSelectedService(null);
            if (onOrderPlaced) onOrderPlaced();
          }}
        />
      )}
    </div>
  );
}

function OrderModal({ service, uid, email, customerName, onClose, onSubmitted }) {
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [files, setFiles] = useState([]);
  const [descriptionError, setDescriptionError] = useState("");
  const [quantityError, setQuantityError] = useState("");
  const [status, setStatus] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);
  const [uploadNote, setUploadNote] = useState("");
  const [placedOrder, setPlacedOrder] = useState(null);

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

  const total = service.price != null ? Number(service.price) * Number(quantity || 0) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setDescriptionError("");
    setQuantityError("");
    setStatus({ text: "", type: "" });

    let valid = true;
    if (!description.trim()) {
      setDescriptionError("Please describe your order or add specifications.");
      valid = false;
    }
    if (!quantity || Number(quantity) < 1) {
      setQuantityError("Enter a quantity of at least 1.");
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
        serviceId: service.id,
        serviceName: service.name || "",
        description: description.trim(),
        quantity: Number(quantity),
        unit: service.unit || "",
        unitPrice: service.price != null ? Number(service.price) : null,
        totalPrice: total,
        files: uploadedFiles,
      };

      const { id, referenceId } = await createOrder(orderData);

      // Show the receipt instead of closing immediately — createdAt uses
      // "now" locally since Firestore's serverTimestamp isn't available
      // client-side until the write is confirmed and re-fetched.
      setPlacedOrder({
        id,
        referenceId,
        ...orderData,
        createdAt: new Date(),
      });
    } catch (err) {
      setStatus({ text: "Failed to submit order. Please try again.", type: "error" });
    } finally {
      setSubmitting(false);
      setUploadNote("");
    }
  }

  if (placedOrder) {
    return (
      <Receipt
        order={placedOrder}
        customerName={customerName}
        onClose={() => {
          onSubmitted();
        }}
      />
    );
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

        <h3 className="order-modal__title">Order: {service.name}</h3>
        {service.description && (
          <p className="order-modal__service-desc">{service.description}</p>
        )}
        <div className="order-modal__price">
          {service.price != null ? `₱${Number(service.price).toFixed(2)}` : "Contact for pricing"}
          {service.unit && <span className="order-modal__unit"> · {service.unit}</span>}
        </div>

        <form onSubmit={handleSubmit} className="order-form order-form--modal">
          <label className="field-label" htmlFor="modalDescription">
            Specifications / Description
          </label>
          <textarea
            id="modalDescription"
            className="order-textarea"
            placeholder="e.g. 500 pieces, matte finish, double-sided, my logo attached"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="field-error">{descriptionError}</div>

          <label className="field-label" htmlFor="modalQuantity">Quantity</label>
          <input
            id="modalQuantity"
            type="number"
            min="1"
            step="1"
            className="order-select"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <div className="field-error">{quantityError}</div>

          {service.price != null && (
            <div className="order-modal__total">
              <span>Total</span>
              <span className="order-modal__total-amount">
                ₱{total.toFixed(2)}
              </span>
            </div>
          )}

          <label className="field-label">Attach Files</label>
          <label className="order-file-drop" htmlFor="modalFiles">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                fill="currentColor"
                d="M12 3 7 8h3v6h4V8h3l-5-5Zm-7 14v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2h-2v2H7v-2H5Z"
              />
            </svg>
            <span>Click to attach files or drag them here</span>
            <input
              id="modalFiles"
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

function Receipt({ order, customerName, onClose }) {
  function formatDate(value) {
    const d = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
    if (!d) return "—";
    return d.toLocaleString(undefined, {
      month: "2-digit",
      day: "2-digit",
      year: "2-digit",
      hour: "numeric",
      minute: "2-digit",
    });
  }

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
          <span>{formatDate(order.createdAt)}</span>
          <span>Receipt · {order.referenceId}</span>
        </div>

        <h2 className="receipt__shop">PEREZ</h2>
        <p className="receipt__tagline">Printing Shop</p>

        <p className="receipt__date">{formatDate(order.createdAt)}</p>

        {customerName && (
          <p className="receipt__served">Ordered by: {customerName}</p>
        )}

        <div className="receipt__divider" />

        <div className="receipt__line">
          <span>
            {order.serviceName} x{order.quantity || 1}
          </span>
          <span>
            {order.totalPrice != null
              ? `₱${Number(order.totalPrice).toFixed(2)}`
              : "—"}
          </span>
        </div>

        {order.description && (
          <p className="receipt__desc">{order.description}</p>
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
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (uid) loadOrders();
  }, [uid]);

  async function loadOrders() {
    setLoading(true);
    try {
      const userOrders = await getUserOrders(uid);
      setOrders(userOrders);
    } catch (err) {
      // Non-fatal
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
        return "Completed";
      default:
        return s || "Placed";
    }
  }

  if (loading) {
    return <div className="dashboard-content">Loading your orders...</div>;
  }

  return (
    <div className="dashboard-content">
      {orders.length === 0 ? (
        <div className="um-empty">
          You haven't placed any orders yet. Browse Services to get started.
        </div>
      ) : (
        <div className="order-history">
          {orders.map((order) => (
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
                <span className="order-card__service">{order.serviceName || "Service"}</span>
                <span className={`order-status order-status--${order.status || "placed"}`}>
                  {statusLabel(order.status)}
                </span>
              </div>
              {order.referenceId && (
                <div className="order-card__ref">Ref: {order.referenceId}</div>
              )}
              {order.description && (
                <p className="order-card__desc">{order.description}</p>
              )}
              {(order.quantity || order.totalPrice != null) && (
                <div className="order-card__meta">
                  {order.quantity && (
                    <span>
                      Qty: {order.quantity} {order.unit || ""}
                    </span>
                  )}
                  {order.totalPrice != null && (
                    <span className="order-card__total">
                      Total: ₱{Number(order.totalPrice).toFixed(2)}
                    </span>
                  )}
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
            </div>
          ))}
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