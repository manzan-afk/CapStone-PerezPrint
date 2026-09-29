import "./UnreadMessageBadge.css";

export default function SidebarCountBadge({ count, label }) {
  if (!count) return null;

  return (
    <span
      className="unread-message-badge"
      aria-label={`${count} ${label}`}
      title={`${count} ${label}`}
      aria-live="polite"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}