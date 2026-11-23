import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import AuthLoader from "./components/AuthLoader";

/**
 * Wraps a route so it requires login, and optionally a specific role.
 * Deactivated accounts are signed out and sent back to the sign-in page.
 * @param {object} props
 * @param {React.ReactNode} props.children - the page to render if allowed
 * @param {string[]} [props.allowedRoles] - e.g. ["admin"]. Omit to allow any logged-in user.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, role, loading, logout } = useAuth();
  const disabled = Boolean(profile?.disabled);

  useEffect(() => {
    if (!loading && user && disabled) logout().catch(() => {});
  }, [loading, user, disabled, logout]);

  if (loading) {
    return <AuthLoader message="Loading your workspace..." />;
  }

  if (!user || disabled) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Logged in, but wrong role for this route.
    return <Navigate to="/" replace />;
  }

  return children;
}