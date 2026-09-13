import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signupUser, signInWithGoogle, friendlyAuthError } from "../services/authService";
import { createUserProfile, getUserProfile } from "../services/userServices";
import "./Login.css";

// Sends the user to the right dashboard based on their role.
function getRedirectPath(role) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/dashboard"; // default: customer
}

// Password requirement checks, used both for live feedback and validation.
const passwordRules = [
  { key: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { key: "uppercase", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { key: "number", label: "One number", test: (pw) => /[0-9]/.test(pw) },
  {
    key: "special",
    label: "One special character",
    test: (pw) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'~`]/.test(pw),
  },
];

export default function CreateAccount() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [privacyError, setPrivacyError] = useState("");

  const [status, setStatus] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPasswordRules, setShowPasswordRules] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setFirstNameError("");
    setLastNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setPhoneError("");
    setPrivacyError("");
    setStatus({ text: "", type: "" });

    let valid = true;
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirstName) {
      setFirstNameError("First name is required.");
      valid = false;
    }

    if (!trimmedLastName) {
      setLastNameError("Last name is required.");
      valid = false;
    }

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
    } else {
      const unmet = passwordRules.filter((rule) => !rule.test(password));
      if (unmet.length > 0) {
        setPasswordError("Password does not meet all requirements below.");
        valid = false;
      }
    }

    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password.");
      valid = false;
    } else if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match.");
      valid = false;
    }

    if (!trimmedPhone) {
      setPhoneError("Phone number is required for SMS notifications.");
      valid = false;
    } else if (!/^[0-9+\-\s()]{7,20}$/.test(trimmedPhone)) {
      setPhoneError("Enter a valid phone number.");
      valid = false;
    }

    if (!agreedToPrivacy) {
      setPrivacyError("You must agree to the Data Privacy Policy to create an account.");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      const userCredential = await signupUser(trimmedEmail, password);

      // New accounts default to "customer" — an admin can upgrade
      // someone's role later directly in Firestore.
      await createUserProfile(userCredential.user.uid, {
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        email: trimmedEmail,
        phone: trimmedPhone,
        role: "customer",
        agreedToPrivacyPolicy: true,
        agreedToPrivacyPolicyAt: new Date().toISOString(),
      });

      setStatus({ text: "Account created.", type: "success" });
      navigate("/dashboard");
    } catch (err) {
      setStatus({ text: friendlyAuthError(err.code), type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    setStatus({ text: "", type: "" });
    setGoogleLoading(true);

    try {
      const userCredential = await signInWithGoogle();
      const uid = userCredential.user.uid;

      const existingProfile = await getUserProfile(uid);

      if (!existingProfile) {
        // First time signing in with this Google account — send them to
        // finish setting up their profile (name, phone, privacy consent)
        // instead of creating a bare-bones profile automatically.
        navigate("/complete-registration");
      } else {
        navigate(getRedirectPath(existingProfile.role));
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
            <h3 className="brand-panel__heading">Join Perez Printing Shop</h3>
            <p className="brand-panel__lead">
              Create an account to place orders, track their status, and
              pick up right on time.
            </p>

            <ul className="brand-panel__features">
              <li>
                <span className="brand-panel__feature-icon">✓</span>
                Order online, anytime
              </li>
              <li>
                <span className="brand-panel__feature-icon">✓</span>
                Get SMS updates on your order
              </li>
              <li>
                <span className="brand-panel__feature-icon">✓</span>
                Track pickup status in real time
              </li>
            </ul>
          </div>

          <p className="brand-panel__footer">
            © {new Date().getFullYear()} Perez Printing Shop
          </p>
        </div>

        {/* Right: sign up form */}
        <div className="login-panel">
          <div className="login-panel__inner">
            <h1 className="login-panel__title">Create your account</h1>
            <p className="login-panel__subtitle">
              Sign up to start placing orders
            </p>

            <form onSubmit={handleSubmit} noValidate className="login-form">
            <label className="field-label" htmlFor="firstName">First Name</label>
            <div className="input-group">
              <input
                id="firstName"
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ paddingLeft: 14 }}
              />
            </div>
            <div className="field-error">{firstNameError}</div>

            <label className="field-label" htmlFor="lastName">Last Name</label>
            <div className="input-group">
              <input
                id="lastName"
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ paddingLeft: 14 }}
              />
            </div>
            <div className="field-error">{lastNameError}</div>

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

            <div className="input-group password-field-wrap input-group--password">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Zm2 0h8V8a4 4 0 1 0-8 0Z"
                  />
                </svg>
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setShowPasswordRules(true)}
                onBlur={() => setShowPasswordRules(false)}
              />
              <button
                type="button"
                className="toggle-visibility"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M12 6c-5 0-9.3 3.1-11 7.5C2.7 17.9 7 21 12 21s9.3-3.1 11-7.5C21.3 9.1 17 6 12 6Zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="m2 4.3 1.4-1.4 18.7 18.7-1.4 1.4-3.1-3.1c-1.7.7-3.6 1.1-5.6 1.1-5 0-9.3-3.1-11-7.5.8-2 2.1-3.8 3.8-5.1L2 4.3Zm5.5 5.5 1.6 1.6c-.1.2-.1.4-.1.6 0 1.7 1.3 3 3 3 .2 0 .4 0 .6-.1l1.6 1.6c-.7.3-1.4.5-2.2.5-2.8 0-5-2.2-5-5 0-.8.2-1.5.5-2.2Zm4.4-2.8c2.8 0 5 2.2 5 5 0 .5-.1 1-.2 1.5l2.9 2.9c1.4-1.2 2.5-2.7 3.2-4.4-1.7-4.4-6-7.5-11-7.5-1.3 0-2.6.2-3.7.6l2.2 2.2c.5-.2 1-.3 1.6-.3Z"
                    />
                  </svg>
                )}
              </button>

              {showPasswordRules && (
                <div className="password-rules-popup">
                  <ul className="password-rules">
                    {passwordRules.map((rule) => {
                      const met = rule.test(password);
                      return (
                        <li key={rule.key} className={met ? "rule-met" : "rule-unmet"}>
                          <span className="rule-icon">{met ? "✓" : "✕"}</span>
                          {rule.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
            <div className="field-error">{passwordError}</div>

            <div className="input-group input-group--password">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M6 10V8a6 6 0 1 1 12 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1Zm2 0h8V8a4 4 0 1 0-8 0Z"
                  />
                </svg>
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                className="toggle-visibility"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? (
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="M12 6c-5 0-9.3 3.1-11 7.5C2.7 17.9 7 21 12 21s9.3-3.1 11-7.5C21.3 9.1 17 6 12 6Zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="18" height="18">
                    <path
                      fill="currentColor"
                      d="m2 4.3 1.4-1.4 18.7 18.7-1.4 1.4-3.1-3.1c-1.7.7-3.6 1.1-5.6 1.1-5 0-9.3-3.1-11-7.5.8-2 2.1-3.8 3.8-5.1L2 4.3Zm5.5 5.5 1.6 1.6c-.1.2-.1.4-.1.6 0 1.7 1.3 3 3 3 .2 0 .4 0 .6-.1l1.6 1.6c-.7.3-1.4.5-2.2.5-2.8 0-5-2.2-5-5 0-.8.2-1.5.5-2.2Zm4.4-2.8c2.8 0 5 2.2 5 5 0 .5-.1 1-.2 1.5l2.9 2.9c1.4-1.2 2.5-2.7 3.2-4.4-1.7-4.4-6-7.5-11-7.5-1.3 0-2.6.2-3.7.6l2.2 2.2c.5-.2 1-.3 1.6-.3Z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="field-error">{confirmPasswordError}</div>

            <div className="input-group">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M6.6 10.8c1.4 2.7 3.9 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.2 1L6.6 10.8Z"
                  />
                </svg>
              </span>
              <input
                type="tel"
                placeholder="Phone number (for SMS notifications)"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="field-error">{phoneError}</div>

            <label className="privacy-check">
              <input
                type="checkbox"
                checked={agreedToPrivacy}
                onChange={(e) => setAgreedToPrivacy(e.target.checked)}
              />
              <span>
                I agree to the{" "}
                <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                  Data Privacy Policy
                </a>{" "}
                and consent to the collection and processing of my personal
                data.
              </span>
            </label>
            <div className="field-error">{privacyError}</div>

            <button type="submit" disabled={loading || googleLoading} className="login-btn">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M10 17v-3H3v-4h7V7l5 5-5 5Zm9 2H12v-2h7V7h-7V5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z"
                />
              </svg>
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <div className="divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="google-btn"
              onClick={handleGoogleSignup}
              disabled={loading || googleLoading}
            >
              <svg viewBox="0 0 48 48" width="18" height="18">
                <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5Z"/>
                <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7Z"/>
                <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6C29.6 35.1 27 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44Z"/>
                <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.6 5.6C41.9 35.9 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5Z"/>
              </svg>
              {googleLoading ? "Signing in..." : "Sign up with Google"}
            </button>

            {status.text && (
              <div className={`status ${status.type}`}>{status.text}</div>
            )}

              <p className="login-panel__signup">
                Already have an account?{" "}
                <Link to="/" className="login-panel__signup-link">
                  Sign in
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}