import { useEffect, useState } from "react";
import {
  deleteNotification,
  markNotificationRead,
  markNotificationUnread,
  subscribeNotifications,
} from "../services/notificationService";
import "./NotificationCenter.css";

function formatTimestamp(value) {
  const date = value?.toDate?.();
  if (!date) return "";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function NotificationCenter({ uid, open, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    if (!uid) return undefined;
    return subscribeNotifications(
      uid,
      (items) => {
        setNotifications(items);
        setError("");
        setLoading(false);
      },
      (subscriptionError) => {
        console.error("Failed to load notifications:", subscriptionError);
        setError("Failed to load notifications.");
        setLoading(false);
      }
    );
  }, [uid]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  async function runAction(id, action) {
    setBusyId(id);
    try {
      await action();
    } catch (actionError) {
      console.error("Notification action failed:", actionError);
      setError("That notification action could not be completed.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="notification-modal-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="notification-modal" role="dialog" aria-modal="true" aria-labelledby="notification-title">
        <header className="notification-modal__header">
          <div>
            <span className="notification-modal__eyebrow">Updates</span>
            <h2 id="notification-title">Notifications</h2>
          </div>
          <button type="button" className="notification-modal__close" onClick={onClose} aria-label="Close notifications">
            ×
          </button>
        </header>

        <div className="notification-modal__body" aria-live="polite">
          {loading && <div className="notification-modal__state">Loading notifications...</div>}
          {!loading && error && <div className="notification-modal__state notification-modal__state--error">{error}</div>}
          {!loading && !error && notifications.length === 0 && (
            <div className="notification-modal__state">No notifications yet.</div>
          )}

          {!loading && notifications.map((item) => (
            <article className={`notification-item ${item.read ? "notification-item--read" : "notification-item--unread"}`} key={item.id}>
              <div className="notification-item__dot" aria-hidden="true" />
              <div className="notification-item__content">
                <h3>{item.title}</h3>
                <p>{item.message}</p>
                {item.createdAt && <time>{formatTimestamp(item.createdAt)}</time>}
                <div className="notification-item__actions">
                  {item.read ? (
                    <button type="button" disabled={busyId === item.id} onClick={() => runAction(
                      item.id,
                      () => markNotificationUnread(uid, item.id)
                    )}>Mark Unread</button>
                  ) : (
                    <button type="button" disabled={busyId === item.id} onClick={() => runAction(
                      item.id,
                      () => markNotificationRead(uid, item.id)
                    )}>Mark Read</button>
                  )}
                  <button type="button" className="notification-item__delete" disabled={busyId === item.id} onClick={() => runAction(
                    item.id,
                    () => deleteNotification(uid, item.id)
                  )}>Delete</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
