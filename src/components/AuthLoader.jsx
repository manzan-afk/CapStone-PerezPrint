import "./AuthLoader.css";

export default function AuthLoader({ visible = true, message = "Loading..." }) {
  if (!visible) return null;

  return (
    <div className="auth-loader-overlay" role="status" aria-live="polite">
      <div className="auth-loader-card">
        <div className="auth-loader-ring">
          <span className="auth-loader-spinner" aria-hidden="true" />
          <img src="/logo.png" alt="Perez Printing Shop" className="auth-loader-logo" />
        </div>
        <strong className="auth-loader-brand">PEREZ PRINTING SHOP</strong>
        <span className="auth-loader-msg">{message}</span>
      </div>
    </div>
  );
}
