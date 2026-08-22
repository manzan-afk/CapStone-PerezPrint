// authService.jsx
// Simple auth service layer — keeps Login.jsx from talking to a backend
// directly. Right now everything here is SIMULATED (no real requests),
// so this file is the only place you'll need to touch once Firebase
// (or any other backend) is ready to be connected.
 
const FAKE_DELAY_MS = 600;
 
/**
 * Attempts to log a user in.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ email: string }>} resolves with the "logged in" user
 */
export function loginUser(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // TODO: replace with real Firebase call, e.g.
      // signInWithEmailAndPassword(auth, email, password)
      if (!email || !password) {
        reject({ code: "auth/invalid-credential" });
        return;
      }
      resolve({ email });
    }, FAKE_DELAY_MS);
  });
}
 
/**
 * Attempts to create a new account.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ email: string }>} resolves with the "created" user
 */
export function signupUser(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // TODO: replace with real Firebase call, e.g.
      // createUserWithEmailAndPassword(auth, email, password)
      if (!email || !password) {
        reject({ code: "auth/invalid-credential" });
        return;
      }
      resolve({ email });
    }, FAKE_DELAY_MS);
  });
}
 
/**
 * Sends a password reset email.
 * @param {string} email
 * @returns {Promise<void>}
 */
export function resetPassword(email) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // TODO: replace with real Firebase call, e.g.
      // sendPasswordResetEmail(auth, email)
      if (!email) {
        reject({ code: "auth/invalid-email" });
        return;
      }
      resolve();
    }, FAKE_DELAY_MS);
  });
}
 
/**
 * Maps an error's code to a user-friendly message.
 * Works with both simulated errors above and real Firebase error codes,
 * so Login.jsx doesn't need to change when the backend is connected.
 * @param {string} code
 * @returns {string}
 */
export function friendlyAuthError(code) {
  switch (code) {
    case "auth/invalid-email":
      return "That email address looks invalid.";
    case "auth/user-not-found":
      return "No account found with that email.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";
    case "auth/email-already-in-use":
      return "An account with that email already exists.";
    case "auth/weak-password":
      return "Password is too weak — use at least 6 characters.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again later.";
    case "auth/network-request-failed":
      return "Network error. Check your connection.";
    default:
      return "Something went wrong. Please try again.";
  }
}