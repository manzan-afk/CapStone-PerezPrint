import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, resetPassword, signInWithGoogle, friendlyAuthError } from "../services/authService";
import { getUserProfile } from "../services/userServices";
import "./Login.css";

// Sends the user to the right dashboard based on their role.
function getRedirectPath(role) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/dashboard"; // default: customer
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [status, setStatus] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleForgotPassword(e) {
    e.preventDefault();
    setStatus({ text: "", type: "" });

    if (!email.trim()) {
      setEmailError("Enter your email above first.");
      return;
    }
    setEmailError("");

    try {
      await resetPassword(email.trim());
      setStatus({ text: "Password reset email sent.", type: "success" });
    } catch (err) {
      setStatus({ text: friendlyAuthError(err.code), type: "error" });
    }
  }

  async function handleSubmit(e) {
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

    setLoading(true);
    try {
      const userCredential = await loginUser(trimmedEmail, password);
      const profile = await getUserProfile(userCredential.user.uid);

      setStatus({ text: "Logged in successfully.", type: "success" });
      navigate(getRedirectPath(profile?.role));
    } catch (err) {
      setStatus({ text: friendlyAuthError(err.code), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setStatus({ text: "", type: "" });
    setGoogleLoading(true);

    try {
      const userCredential = await signInWithGoogle();
      const profile = await getUserProfile(userCredential.user.uid);

      if (!profile) {
        // First time signing in with this Google account — finish setup
        // (name, phone, privacy consent) before reaching a dashboard.
        navigate("/complete-registration");
      } else {
        navigate(getRedirectPath(profile.role));
      }
    } catch (err) {
      setStatus({ text: friendlyAuthError(err.code), type: "error" });
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-wrap">
        {/* Login card */}
        <div className="login-card">
          <div className="login-card__header">
            <h1>Login</h1>
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

            <a href="#" onClick={handleForgotPassword} className="forgot-link">
              Forgot Password?
            </a>

            <button type="submit" disabled={loading || googleLoading} className="login-btn">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M10 17v-3H3v-4h7V7l5 5-5 5Zm9 2H12v-2h7V7h-7V5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z"
                />
              </svg>
              {loading ? "Logging in..." : "Login"}
            </button>

            {status.text && (
              <div className={`status ${status.type}`}>{status.text}</div>
            )}

            <div className="divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleLogin}
              disabled={loading || googleLoading}
            >
              <svg viewBox="0 0 48 48" width="18" height="18">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5Z"/>
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7Z"/>
                <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6C29.6 35.1 27 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44Z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.6 5.6C41.9 35.9 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5Z"/>
              </svg>
              {googleLoading ? "Signing in..." : "Sign in with Google"}
            </button>

            <Link to="/create-account" className="create-account">
              Create Account
            </Link>
          </form>
        </div>

        {/* Brand panel */}
        <div className="brand-panel">
          <img src="/logo.png" alt="Perez Printing Shop logo" className="brand-panel__logo" />
          <h2 className="brand-panel__title">PEREZ</h2>
          <p className="brand-panel__subtitle">Printing Shop</p>
        </div>
      </div>
    </div>
  );
}