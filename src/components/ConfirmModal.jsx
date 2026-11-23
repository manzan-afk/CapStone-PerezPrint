import { useEffect } from "react";
import "./ConfirmModal.css";

export default function ConfirmModal({
  open,
  title,
  message,
  note = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "default",
  busy = false,
  error = "",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;

    function handleKeyDown(e) {
      if (e.key === "Escape" && !busy) onCancel?.();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="cmodal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onCancel?.();
      }}
    >
      <div
        className="cmodal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cmodal-title"
      >
        <div className="cmodal-header">
          <span className={`cmodal-icon cmodal-icon--${variant}`} aria-hidden="true">
            {variant === "danger" ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            )}
          </span>
          <h3 id="cmodal-title" className="cmodal-title">{title}</h3>
        </div>

        <p className="cmodal-message">{message}</p>
        {note && <div className="cmodal-note">{note}</div>}
        {error && <div className="cmodal-error" role="alert">{error}</div>}

        <div className="cmodal-actions">
          <button type="button" className="cmodal-btn cmodal-btn--cancel" onClick={onCancel} disabled={busy}>
            {cancelLabel}
          </button>
          <button type="button" className={`cmodal-btn cmodal-btn--${variant}`} onClick={onConfirm} disabled={busy}>
            {busy && <span className="cmodal-spinner" aria-hidden="true" />}
            {busy ? "Please wait..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
