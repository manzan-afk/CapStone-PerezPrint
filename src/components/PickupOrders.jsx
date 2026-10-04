import { useEffect, useState } from "react";
import { subscribeAllOrders, updateOrderStatus } from "../services/ordersService";
import { lineOptionsSuffix } from "../utils/orderLines";
import PrintableReceipt from "./PrintableReceipt";
import "./PickupOrders.css";

function getLines(order) {
  if (order.items?.length > 0) return order.items;
  if (order.serviceName) {
    return [
      {
        serviceName: order.serviceName,
        varietyName: order.varietyName || "",
        quantity: order.quantity || 1,
        lineTotal: order.totalPrice,
      },
    ];
  }
  return [];
}

function formatReadyTime(order) {
  const date = (order.pickupReadyAt || order.statusUpdatedAt)?.toDate?.();
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

export default function PickupOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [receiptOrder, setReceiptOrder] = useState(null);

  useEffect(() => {
    return subscribeAllOrders(
      (allOrders) => {
        setOrders(allOrders);
        setLoading(false);
      },
      () => {
        setError("Failed to load pickups. Please try again.");
        setLoading(false);
      }
    );
  }, []);

  async function handlePickedUp(order) {
    setSavingId(order.id);
    setError("");
    try {
      await updateOrderStatus(order.id, "completed");
      setReceiptOrder({ ...order, status: "completed" });
    } catch (err) {
      setError("Failed to mark the order as picked up. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  if (loading) {
    return <div className="dashboard-content">Loading pickups...</div>;
  }

  const search = searchTerm.trim().toLowerCase();
  const readyOrders = orders
    .filter((order) => order.status === "ready")
    .filter((order) => {
      if (!search) return true;
      const lineText = getLines(order).map((line) => line.serviceName).join(" ");
      return [order.referenceId, order.customerEmail, lineText].some((value) =>
        value?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const aTime = (a.pickupReadyAt || a.statusUpdatedAt)?.toMillis?.() || 0;
      const bTime = (b.pickupReadyAt || b.statusUpdatedAt)?.toMillis?.() || 0;
      return aTime - bTime;
    });

  return (
    <div className="dashboard-content">
      {error && <div className="um-error">{error}</div>}

      <div className="pickup-toolbar">
        <div>
          <h3 className="dashboard-section__title">Ready for pickup</h3>
          <p className="pickup-toolbar__sub">
            {readyOrders.length} {readyOrders.length === 1 ? "order" : "orders"} waiting, longest wait first
          </p>
        </div>
        <input
          type="search"
          className="pickup-search"
          placeholder="Search reference, customer, service..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search pickups"
        />
      </div>

      {readyOrders.length === 0 ? (
        <div className="um-empty">
          {search ? "No pickups match your search." : "No orders are ready for pickup."}
        </div>
      ) : (
        <div className="pickup-grid">
          {readyOrders.map((order) => (
            <article className="pickup-card" key={order.id}>
              <header className="pickup-card__header">
                <span className="pickup-card__ref">{order.referenceId || "No reference"}</span>
                <span className="order-status order-status--ready">Ready for Pickup</span>
              </header>

              <dl className="pickup-card__meta">
                <div>
                  <dt>Customer</dt>
                  <dd>{order.customerEmail || "\u2014"}</dd>
                </div>
                {formatReadyTime(order) && (
                  <div>
                    <dt>Ready since</dt>
                    <dd>{formatReadyTime(order)}</dd>
                  </div>
                )}
              </dl>

              <ul className="pickup-card__items">
                {getLines(order).map((line, index) => (
                  <li key={index}>
                    <span>
                      {line.serviceName || "Service"}
                      {line.varietyName ? ` (${line.varietyName})` : ""}
                      {lineOptionsSuffix(line)} x{line.quantity || 1}
                    </span>
                    <span>
                      {line.lineTotal != null ? `\u20b1${Number(line.lineTotal).toFixed(2)}` : "\u2014"}
                    </span>
                  </li>
                ))}
              </ul>

              {order.description && <p className="pickup-card__note">{order.description}</p>}

              <footer className="pickup-card__footer">
                <span className="pickup-card__total">
                  Total {order.totalPrice != null ? `\u20b1${Number(order.totalPrice).toFixed(2)}` : "\u2014"}
                </span>
                <button
                  type="button"
                  className="pickup-card__btn"
                  onClick={() => handlePickedUp(order)}
                  disabled={savingId === order.id}
                >
                  {savingId === order.id ? "Saving..." : "Mark as picked up"}
                </button>
              </footer>
            </article>
          ))}
        </div>
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
