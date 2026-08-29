import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createUserProfile } from "../services/userServices";
import "./Login.css";

export default function CompleteRegistration() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [privacyError, setPrivacyError] = useState("");

  const [status, setStatus] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);

  // Pre-fill First/Last Name from the Google account's display name, once,
  // as a convenient starting point — the person can still edit it before
  // submitting. Doesn't overwrite anything they've already typed.
  useEffect(() => {
    if (!user?.displayName) return;

    const parts = user.displayName.trim().split(/\s+/);
    const guessedFirstName = parts[0] || "";
    const guessedLastName = parts.slice(1).join(" ") || "";

    setFirstName((prev) => prev || guessedFirstName);
    setLastName((prev) => prev || guessedLastName);
  }, [user]);

  // Not signed in at all — nothing to complete registration for.
  if (!authLoading && !user) {
    navigate("/", { replace: true });
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFirstNameError("");
    setLastNameError("");
    setPhoneError("");
    setPrivacyError("");
    setStatus({ text: "", type: "" });

    let valid = true;
    const trimmedFirstName = firstName.trim();
    const trimmedLastName = lastName.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedFirstName) {
      setFirstNameError("First name is required.");
      valid = false;
    }

    if (!trimmedLastName) {
      setLastNameError("Last name is required.");
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
      setPrivacyError("You must agree to the Data Privacy Policy to continue.");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      await createUserProfile(user.uid, {
        email: user.email,
        firstName: trimmedFirstName,
        lastName: trimmedLastName,
        phone: trimmedPhone,
        role: "customer",
        provider: "google",
        agreedToPrivacyPolicy: true,
        agreedToPrivacyPolicyAt: new Date().toISOString(),
      });

      setStatus({ text: "Registration complete.", type: "success" });
      navigate("/dashboard");
    } catch (err) {
      setStatus({ text: "Something went wrong. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-wrap">
        <div className="login-card">
          <div className="login-card__header">
            <h1>Complete Registration</h1>
          </div>

          <form onSubmit={handleSubmit} noValidate className="login-card__body">
            {/* Email — locked in from the Google account, read-only */}
            <div className="input-group">
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="currentColor"
                    d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.4 0-8 2.2-8 5v1h16v-1c0-2.8-3.6-5-8-5Z"
                  />
                </svg>
              </span>
              <input type="email" value={user?.email || ""} readOnly disabled />
            </div>
            <div className="field-hint">Signed in with Google — this email can't be changed here.</div>

            <div className="input-group">
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                style={{ paddingLeft: 14 }}
              />
            </div>
            <div className="field-error">{firstNameError}</div>

            <div className="input-group">
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                style={{ paddingLeft: 14 }}
              />
            </div>
            <div className="field-error">{lastNameError}</div>
            {user?.displayName && (
              <div className="field-hint" style={{ marginTop: -6 }}>
                Pre-filled from your Google account — feel free to edit.
              </div>
            )}

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

            <button type="submit" disabled={loading} className="login-btn">
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path
                  fill="currentColor"
                  d="M10 17v-3H3v-4h7V7l5 5-5 5Zm9 2H12v-2h7V7h-7V5h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z"
                />
              </svg>
              {loading ? "Saving..." : "Finish Registration"}
            </button>

            {status.text && (
              <div className={`status ${status.type}`}>{status.text}</div>
            )}
          </form>
        </div>

        <div className="brand-panel">
          <img src="/logo.png" alt="Perez Printing Shop logo" className="brand-panel__logo" />
          <h2 className="brand-panel__title">PEREZ</h2>
          <p className="brand-panel__subtitle">Printing Shop</p>
        </div>
      </div>
    </div>
  );
}