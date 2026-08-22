import { useState } from "react";
import "./Login.css";
 import { loginUser, signupUser, resetPassword, friendlyAuthError } from "../services/authService"; 
 
export default function Login() {
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [status, setStatus] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
 
  function toggleMode() {
    setMode((m) => (m === "login" ? "signup" : "login"));
    setStatus({ text: "", type: "" });
    setEmailError("");
    setPasswordError("");
  }
 
  function handleForgotPassword(e) {
    e.preventDefault();
    setStatus({ text: "", type: "" });
 
    if (!email.trim()) {
      setEmailError("Enter your email above first.");
      return;
    }
    setEmailError("");
 
    // TODO: hook up password reset once a backend is connected.
    setStatus({ text: "Password reset is not connected yet.", type: "error" });
  }
 
  function handleSubmit(e) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setStatus({ text: "", type: "" });
 
    let valid = true;
    const trimmedEmail = email.trim();
 
    if (!trimmedEmail) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Enter a valid email address.");
      valid = false;
    }
 
    if (!password) {
      setPasswordError("Password is required.");
      valid = false;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      valid = false;
    }
 
    if (!valid) return;
 
    // TODO: replace this simulated request with a real auth call
    // (Firebase or otherwise) once the backend is connected.
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStatus({
        text:
          mode === "login"
            ? "Form is valid — not connected to a backend yet."
            : "Form is valid — sign-up not connected to a backend yet.",
        type: "success",
      });
    }, 600);
  }
 
  return (
    <div className="login-page">
      <div className="login-wrap">
        {/* Login card */}
        <div className="login-card">
          <div className="login-card__header">
            <h1>{mode === "login" ? "Login" : "Sign Up"}</h1>
          </div>
 
          <form onSubmit={handleSubmit} noValidate className="login-card__body">
            <div className="input-group">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z"
                  />
                </svg>
              </span>
              <input
                type="email"
                placeholder="Email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field-error">{emailError}</div>
 
            <div className="input-group">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Zm2 0h8V8a4 4 0 1 0-8 0Z"
                  />
                </svg>
              </span>
              <input
                type="password"
                placeholder="Password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="field-error">{passwordError}</div>
 
            {mode === "login" && (
              <a href="#" onClick={handleForgotPassword} className="forgot-link">
                Forgot Password?
              </a>
            )}
 
            <button type="submit" disabled={loading} className="login-btn">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M10 17v-3H3v-4h7V7l5 5-5 5Zm9 2H12v-2h7V7h-7V5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z"
                />
              </svg>
              {loading
                ? mode === "login"
                  ? "Logging in..."
                  : "Creating account..."
                : mode === "login"
                ? "Login"
                : "Create Account"}
            </button>
 
            {status.text && (
              <div className={`status ${status.type}`}>{status.text}</div>
            )}
 
            <div className="divider">
              <span>or</span>
            </div>
 
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                toggleMode();
              }}
              className="create-account"
            >
              {mode === "login" ? "Create Account" : "Back to Login"}
            </a>
          </form>
        </div>
 
        {/* Brand panel */}
        <div className="brand-panel">
          <img src="/logo.svg" alt="Perez Printing Shop logo" className="brand-panel__logo" />
          <h2 className="brand-panel__title">PEREZ</h2>
          <p className="brand-panel__subtitle">Printing Shop</p>
        </div>
      </div>
    </div>
  );
}