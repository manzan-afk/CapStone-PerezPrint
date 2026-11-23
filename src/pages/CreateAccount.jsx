import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupUser, signInWithGoogle, friendlyAuthError } from "../services/authService";
import { createUserProfile, getUserProfile } from "../services/userServices";
import {
  clearOtpState,
  isEmailVerified,
  isValidGmail,
  sendOtp,
  verifyOtp,
} from "../services/otpService";
import useTheme from "../hooks/useTheme";
import ThemeToggle from "../components/ThemeToggle";
import "./CreateAccount.css";

const OTP_LENGTH = 6;
const RESEND_SECONDS = 45;
const STEP_TITLES = ["Account Details", "Email Verification", "Password & Privacy"];

// Sends the user to the right dashboard based on their role.
function getRedirectPath(role) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/dashboard"; // default: customer
}

// Password requirement checks, used both for live feedback and validation.
const passwordRules = [
  { key: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { key: "uppercase", label: "One uppercase letter (A–Z)", test: (pw) => /[A-Z]/.test(pw) },
  { key: "lowercase", label: "One lowercase letter (a–z)", test: (pw) => /[a-z]/.test(pw) },
  { key: "number", label: "One number (0–9)", test: (pw) => /[0-9]/.test(pw) },
  {
    key: "special",
    label: "One special character (!@#$...)",
    test: (pw) => /[!@#$%^&*(),.?":{}|<>_\-+=[\]/\\;'~`]/.test(pw),
  },
];

const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;

function validateName(value, label) {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length < 2) return `${label} must be at least 2 characters.`;
  if (!NAME_PATTERN.test(trimmed)) {
    return `${label} can only contain letters, spaces, hyphens, or apostrophes.`;
  }
  return "";
}

function validateGmail(value) {
  const trimmed = value.trim();
  if (!trimmed) return "Gmail address is required.";
  if (!isValidGmail(trimmed)) return "Please enter a valid Gmail address (e.g., example@gmail.com).";
  return "";
}

function validatePassword(value) {
  if (!value) return "Password is required.";
  if (/\s/.test(value)) return "Password cannot contain spaces.";
  if (value.length < 8) return "Password must be at least 8 characters long.";
  if (!passwordRules.every((rule) => rule.test(value))) {
    return "Password must include uppercase, lowercase, a number, and a special character.";
  }
  return "";
}

function EyeIcon({ hidden }) {
  return hidden ? (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="m2 4.3 1.4-1.4 18.7 18.7-1.4 1.4-3.1-3.1c-1.7.7-3.6 1.1-5.6 1.1-5 0-9.3-3.1-11-7.5.8-2 2.1-3.8 3.8-5.1L2 4.3Zm5.5 5.5 1.6 1.6c-.1.2-.1.4-.1.6 0 1.7 1.3 3 3 3 .2 0 .4 0 .6-.1l1.6 1.6c-.7.3-1.4.5-2.2.5-2.8 0-5-2.2-5-5 0-.8.2-1.5.5-2.2Zm4.4-2.8c2.8 0 5 2.2 5 5 0 .5-.1 1-.2 1.5l2.9 2.9c1.4-1.2 2.5-2.7 3.2-4.4-1.7-4.4-6-7.5-11-7.5-1.3 0-2.6.2-3.7.6l2.2 2.2c.5-.2 1-.3 1.6-.3Z"
      />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 6c-5 0-9.3 3.1-11 7.5C2.7 17.9 7 21 12 21s9.3-3.1 11-7.5C21.3 9.1 17 6 12 6Zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5Z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7Z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6C29.6 35.1 27 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44Z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.6 5.6C41.9 35.9 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5Z" />
    </svg>
  );
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

export default function CreateAccount() {
  const navigate = useNavigate();
  const [theme, toggleTheme] = useTheme();

  const [step, setStep] = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [privacyError, setPrivacyError] = useState("");
  const [otpError, setOtpError] = useState("");

  const [otpDigits, setOtpDigits] = useState(Array(OTP_LENGTH).fill(""));
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [sendingOtp, setSendingOtp] = useState(false);

  const [status, setStatus] = useState({ text: "", type: "" });
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  const otpRefs = useRef([]);
  const redirectTimer = useRef(null);

  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => () => clearTimeout(redirectTimer.current), []);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setTimeout(() => setResendSeconds((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (!leaveModalOpen) return undefined;
    function handleKeyDown(e) {
      if (e.key === "Escape") setLeaveModalOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [leaveModalOpen]);

  useEffect(() => {
    if (step !== 2) return undefined;
    const timer = setTimeout(() => otpRefs.current[0]?.focus(), 120);
    return () => clearTimeout(timer);
  }, [step]);

  const requestOtp = useCallback(async (targetEmail, name) => {
    setSendingOtp(true);
    setOtpError("");
    setStatus({ text: "", type: "" });
    try {
      await sendOtp({ toEmail: targetEmail, toName: name });
      setOtpDigits(Array(OTP_LENGTH).fill(""));
      setResendSeconds(RESEND_SECONDS);
      return true;
    } catch (err) {
      setStatus({
        text: err.message || "Failed to send verification code. Please try again.",
        type: "error",
      });
      return false;
    } finally {
      setSendingOtp(false);
    }
  }, []);

  async function handleDetailsSubmit(e) {
    e.preventDefault();
    setStatus({ text: "", type: "" });

    const firstError = validateName(firstName, "First name");
    const lastError = validateName(lastName, "Last name");
    const emailValidation = validateGmail(email);
    setFirstNameError(firstError);
    setLastNameError(lastError);
    setEmailError(emailValidation);
    if (firstError || lastError || emailValidation) return;

    // Skip a second code if this exact address was already verified.
    if (verifiedEmail && verifiedEmail === normalizedEmail && isEmailVerified(normalizedEmail)) {
      setStep(3);
      return;
    }

    const name = `${firstName.trim()} ${lastName.trim()}`;
    if (await requestOtp(normalizedEmail, name)) setStep(2);
  }

  function handleOtpChange(index, rawValue) {
    const digits = rawValue.replace(/\D/g, "");
    setOtpError("");

    if (!digits) {
      setOtpDigits((current) => current.map((digit, i) => (i === index ? "" : digit)));
      return;
    }

    if (digits.length > 1) {
      // Pasted code: fill the boxes from the first one.
      const next = Array(OTP_LENGTH).fill("");
      for (let i = 0; i < OTP_LENGTH && i < digits.length; i += 1) next[i] = digits[i];
      setOtpDigits(next);
      otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    setOtpDigits((current) => current.map((digit, i) => (i === index ? digits : digit)));
    if (index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if ((e.key === "Backspace" && !otpDigits[index] && index > 0) || (e.key === "ArrowLeft" && index > 0)) {
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpSubmit(e) {
    e.preventDefault();
    setOtpError("");

    const result = verifyOtp(normalizedEmail, otpDigits.join(""));
    if (!result.ok) {
      setOtpError(result.error);
      return;
    }

    setVerifiedEmail(normalizedEmail);
    setOtpDigits(Array(OTP_LENGTH).fill(""));
    setStep(3);
  }

  async function handleResend() {
    if (resendSeconds > 0 || sendingOtp) return;
    await requestOtp(normalizedEmail, `${firstName.trim()} ${lastName.trim()}`);
  }

  function handleEmailChange(e) {
    const value = e.target.value;
    setEmail(value);
    if (emailError) setEmailError("");
    // Editing the address invalidates any verification done for the old one.
    if (verifiedEmail && value.trim().toLowerCase() !== verifiedEmail) {
      clearOtpState(verifiedEmail);
      setVerifiedEmail("");
    }
  }

  async function handleCreateAccount(e) {
    e.preventDefault();
    setSubmitAttempted(true);
    setStatus({ text: "", type: "" });

    const firstError = validateName(firstName, "First name");
    const lastError = validateName(lastName, "Last name");
    const emailValidation = validateGmail(email);
    if (firstError || lastError || emailValidation) {
      setFirstNameError(firstError);
      setLastNameError(lastError);
      setEmailError(emailValidation);
      setStep(1);
      return;
    }

    if (verifiedEmail !== normalizedEmail || !isEmailVerified(normalizedEmail)) {
      setStep(2);
      setOtpError("Please verify your Gmail address with the 6-digit code first.");
      return;
    }

    const passwordValidation = validatePassword(password);
    let confirmValidation = "";
    if (!confirmPassword.trim()) confirmValidation = "Please confirm your password.";
    else if (confirmPassword !== password) {
      confirmValidation = "Passwords do not match. Please re-enter the same password.";
    }
    const privacyValidation = agreedToPrivacy
      ? ""
      : "You must agree to the Data Privacy Policy to create an account.";

    setPasswordError(passwordValidation);
    setConfirmPasswordError(confirmValidation);
    setPrivacyError(privacyValidation);
    if (passwordValidation || confirmValidation || privacyValidation) return;

    setSubmitting(true);
    try {
      const userCredential = await signupUser(normalizedEmail, password);

      // New accounts default to "customer" — an admin can change the role later.
      await createUserProfile(userCredential.user.uid, {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: normalizedEmail,
        role: "customer",
        emailOtpVerified: true,
        agreedToPrivacyPolicy: true,
        agreedToPrivacyPolicyAt: new Date().toISOString(),
      });

      clearOtpState(normalizedEmail);
      setCreated(true);
      setStatus({
        text: "Account created successfully! Redirecting to your dashboard...",
        type: "success",
      });
      redirectTimer.current = setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setStatus({ text: friendlyAuthError(err.code), type: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleSignup() {
    setStatus({ text: "", type: "" });
    setGoogleLoading(true);

    try {
      const userCredential = await signInWithGoogle();
      const existingProfile = await getUserProfile(userCredential.user.uid);

      // First-time Google users finish their profile (name, phone, privacy consent) first.
      navigate(existingProfile ? getRedirectPath(existingProfile.role) : "/complete-registration");
    } catch (err) {
      setStatus({ text: friendlyAuthError(err.code), type: "error" });
    } finally {
      setGoogleLoading(false);
    }
  }

  const busy = sendingOtp || googleLoading;

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

          <div className="reg-stepper" aria-label={`Step ${step} of 3: ${STEP_TITLES[step - 1]}`}>
            {[1, 2, 3].map((number) => (
              <span
                key={number}
                className={`reg-stepper__bar${number === step ? " reg-stepper__bar--active" : number < step ? " reg-stepper__bar--done" : ""}`}
              />
            ))}
          </div>

          <ThemeToggle theme={theme} onToggle={toggleTheme} className="reg-theme-btn" iconSize={15} />
        </header>

        <div className="reg-brand-row">
          <img src="/logo.png" alt="Perez Printing Shop logo" className="reg-brand-row__logo" />
          <div className="reg-brand-row__meta">
            <span className="reg-brand-row__shop">
              <strong>PEREZ</strong> Printing Shop
            </span>
            <span className="reg-brand-row__step-tag">
              Step {step} of 3 · {STEP_TITLES[step - 1]}
            </span>
          </div>
        </div>

        {step === 1 && (
          <form onSubmit={handleDetailsSubmit} noValidate className="reg-form">
            <h1 className="reg-step-title">Account Information</h1>
            <p className="reg-step-subtitle">
              Enter your name and Gmail address to receive your 6-digit verification code.
            </p>

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
              <label className="reg-label" htmlFor="signupEmail">
                Gmail / Email Address <span className="reg-req">*</span>
              </label>
              <div className={`reg-input-wrap${emailError ? " reg-input-wrap--error" : ""}`}>
                <span className="reg-input-icon" aria-hidden="true">
                  <svg {...iconProps}>
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="m3 7 9 6 9-6" />
                  </svg>
                </span>
                <input
                  id="signupEmail"
                  type="email"
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  aria-invalid={Boolean(emailError)}
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>
              {emailError ? (
                <div className="reg-error" role="alert">{emailError}</div>
              ) : (
                <div className="reg-helper">
                  We'll send a 6-digit OTP code to this email address to verify it's yours.
                </div>
              )}
            </div>

            <div className="reg-field">
              <label htmlFor="regPhone" className="reg-label">
                Mobile Number <span style={{ fontWeight: 500, opacity: 0.7 }}>(optional)</span>
              </label>
              <div className="reg-input-wrap">
                <input
                  id="regPhone"
                  type="tel"
                  className="reg-input"
                  placeholder="e.g. 0917 123 4567"
                  autoComplete="tel"
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {status.text && (
              <div className={`reg-status reg-status--${status.type}`} role="status">{status.text}</div>
            )}

            <div className="reg-divider">
              <span>or continue faster with</span>
            </div>

            <button type="button" className="reg-google-btn" onClick={handleGoogleSignup} disabled={busy}>
              <GoogleIcon />
              {googleLoading ? "Connecting to Google..." : "Sign up with Google"}
            </button>

            <div className="reg-actions-bar">
              <button type="button" className="reg-text-link" onClick={() => setLeaveModalOpen(true)}>
                Already have an account? <strong>Sign in</strong>
              </button>
              <button type="submit" className="reg-btn reg-btn--primary" disabled={busy}>
                {sendingOtp && <span className="reg-spinner" aria-hidden="true" />}
                {sendingOtp ? "Sending OTP..." : "Send OTP & Next"}
                {!sendingOtp && <span aria-hidden="true">→</span>}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleOtpSubmit} noValidate className="reg-form">
            <h1 className="reg-step-title">Verify Your Email</h1>
            <p className="reg-step-subtitle">
              Enter the 6-digit verification code we sent to{" "}
              <strong className="reg-email-highlight">{normalizedEmail}</strong>.
            </p>

            <div className="reg-otp-row" role="group" aria-label="6-digit verification code">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(node) => { otpRefs.current[index] = node; }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={OTP_LENGTH}
                  className={`reg-otp-box${otpError ? " reg-otp-box--error" : ""}`}
                  value={digit}
                  aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(index, e)}
                />
              ))}
            </div>
            {otpError && <div className="reg-error reg-error--center">{otpError}</div>}

            <div className="reg-otp-meta">
              <span>Didn't receive the code?</span>
              <button
                type="button"
                className="reg-resend-btn"
                onClick={handleResend}
                disabled={resendSeconds > 0 || sendingOtp}
              >
                {sendingOtp ? "Sending..." : resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
              </button>
            </div>

            <div className="reg-callout">
              Check your Gmail inbox (and Spam/Junk folder) for your 6-digit verification code. Each
              code can only be used once and expires in 5 minutes.
            </div>

            {status.text && (
              <div className={`reg-status reg-status--${status.type}`} role="status">{status.text}</div>
            )}

            <div className="reg-actions-bar">
              <button
                type="button"
                className="reg-btn reg-btn--secondary"
                onClick={() => {
                  setOtpError("");
                  setStep(1);
                }}
              >
                <span aria-hidden="true">←</span> Change Email
              </button>
              <button type="submit" className="reg-btn reg-btn--primary">
                Verify &amp; Continue <span aria-hidden="true">→</span>
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleCreateAccount} noValidate className="reg-form">
            <h1 className="reg-step-title">Set Your Password</h1>
            <p className="reg-step-subtitle">
              Your email is verified. Choose a strong password to finish creating your account.
            </p>

            <div className="reg-verified-pill">
              <span className="reg-verified-pill__check" aria-hidden="true">✓</span>
              <span><strong>{normalizedEmail}</strong> verified</span>
            </div>

            <div className="reg-field">
              <label className="reg-label" htmlFor="signupPassword">
                Password <span className="reg-req">*</span>
              </label>
              <div className={`reg-input-wrap reg-input-wrap--password${passwordError ? " reg-input-wrap--error" : ""}`}>
                <span className="reg-input-icon" aria-hidden="true">
                  <svg {...iconProps}>
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                  </svg>
                </span>
                <input
                  id="signupPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(passwordError)}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                />
                <button
                  type="button"
                  className="reg-toggle-vis"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon hidden={!showPassword} />
                </button>
              </div>
              {passwordError && <div className="reg-error" role="alert">{passwordError}</div>}
              <ul className="reg-pw-rules" aria-label="Password requirements">
                {passwordRules.map((rule) => {
                  const met = rule.test(password);
                  return (
                    <li key={rule.key} className={met ? "is-met" : submitAttempted ? "is-unmet" : ""}>
                      <span className="reg-pw-rules__dot" aria-hidden="true">
                        {met ? "✓" : submitAttempted ? "✕" : "•"}
                      </span>
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="reg-field">
              <label className="reg-label" htmlFor="signupConfirmPassword">
                Confirm Password <span className="reg-req">*</span>
              </label>
              <div className={`reg-input-wrap reg-input-wrap--password${confirmPasswordError ? " reg-input-wrap--error" : ""}`}>
                <span className="reg-input-icon" aria-hidden="true">
                  <svg {...iconProps}>
                    <rect x="4" y="10" width="16" height="11" rx="2" />
                    <path d="M8 10V7a4 4 0 1 1 8 0v3" />
                  </svg>
                </span>
                <input
                  id="signupConfirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(confirmPasswordError)}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (confirmPasswordError) setConfirmPasswordError("");
                  }}
                />
                <button
                  type="button"
                  className="reg-toggle-vis"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  <EyeIcon hidden={!showConfirmPassword} />
                </button>
              </div>
              {confirmPasswordError && <div className="reg-error" role="alert">{confirmPasswordError}</div>}
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
              <button
                type="button"
                className="reg-btn reg-btn--secondary"
                onClick={() => setStep(1)}
                disabled={submitting || created}
              >
                <span aria-hidden="true">←</span> Edit Info
              </button>
              <button type="submit" className="reg-btn reg-btn--primary" disabled={submitting || created}>
                {submitting && <span className="reg-spinner" aria-hidden="true" />}
                {created ? "Account Created ✓" : submitting ? "Creating account..." : "Create Account"}
              </button>
            </div>
          </form>
        )}
      </main>

      {leaveModalOpen && (
        <div
          className="reg-modal-overlay"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLeaveModalOpen(false);
          }}
        >
          <div className="reg-modal" role="dialog" aria-modal="true" aria-labelledby="reg-back-modal-title">
            <h2 id="reg-back-modal-title" className="reg-modal__title">Return to Sign In?</h2>
            <p className="reg-modal__subtitle">
              Are you sure you want to leave registration and go back to the sign-in page? Any details
              you entered will not be saved.
            </p>
            <div className="reg-callout reg-callout--modal">
              You can come back anytime to create your Perez Printing Shop account and start placing
              print orders online.
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
