import { useEffect } from "react";
import { formatPerUnit } from "../utils/orderLines";
import "./OrderDetails.css";

const STATUS_LABELS = {
  placed: "Placed",
  printing: "Printing",
  ready: "Ready for Pickup",
  completed: "Picked Up",
  needs_revision: "Needs Revision",
  cancelled: "Cancelled",
};

function getLines(order) {
  if (order.items?.length > 0) return order.items;
  if (order.serviceName) {
    return [
      {
        serviceName: order.serviceName,
        varietyName: order.varietyName || "",
        quantity: order.quantity || 1,
        unit: order.unit || "",
        lineTotal: order.totalPrice,
      },
    ];
  }
  return [];
}

function formatDateTime(value) {
  const date = value?.toDate ? value.toDate() : null;
  return date
    ? date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "";
}

export default function OrderDetails({ order, onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const status = order.status || "placed";
  const lines = getLines(order);
  const info = [
    ["Customer", order.customerEmail || "Unknown customer"],
    ["Placed", formatDateTime(order.createdAt)],
    ["Last updated", formatDateTime(order.statusUpdatedAt)],
    ["Ready since", formatDateTime(order.pickupReadyAt)],
  ].filter(([, value]) => value);

  return (
    <div className="order-details-overlay" onClick={onClose}>
      <div
        className="order-details"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-details-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="order-details__close" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <header className="order-details__header">
          <h3 id="order-details-title">Order details</h3>
          <div className="order-details__ref-row">
            <span className="order-details__ref">{order.referenceId || "No reference"}</span>
            <span className={`order-status order-status--${status}`}>
              {STATUS_LABELS[status] || status}
            </span>
          </div>
        </header>

        <dl className="order-details__info">
          {info.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>

        <section className="order-details__section">
          <h4>Items</h4>
          {lines.length === 0 ? (
            <p className="order-details__muted">Order items unavailable.</p>
          ) : (
            <ul className="order-details__items">
              {lines.map((line, index) => (
                <li key={index} className="order-details__item">
                  <div className="order-details__item-head">
                    <div className="order-details__item-title">
                      <span className="order-details__item-name">{line.serviceName || "Service"}</span>
                      {line.varietyName && (
                        <span className="order-details__item-variant">{line.varietyName}</span>
                      )}
                    </div>
                    <span className="order-details__item-price">
                      {line.lineTotal != null ? `\u20b1${Number(line.lineTotal).toFixed(2)}` : "\u2014"}
                    </span>
                  </div>

                  <div className="order-details__item-meta">
                    <span>Quantity: {line.quantity || 1}</span>
                    {line.unit && <span>{formatPerUnit(line.unit)}</span>}
                    {line.unitPrice != null && (
                      <span>₱{Number(line.unitPrice).toFixed(2)} each</span>
                    )}
                  </div>

                  {line.options?.length > 0 && (
                    <div className="order-details__chips">
                      {line.options.map((option) => (
                        <span key={option.name} className="order-details__chip">
                          <b>{option.name}</b> {option.type}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {order.description && (
          <section className="order-details__section">
            <h4>Specifications / Description</h4>
            <p className="order-details__text">{order.description}</p>
          </section>
        )}

        {order.staffNote && (
          <section className="order-details__section">
            <h4>Staff note to customer</h4>
            <p className="order-details__text order-details__text--note">{order.staffNote}</p>
          </section>
        )}

        {order.files?.length > 0 && (
          <section className="order-details__section">
            <h4>Attached files</h4>
            <div className="order-details__files">
              {order.files.map((file, index) => (
                <a key={index} href={file.url} target="_blank" rel="noopener noreferrer">
                  {"\ud83d\udcce "}
                  {file.name}
                </a>
              ))}
            </div>
          </section>
        )}

        <footer className="order-details__total">
          <span>Total</span>
          <strong>
            {order.totalPrice != null ? `\u20b1${Number(order.totalPrice).toFixed(2)}` : "\u2014"}
          </strong>
        </footer>
      </div>
    </div>
  );
}
