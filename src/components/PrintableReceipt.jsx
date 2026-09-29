import "./PrintableReceipt.css";

function getReceiptLines(order) {
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

function formatTimestamp(value) {
  const date = value?.toDate ? value.toDate() : value instanceof Date ? value : null;
  if (!date) return "-";
  return date.toLocaleString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
}

export default function PrintableReceipt({ order, customerName, onClose }) {
  const lines = getReceiptLines(order);

  return (
    <div className="printable-receipt-overlay" onClick={onClose}>
      <div className="printable-receipt" onClick={(event) => event.stopPropagation()}>
        <button
          type="button"
          className="printable-receipt__close printable-receipt__no-print"
          onClick={onClose}
          aria-label="Close receipt"
        >
          X
        </button>

        <div className="printable-receipt__meta-row">
          <span>{formatTimestamp(order.createdAt)}</span>
          <span>Receipt - {order.referenceId || "-"}</span>
        </div>

        <h2 className="printable-receipt__shop">PEREZ</h2>
        <p className="printable-receipt__tagline">Printing Shop</p>
        <p className="printable-receipt__date">{formatTimestamp(order.createdAt)}</p>
        {customerName && <p className="printable-receipt__served">Ordered by: {customerName}</p>}

        <div className="printable-receipt__divider" />

        {lines.map((line, index) => (
          <div key={index} className="printable-receipt__line">
            <span>
              {line.serviceName || "Service"}
              {line.varietyName ? ` (${line.varietyName})` : ""} x{line.quantity || 1}
            </span>
            <span>
              {line.lineTotal != null ? `₱${Number(line.lineTotal).toFixed(2)}` : "-"}
            </span>
          </div>
        ))}

        {order.description && <p className="printable-receipt__desc">{order.description}</p>}

        <div className="printable-receipt__divider" />
        <p className="printable-receipt__total">
          TOTAL: {order.totalPrice != null ? `₱${Number(order.totalPrice).toFixed(2)}` : "-"}
        </p>

        <div className="printable-receipt__reference-box">
          <span className="printable-receipt__reference-label">Reference / Tracking No.</span>
          <span className="printable-receipt__reference-value">{order.referenceId || "-"}</span>
          <span className="printable-receipt__reference-hint">
            Show this at pickup to claim your order.
          </span>
        </div>

        {order.status === "completed" && (
          <p className="printable-receipt__screenshot-hint printable-receipt__no-print">
            Take a screenshot of this receipt for your records.
          </p>
        )}

        <p className="printable-receipt__thanks">Thank you for your business!</p>

        <div className="printable-receipt__actions printable-receipt__no-print">
          <button type="button" className="printable-receipt__print-btn" onClick={() => window.print()}>
            Print Receipt
          </button>
          <button type="button" className="printable-receipt__done-btn" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
