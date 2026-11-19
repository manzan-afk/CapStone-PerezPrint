import { PAYMENT_STATUS_LABELS, normalizePaymentStatus } from "../utils/orderStatus";
import "./PaymentBadge.css";

// Payment status pill, independent from the order status pill.
export default function PaymentBadge({ status }) {
  const normalized = normalizePaymentStatus(status);
  return (
    <span className={`pay-badge pay-badge--${normalized}`} title="Payment status">
      {PAYMENT_STATUS_LABELS[normalized]}
    </span>
  );
}
