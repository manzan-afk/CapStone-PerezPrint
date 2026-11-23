import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createUserProfile } from "../services/userServices";
import useTheme from "../hooks/useTheme";
import ThemeToggle from "../components/ThemeToggle";
import "./CreateAccount.css";

const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
const PHONE_PATTERN = /^[0-9+\-\s()]{7,20}$/;

function validateName(value, label) {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < 2) return `${label} must be at least 2 characters.`;
  if (!NAME_PATTERN.test(trimmed)) {
    return `${label} can only contain letters, spaces, hyphens, or apostrophes.`;
  }
  return "";
}

const iconProps = {
  viewBox: "0 0 24 24",
  width: "17",
  height: "17",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export default function CompleteRegistration() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [theme, toggleTheme] = useTheme();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [privacyError, setPrivacyError] = useState("");

  const [status, setStatus] = useState({ text: "", type: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const redirectTimer = useRef(null);

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  useEffect(() => {
    if (!leaveModalOpen) return undefined;
    function handleKeyDown(e) {
      if (e.key === "Escape") setLeaveModalOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leaveModalOpen]);

  // Not signed in at all — nothing to complete registration for.
  if (!authLoading && !user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus({ text: "", type: "" });

    const firstError = validateName(firstName, "First name");
    const lastError = validateName(lastName, "Last name");
    const trimmedPhone = phone.trim();
    let phoneValidation = "";
    if (!trimmedPhone) {
      phoneValidation = "Phone number is required for SMS notifications.";
    } else if (!PHONE_PATTERN.test(trimmedPhone)) {
      phoneValidation = "Please enter a valid phone number (e.g., 09XX XXX XXXX).";
    }
    const privacyValidation = agreedToPrivacy
      ? ""
      : "You must agree to the Data Privacy Policy to continue.";

    setFirstNameError(firstError);
    setLastNameError(lastError);
    setPhoneError(phoneValidation);
    setPrivacyError(privacyValidation);
    if (firstError || lastError || phoneValidation || privacyValidation) return;

    setSaving(true);
    try {
      await createUserProfile(user.uid, {
        email: user.email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: trimmedPhone,
        role: "customer",
        provider: "google",
        agreedToPrivacyPolicy: true,
        agreedToPrivacyPolicyAt: new Date().toISOString(),
      });

      setDone(true);
      setStatus({ text: "Registration complete! Redirecting to your dashboard...", type: "success" });
      redirectTimer.current = setTimeout(() => navigate("/dashboard"), 1500);
    } catch {
      setStatus({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="reg-page" data-theme={theme}>
      <main className="reg-container">
        <header className="reg-header">
          <button type="button" className="reg-back-btn" onClick={() => setLeaveModalOpen(true)}>
            <span className="reg-back-btn__circle" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
            </span>
            <span>Back</span>
          </button>

          <div className="reg-stepper" aria-label="Final step: Complete Profile">
            <span className="reg-stepper__bar reg-stepper__bar--done" />
            <span className="reg-stepper__bar reg-stepper__bar--active" />
          </div>

          <ThemeToggle theme={theme} onToggle={toggleTheme} className="reg-theme-btn" iconSize={15} />
        </header>

        <div className="reg-brand-row">
          <img src="/logo.png" alt="Perez Printing Shop logo" className="reg-brand-row__logo" />
          <div className="reg-brand-row__meta">
            <span className="reg-brand-row__shop">
              <strong>PEREZ</strong> Printing Shop
            </span>
            <span className="reg-brand-row__step-tag">Final Step · Complete Registration</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate className="reg-form">
          <h1 className="reg-step-title">Almost There</h1>
          <p className="reg-step-subtitle">
            Your Google account is verified. Add your name and phone number to finish setting up your
            customer profile.
          </p>

          <div className="reg-verified-pill">
            <span className="reg-verified-pill__check" aria-hidden="true">✓</span>
            <span>Signed in with Google as <strong>{user?.email || ""}</strong></span>
          </div>

          <div className="reg-grid-2">
            <div className="reg-field">
              <label className="reg-label" htmlFor="firstName">
                First Name <span className="reg-req">*</span>
              </label>
              <div className={`reg-input-wrap${firstNameError ? " reg-input-wrap--error" : ""}`}>
                <span className="reg-input-icon" aria-hidden="true">
                  <svg {...iconProps}>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>
                </span>
                <input
                  id="firstName"
                  type="text"
                  placeholder="Given name"
                  autoComplete="given-name"
                  aria-invalid={Boolean(firstNameError)}
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (firstNameError) setFirstNameError("");
                  }}
                />
              </div>
              {firstNameError && <div className="reg-error" role="alert">{firstNameError}</div>}
            </div>

            <div className="reg-field">
              <label className="reg-label" htmlFor="lastName">
                Last Name <span className="reg-req">*</span>
              </label>
              <div className={`reg-input-wrap${lastNameError ? " reg-input-wrap--error" : ""}`}>
                <span className="reg-input-icon" aria-hidden="true">
                  <svg {...iconProps}>
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21a8 8 0 0 1 16 0" />
                  </svg>
                </span>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Family name"
                  autoComplete="family-name"
                  aria-invalid={Boolean(lastNameError)}
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (lastNameError) setLastNameError("");
                  }}
                />
              </div>
              {lastNameError && <div className="reg-error" role="alert">{lastNameError}</div>}
            </div>
          </div>

          <div className="reg-field">
            <label className="reg-label" htmlFor="regPhone">
              Phone Number <span className="reg-req">*</span>
            </label>
            <div className={`reg-input-wrap${phoneError ? " reg-input-wrap--error" : ""}`}>
              <span className="reg-input-icon" aria-hidden="true">
                <svg {...iconProps}>
                  <rect x="6" y="2" width="12" height="20" rx="2" />
                  <path d="M11 18h2" />
                </svg>
              </span>
              <input
                id="regPhone"
                type="tel"
                placeholder="09XX XXX XXXX"
                autoComplete="tel"
                aria-invalid={Boolean(phoneError)}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  if (phoneError) setPhoneError("");
                }}
              />
            </div>
            {phoneError ? (
              <div className="reg-error" role="alert">{phoneError}</div>
            ) : (
              <div className="reg-helper">Used for SMS updates about your print orders.</div>
            )}
          </div>

          <label className="reg-privacy-check">
            <input
              type="checkbox"
              checked={agreedToPrivacy}
              onChange={(e) => {
                setAgreedToPrivacy(e.target.checked);
                if (e.target.checked) setPrivacyError("");
              }}
            />
            <span>
              I agree to the{" "}
              <a href="/privacy-policy" target="_blank" rel="noopener noreferrer">
                Data Privacy Policy
              </a>{" "}
              and consent to the collection and processing of my personal data.
            </span>
          </label>
          {privacyError && <div className="reg-error" role="alert">{privacyError}</div>}

          {status.text && (
            <div className={`reg-status reg-status--${status.type}`} role="status">{status.text}</div>
          )}

          <div className="reg-actions-bar">
            <button type="button" className="reg-text-link" onClick={() => setLeaveModalOpen(true)}>
              Need a different account? <strong>Back to sign in</strong>
            </button>
            <button type="submit" className="reg-btn reg-btn--primary" disabled={saving || done}>
              {saving && <span className="reg-spinner" aria-hidden="true" />}
              {done ? "Registration Complete ✓" : saving ? "Saving..." : "Finish Registration"}
            </button>
          </div>
        </form>
      </main>

      {leaveModalOpen && (
        <div
          className="reg-modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLeaveModalOpen(false);
          }}
        >
          <div className="reg-modal" role="dialog" aria-modal="true" aria-labelledby="complete-back-modal-title">
            <h2 id="complete-back-modal-title" className="reg-modal__title">Return to Sign In?</h2>
            <p className="reg-modal__subtitle">
              Your profile isn't saved yet. Are you sure you want to go back to the sign-in page?
            </p>
            <div className="reg-callout reg-callout--modal">
              You can sign in again with Google anytime to finish your registration.
            </div>
            <div className="reg-modal__actions">
              <button type="button" className="reg-btn reg-btn--secondary" onClick={() => setLeaveModalOpen(false)}>
                Stay here
              </button>
              <button type="button" className="reg-btn reg-btn--primary" onClick={() => navigate("/")}>
                Back to sign in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
