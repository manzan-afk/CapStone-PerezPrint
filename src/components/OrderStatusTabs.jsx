import "./OrderStatusTabs.css";
import { getSavedStatus } from "../utils/orderStatus";

const TABS = [
  { value: "all", label: "All" },
  { value: "placed", label: "Placed" },
  { value: "printing", label: "Printing" },
  { value: "ready", label: "Ready for Pickup" },
  { value: "completed", label: "Picked Up" },
  { value: "needs_revision", label: "Needs Revision" },
  { value: "cancelled", label: "Cancelled" },
];

// Status filter buttons with a count for each; "Cancelled" only shows when such orders exist.
// Orders are grouped by their last saved status, so an unsaved dropdown change doesn't move a card.
export default function OrderStatusTabs({ orders, active, onChange }) {
  const counts = {};
  orders.forEach((order) => {
    const status = getSavedStatus(order);
    counts[status] = (counts[status] || 0) + 1;
  });
  counts.all = orders.length;

  return (
    <div className="order-status-tabs" role="tablist" aria-label="Filter orders by status">
      {TABS.filter((tab) => tab.value !== "cancelled" || counts.cancelled || active === "cancelled").map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          className={`order-status-tabs__btn${active === tab.value ? " order-status-tabs__btn--active" : ""}`}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
          <span className="order-status-tabs__count">{counts[tab.value] || 0}</span>
        </button>
      ))}
    </div>
  );
}
