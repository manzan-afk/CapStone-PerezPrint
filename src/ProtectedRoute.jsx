import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

/**
 * Wraps a route so it requires login, and optionally a specific role.
 * @param {object} props
 * @param {React.ReactNode} props.children - the page to render if allowed
 * @param {string[]} [props.allowedRoles] - e.g. ["admin"]. Omit to allow any logged-in user.
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, role, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    // Logged in, but wrong role for this route.
    return <Navigate to="/" replace />;
  }

  return children;
}