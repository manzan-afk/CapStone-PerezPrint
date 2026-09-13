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
      <div className="login-shell">
        {/* Left: feature / brand panel */}
        <div className="brand-panel">
          <div className="brand-panel__top">
            <img src="/logo.png" alt="Perez Printing Shop logo" className="brand-panel__logo" />
            <div>
              <h2 className="brand-panel__title">PEREZ</h2>
              <p className="brand-panel__subtitle">Printing Shop</p>
            </div>
          </div>

          <div className="brand-panel__body">
            <h3 className="brand-panel__heading">
              Manage your print shop, start to finish.
            </h3>
            <p className="brand-panel__lead">
              Orders, services, and customers — all in one place, built for
              how your shop actually runs.
            </p>

            <ul className="brand-panel__features">
              <li>
                <span className="brand-panel__feature-icon">✓</span>
                Track orders from placed to pickup
              </li>
              <li>
                <span className="brand-panel__feature-icon">✓</span>
                Manage services, pricing, and staff
              </li>
              <li>
                <span className="brand-panel__feature-icon">✓</span>
                Give customers real-time order status
              </li>
            </ul>
          </div>

          <p className="brand-panel__footer">
            © {new Date().getFullYear()} Perez Printing Shop
          </p>
        </div>

        {/* Right: login form */}
        <div className="login-panel">
          <div className="login-panel__inner">
            <h1 className="login-panel__title">Welcome back</h1>
            <p className="login-panel__subtitle">
              Sign in to your account to continue
            </p>

            <form onSubmit={handleSubmit} noValidate className="login-form">
              <label className="field-label" htmlFor="loginEmail">Email</label>
              <div className="input-group">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z"
                    />
                  </svg>
                </span>
                <input
                  id="loginEmail"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="field-error">{emailError}</div>

              <div className="field-row">
                <label className="field-label" htmlFor="loginPassword">Password</label>
                <a href="#" onClick={handleForgotPassword} className="forgot-link">
                  Forgot password?
                </a>
              </div>
              <div className="input-group">
                <span className="input-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Zm2 0h8V8a4 4 0 1 0-8 0Z"
                    />
                  </svg>
                </span>
                <input
                  id="loginPassword"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="field-error">{passwordError}</div>

              <button type="submit" disabled={loading || googleLoading} className="login-btn">
                {loading ? "Signing in..." : "Sign In"}
              </button>

              {status.text && (
                <div className={`status ${status.type}`}>{status.text}</div>
              )}

              <div className="divider">
                <span>or continue with</span>
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

              <p className="login-panel__signup">
                Don't have an account?{" "}
                <Link to="/create-account" className="login-panel__signup-link">
                  Create one
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}