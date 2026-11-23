// Email OTP verification for sign-up. Codes are sent through EmailJS and kept in
// memory only: they expire after 5 minutes, work once, and allow 5 wrong attempts.
const EMAILJS_URL = "https://api.emailjs.com/api/v1.0/email/send";
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_se4xr2g";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_earnwnw";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "pGaTsmtTPUdBBRm1a";

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const GMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i;

const pendingCodes = new Map();
const verifiedEmails = new Set();

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function generateCode() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    return String(100000 + (values[0] % 900000));
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function isValidGmail(email) {
  const normalized = normalizeEmail(email);
  return Boolean(normalized) && GMAIL_PATTERN.test(normalized);
}

export async function sendOtp({ toEmail, toName }) {
  const email = normalizeEmail(toEmail);
  if (!isValidGmail(email)) {
    throw new Error("Please enter a valid Gmail address (e.g., example@gmail.com).");
  }

  const code = generateCode();
  const expiresAt = Date.now() + OTP_TTL_MS;
  const name = (toName || "").trim();

  const response = await fetch(EMAILJS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE_ID,
      template_id: EMAILJS_TEMPLATE_ID,
      user_id: EMAILJS_PUBLIC_KEY,
      template_params: {
        to_email: email,
        email,
        user_email: email,
        to_name: name || "Customer",
        name: name || "Perez Printing Shop",
        title: "Your Perez Printing Shop Verification Code",
        otp_code: code,
        passcode: code,
        message: `Your Perez Printing Shop verification code is: ${code}. This code expires in 5 minutes and can only be used once.`,
        app_name: "Perez Printing Shop",
        expiry_minutes: "5",
        time: "5 minutes",
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(
      detail
        ? `Failed to send verification email (${detail}). Please try again.`
        : "Failed to send verification email. Please try again."
    );
  }

  verifiedEmails.delete(email);
  pendingCodes.set(email, { code, expiresAt, used: false, attempts: 0 });
  return { email, expiresAt };
}

export function verifyOtp(email, input) {
  const normalized = normalizeEmail(email);
  const entered = String(input || "").trim();

  if (!/^\d{6}$/.test(entered)) {
    return { ok: false, error: "Please enter all 6 digits of your verification code." };
  }

  const entry = pendingCodes.get(normalized);
  if (!entry) {
    return { ok: false, error: "No active verification code found. Please request a new code." };
  }
  if (entry.used) {
    return { ok: false, error: "This verification code has already been used. Please request a new code." };
  }
  if (Date.now() > entry.expiresAt) {
    pendingCodes.delete(normalized);
    return { ok: false, error: "This verification code has expired (5-minute limit). Please click Resend code." };
  }

  if (entered === entry.code) {
    pendingCodes.delete(normalized);
    verifiedEmails.add(normalized);
    return { ok: true };
  }

  entry.attempts += 1;
  if (entry.attempts >= MAX_ATTEMPTS) {
    pendingCodes.delete(normalized);
    return { ok: false, error: "Too many incorrect attempts. Please click Resend code for a new one." };
  }
  return { ok: false, error: "Incorrect verification code. Please check your Gmail and try again." };
}

export function isEmailVerified(email) {
  return verifiedEmails.has(normalizeEmail(email));
}

export function clearOtpState(email) {
  const normalized = normalizeEmail(email);
  pendingCodes.delete(normalized);
  verifiedEmails.delete(normalized);
}
