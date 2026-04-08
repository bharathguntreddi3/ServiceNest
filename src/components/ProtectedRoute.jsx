import { useSelector } from "react-redux";
import { Navigate, useLocation, Outlet } from "react-router-dom";

/**
 * ProtectedRoute component
 * Wraps routes that require authentication. If the user is not logged in,
 * it redirects them to the login page while preserving their intended destination.
 */
export default function ProtectedRoute({ children }) {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  if (!user) {
    // Redirect to login, passing the intended destination in the state
    return <Navigate to="/login" state={{ returnTo: location.pathname + location.search }} replace />;
  }

  // Render children if provided, otherwise render nested route components via Outlet
  return children ? children : <Outlet />;
}
