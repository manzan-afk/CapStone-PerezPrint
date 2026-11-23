import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  loginUser,
  resetPassword,
  signInWithGoogle,
  friendlyAuthError,
} from "../services/authService";
import { getUserProfile } from "../services/userServices";
import { useAuth } from "../context/AuthContext";
import useTheme from "../hooks/useTheme";
import ThemeToggle from "../components/ThemeToggle";
import AuthLoader from "../components/AuthLoader";
import "./Login.css";
import "./Landing.css";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEACTIVATED_MESSAGE = "Your account has been deactivated. Please contact the administrator.";

// Sends the user to the right dashboard based on their role.
function getRedirectPath(role) {
  if (role === "admin") return "/admin";
  if (role === "staff") return "/staff";
  return "/dashboard"; // default: customer
}

const iconProps = {
  viewBox: "0 0 24 24",
  width: "22",
  height: "22",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const FEATURES = [
  {
    title: "Transparent Service Pricing",
    description:
      "Browse printing services, varieties, sizes, and exact peso rates upfront so you always know your total before submitting.",
    accent: "orange",
    icon: (
      <svg {...iconProps}>
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
        <circle cx="7.5" cy="7.5" r="1.5" />
      </svg>
    ),
  },
  {
    title: "Fast GCash Verification",
    description:
      "Pay securely via our GCash number or QR code and upload your receipt screenshot. Printing begins as soon as staff verifies it.",
    accent: "teal",
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </svg>
    ),
  },
  {
    title: "Live Tracking & Direct Chat",
    description:
      "Monitor every order from Placed to Printing to Ready for Pickup in real time, and message our staff directly with file attachments.",
    accent: "orange",
    icon: (
      <svg {...iconProps}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
];

const STEPS = [
  {
    number: "01",
    title: "Browse Services & Place Order",
    description:
      "Sign in with email or Google, pick your printing service, size, and quantity, upload your design files, and submit your order to get a reference ID.",
    accent: "orange",
    icon: (
      <svg {...iconProps}>
        <path d="M6 9V3h12v6" />
        <rect x="3" y="9" width="18" height="8" rx="2" />
        <path d="M6 14h12v7H6z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Pay via GCash & Upload Proof",
    description:
      "Send the exact order amount using our GCash number or QR code, then submit your GCash reference number and receipt screenshot for staff verification.",
    accent: "teal",
    icon: (
      <svg {...iconProps}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
        <path d="M6 15h4" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Verified Printing & Live Updates",
    description:
      "Printing starts as soon as your payment is verified. Track live order status (Placed → Printing → Ready) and message our staff directly anytime.",
    accent: "orange",
    icon: (
      <svg {...iconProps}>
        <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.7 21a2 2 0 0 1-3.4 0" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Pick Up & Receive Receipt",
    description:
      "Once your order is marked Ready for Pickup in your dashboard and notifications, visit the shop to claim your prints and get your official receipt.",
    accent: "teal",
    icon: (
      <svg {...iconProps}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <path d="m9 11 3 3L22 4" />
      </svg>
    ),
  },
];

const TICKET_STEPS = [
  { label: "Order Placed", detail: "Files uploaded & reference ID issued", state: "done" },
  { label: "GCash Verified", detail: "Payment confirmed by shop staff", state: "done" },
  { label: "Now Printing", detail: "High-quality production in progress", state: "active" },
  { label: "Ready for Pickup", detail: "Claim at Perez Printing Shop", state: "upcoming" },
];

const TICKET_STATUS = { done: "Done", active: "In Progress", upcoming: "Next" };

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon({ size = 18 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [theme, toggleTheme] = useTheme();
  const emailInputRef = useRef(null);

  const [scrolled, setScrolled] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [status, setStatus] = useState({ text: "", type: "" });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSending, setResetSending] = useState(false);
  const [resetSentTo, setResetSentTo] = useState("");

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 12);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fade sections in as they scroll into view.
  useEffect(() => {
    const targets = document.querySelectorAll("[data-reveal]");
    if (!targets.length) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      targets.forEach((target) => target.classList.add("is-visible"));
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px 0px" }
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!signInOpen && !resetOpen) return undefined;
    function handleKeyDown(e) {
      if (e.key !== "Escape") return;
      if (resetOpen) setResetOpen(false);
      else setSignInOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [signInOpen, resetOpen]);

  useEffect(() => {
    if (!signInOpen) return undefined;
    const timer = setTimeout(() => emailInputRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, [signInOpen]);

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openSignIn() {
    setResetOpen(false);
    setStatus({ text: "", type: "" });
    setSignInOpen(true);
  }

  function openReset(e) {
    e.preventDefault();
    setSignInOpen(false);
    setResetEmail(email.trim());
    setResetError("");
    setResetSentTo("");
    setResetOpen(true);
  }

  function closeReset() {
    setResetOpen(false);
    setResetError("");
  }

  function backToSignIn() {
    setResetOpen(false);
    setResetError("");
    setSignInOpen(true);
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    setResetError("");

    const trimmed = resetEmail.trim();
    if (!trimmed) {
      setResetError("Please enter your email address.");
      return;
    }
    if (!EMAIL_PATTERN.test(trimmed)) {
      setResetError("Enter a valid email address.");
      return;
    }

    setResetSending(true);
    try {
      await resetPassword(trimmed);
      setResetSentTo(trimmed);
    } catch (err) {
      setResetError(friendlyAuthError(err.code));
    } finally {
      setResetSending(false);
    }
  }

  // Signs a deactivated account straight back out instead of letting it in.
  async function rejectIfDeactivated(profile) {
    if (!profile?.disabled) return false;
    await logout();
    setStatus({ text: DEACTIVATED_MESSAGE, type: "error" });
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setPrivacyError("");
    setStatus({ text: "", type: "" });

    let valid = true;
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setEmailError("Email is required.");
      valid = false;
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
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

    if (!agreedToPrivacy) {
      setPrivacyError("You must agree to the Data Privacy Policy to sign in.");
      valid = false;
    }

    if (!valid) return;

    setLoading(true);
    try {
      const userCredential = await loginUser(trimmedEmail, password);
      const profile = await getUserProfile(userCredential.user.uid);

      if (await rejectIfDeactivated(profile)) return;

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
    setPrivacyError("");

    if (!agreedToPrivacy) {
      setPrivacyError("You must agree to the Data Privacy Policy to sign in.");
      return;
    }

    setGoogleLoading(true);
    try {
      const userCredential = await signInWithGoogle();
      const profile = await getUserProfile(userCredential.user.uid);

      if (await rejectIfDeactivated(profile)) return;

      navigate(profile ? getRedirectPath(profile.role) : "/complete-registration");
    } catch (err) {
      setStatus({ text: friendlyAuthError(err.code), type: "error" });
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="login-page login-page--landing" data-theme={theme}>
      <header className={`landing-nav${scrolled ? " landing-nav--scrolled" : ""}`}>
        <div className="landing-nav__inner">
          <a
            href="#home"
            className="landing-nav__brand"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("home");
            }}
          >
            <img src="/logo.png" alt="Perez Printing Shop logo" className="landing-nav__logo" />
            <span className="landing-nav__brand-text">
              <strong className="landing-nav__title">PEREZ</strong>
              <span className="landing-nav__subtitle">Printing Shop</span>
            </span>
          </a>

          <nav className="landing-nav__links" aria-label="Landing navigation">
            <button type="button" className="landing-nav__link" onClick={() => scrollToSection("features")}>
              Features
            </button>
            <button type="button" className="landing-nav__link" onClick={() => scrollToSection("how-it-works")}>
              How It Works
            </button>
            <button type="button" className="landing-nav__link landing-nav__link--signin" onClick={openSignIn}>
              Sign In
            </button>
            <Link to="/create-account" className="landing-nav__link landing-nav__link--cta">
              Create Account
            </Link>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </nav>
        </div>
      </header>

      <section id="home" className="landing-hero">
        <div className="landing-hero__inner">
          <div className="landing-hero__copy">
            <p className="hero-kicker anim-fade-up" style={{ "--delay": "0.03s" }}>
              <span className="hero-kicker__bar" aria-hidden="true" />
              Perez Printing Shop
            </p>
            <h1 className="landing-hero__title anim-fade-up" style={{ "--delay": "0.10s" }}>
              Print orders made simple, <span className="hero-accent">ready when you are.</span>
            </h1>
            <p className="landing-hero__lead anim-fade-up" style={{ "--delay": "0.17s" }}>
              Choose your print service, see exact prices upfront, upload your files, pay through GCash, and
              pick up your order at the shop once it is ready — no waiting in line.
            </p>
            <div className="landing-hero__actions anim-fade-up" style={{ "--delay": "0.24s" }}>
              <button type="button" className="hero-btn hero-btn--primary" onClick={openSignIn}>
                Sign In
              </button>
              <Link to="/create-account" className="hero-btn hero-btn--secondary">
                Create Account
              </Link>
              <button type="button" className="hero-btn hero-btn--ghost" onClick={() => scrollToSection("how-it-works")}>
                How it works ↓
              </button>
            </div>
          </div>

          <div className="landing-hero__visual anim-fade-up" style={{ "--delay": "0.20s" }}>
            <div className="job-ticket">
              <div className="job-ticket__top">
                <div>
                  <span className="job-ticket__eyebrow">Sample Job Ticket</span>
                  <h2 className="job-ticket__title">Tarpaulin &amp; Flyer Print</h2>
                </div>
                <span className="job-ticket__ref">#PRZ-0148</span>
              </div>
              <ol className="job-ticket__steps">
                {TICKET_STEPS.map((item, index) => (
                  <li key={item.label} className={`ticket-step ticket-step--${item.state}`}>
                    <span className="ticket-step__num">0{index + 1}</span>
                    <div className="ticket-step__body">
                      <strong>{item.label}</strong>
                      <span>{item.detail}</span>
                    </div>
                    <span className="ticket-step__status">{TICKET_STATUS[item.state]}</span>
                  </li>
                ))}
              </ol>
              <div className="job-ticket__footer">
                <span>Need layout help? Chat with our staff inside your account.</span>
                <button type="button" className="job-ticket__link" onClick={openSignIn}>
                  Sign in →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="landing-features" aria-labelledby="features-heading">
        <div className="landing-section__inner">
          <div className="section-head" data-reveal>
            <span className="section-head__kicker">What You Can Do</span>
            <h2 id="features-heading" className="section-head__title">
              Built around how our shop actually works.
            </h2>
            <p className="section-head__subtitle">
              From checking prices to verifying GCash receipts and claiming your prints, everything happens in
              one place.
            </p>
          </div>

          <div className="features-grid">
            {FEATURES.map((feature, index) => (
              <article
                key={feature.title}
                className={`feature-card feature-card--${feature.accent}`}
                data-reveal
                style={{ "--reveal-delay": `${index * 0.08}s` }}
              >
                <span className="feature-card__icon" aria-hidden="true">{feature.icon}</span>
                <h3 className="feature-card__title">{feature.title}</h3>
                <p className="feature-card__desc">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works" aria-labelledby="how-it-works-heading">
        <div className="how-it-works__inner">
          <div className="section-head" data-reveal>
            <span className="section-head__kicker">How It Works</span>
            <h2 id="how-it-works-heading" className="section-head__title">
              Four steps from upload to pickup.
            </h2>
            <p className="section-head__subtitle">
              Place your order online, send your GCash proof of payment, follow printing progress, and collect
              your finished prints at the counter.
            </p>
          </div>

          <ol className="how-it-works__grid">
            {STEPS.map((step, index) => (
              <li
                key={step.number}
                className={`step-card step-card--${step.accent}`}
                data-reveal
                style={{ "--reveal-delay": `${index * 0.07}s` }}
              >
                <div className="step-card__top">
                  <span className="step-card__num">{step.number}</span>
                  <span className="step-card__icon" aria-hidden="true">{step.icon}</span>
                </div>
                <h3 className="step-card__title">{step.title}</h3>
                <p className="step-card__desc">{step.description}</p>
              </li>
            ))}
          </ol>

          <div className="how-it-works__cta" data-reveal style={{ "--reveal-delay": "0.12s" }}>
            <div className="how-it-works__cta-copy">
              <h3>Have a file ready to print?</h3>
              <p>Sign in to place an order or create a customer account in a minute.</p>
            </div>
            <div className="how-it-works__cta-actions">
              <button type="button" className="how-it-works__btn how-it-works__btn--primary" onClick={openSignIn}>
                Sign In
              </button>
              <Link to="/create-account" className="how-it-works__btn how-it-works__btn--secondary">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer__inner">
          <div className="landing-footer__brand">
            <img src="/logo.png" alt="" aria-hidden="true" />
            <span>
              <strong>PEREZ</strong> Printing Shop
            </span>
          </div>
          <div className="landing-footer__meta">
            <span>© {new Date().getFullYear()} Perez Printing Shop. All rights reserved.</span>
            <Link to="/privacy-policy" className="landing-footer__link">
              Data Privacy Policy
            </Link>
          </div>
        </div>
      </footer>

      {signInOpen && (
        <div
          className="reset-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSignInOpen(false);
          }}
        >
          <div className="reset-modal signin-modal" role="dialog" aria-modal="true" aria-labelledby="signin-modal-title">
            <button type="button" className="reset-modal__close" onClick={() => setSignInOpen(false)} aria-label="Close sign in dialog">
              <CloseIcon />
            </button>

            <div className="signin-modal__brand">
              <img src="/logo.png" alt="" aria-hidden="true" />
              <span>
                <strong>PEREZ</strong> Printing Shop
              </span>
            </div>
            <h2 id="signin-modal-title" className="signin-modal__title">Welcome back</h2>
            <p className="signin-modal__subtitle">Sign in to manage your print orders and account.</p>

            <form onSubmit={handleSubmit} noValidate className="login-form">
              <label className="field-label" htmlFor="loginEmail">Email address</label>
              <div className="input-group">
                <span className="input-icon" aria-hidden="true"><MailIcon /></span>
                <input
                  ref={emailInputRef}
                  id="loginEmail"
                  type="email"
                  placeholder="you@gmail.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                />
              </div>
              <div className="field-error">{emailError}</div>

              <div className="field-row">
                <label className="field-label" htmlFor="loginPassword">Password</label>
                <button type="button" onClick={openReset} className="forgot-link">
                  Forgot password?
                </button>
              </div>
              <div className="input-group input-group--password">
                <span className="input-icon" aria-hidden="true"><LockIcon /></span>
                <input
                  id="loginPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError("");
                  }}
                />
                <button
                  type="button"
                  className="toggle-visibility"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="M12 6c-5 0-9.3 3.1-11 7.5C2.7 17.9 7 21 12 21s9.3-3.1 11-7.5C21.3 9.1 17 6 12 6Zm0 12.5c-2.8 0-5-2.2-5-5s2.2-5 5-5 5 2.2 5 5-2.2 5-5 5Zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                      <path
                        fill="currentColor"
                        d="m2 4.3 1.4-1.4 18.7 18.7-1.4 1.4-3.1-3.1c-1.7.7-3.6 1.1-5.6 1.1-5 0-9.3-3.1-11-7.5.8-2 2.1-3.8 3.8-5.1L2 4.3Zm5.5 5.5 1.6 1.6c-.1.2-.1.4-.1.6 0 1.7 1.3 3 3 3 .2 0 .4 0 .6-.1l1.6 1.6c-.7.3-1.4.5-2.2.5-2.8 0-5-2.2-5-5 0-.8.2-1.5.5-2.2Zm4.4-2.8c2.8 0 5 2.2 5 5 0 .5-.1 1-.2 1.5l2.9 2.9c1.4-1.2 2.5-2.7 3.2-4.4-1.7-4.4-6-7.5-11-7.5-1.3 0-2.6.2-3.7.6l2.2 2.2c.5-.2 1-.3 1.6-.3Z"
                      />
                    </svg>
                  )}
                </button>
              </div>
              <div className="field-error">{passwordError}</div>

              <label className="privacy-check">
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
              <div className="field-error">{privacyError}</div>

              <button type="submit" disabled={loading || googleLoading || !agreedToPrivacy} className="login-btn">
                {loading && <span className="btn-spinner" aria-hidden="true" />}
                {loading ? "Signing in..." : "Sign In"}
              </button>

              {status.text && (
                <div className={`status ${status.type}`} role="status">{status.text}</div>
              )}

              <div className="divider">
                <span>or</span>
              </div>

              <button
                type="button"
                className="google-btn"
                onClick={handleGoogleLogin}
                disabled={loading || googleLoading || !agreedToPrivacy}
              >
                <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.6 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.2-.1-2.4-.4-3.5Z" />
                  <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.5 6 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7Z" />
                  <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.6C29.6 35.1 27 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.6 5.1C9.5 39.6 16.2 44 24 44Z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.6 5.6C41.9 35.9 44 30.4 44 24c0-1.2-.1-2.4-.4-3.5Z" />
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
      )}

      {resetOpen && (
        <div
          className="reset-modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReset();
          }}
        >
          <div className="reset-modal" role="dialog" aria-modal="true" aria-labelledby="reset-modal-title">
            <button type="button" className="reset-modal__close" onClick={closeReset} aria-label="Close reset password dialog">
              <CloseIcon />
            </button>

            {resetSentTo ? (
              <div className="reset-modal__success">
                <div className="reset-modal__icon reset-modal__icon--success" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <path d="m9 11 3 3L22 4" />
                  </svg>
                </div>
                <h2 id="reset-modal-title" className="reset-modal__title">Check your inbox</h2>
                <p className="reset-modal__desc">
                  We sent a password reset link to <strong>{resetSentTo}</strong>. Open the email (check
                  Spam/Junk if needed) and follow the link to set a new password.
                </p>
                <div className="reset-modal__actions">
                  <button type="button" className="login-btn reset-modal__btn" onClick={backToSignIn}>
                    Back to Sign In
                  </button>
                  <button type="button" className="reset-modal__link-btn" onClick={() => setResetSentTo("")}>
                    Use a different email
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="reset-modal__icon" aria-hidden="true">
                  <LockIcon size={22} />
                </div>
                <h2 id="reset-modal-title" className="reset-modal__title">Reset your password</h2>
                <p className="reset-modal__desc">
                  Enter the email address linked to your account and we'll send you a secure password reset
                  link via Firebase.
                </p>
                <form onSubmit={handleResetSubmit} noValidate className="login-form">
                  <label className="field-label" htmlFor="resetEmailInput">Email address</label>
                  <div className="input-group">
                    <span className="input-icon" aria-hidden="true"><MailIcon /></span>
                    <input
                      id="resetEmailInput"
                      type="email"
                      placeholder="you@gmail.com"
                      autoComplete="email"
                      autoFocus
                      value={resetEmail}
                      onChange={(e) => {
                        setResetEmail(e.target.value);
                        if (resetError) setResetError("");
                      }}
                    />
                  </div>
                  <div className="field-error">{resetError}</div>

                  <button type="submit" className="login-btn reset-modal__btn" disabled={resetSending}>
                    {resetSending && <span className="btn-spinner" aria-hidden="true" />}
                    {resetSending ? "Sending reset link..." : "Send Reset Link"}
                  </button>
                  <button type="button" className="reset-modal__link-btn" onClick={backToSignIn} style={{ marginTop: 10 }}>
                    ← Back to Sign In
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      <AuthLoader
        visible={loading || googleLoading}
        message={googleLoading ? "Signing in with Google..." : "Signing you in..."}
      />
    </div>
  );
}
