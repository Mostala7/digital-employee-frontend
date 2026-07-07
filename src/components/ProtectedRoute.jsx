import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // If there is no current user logged in, redirect to the login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin = currentUser.role === "Admin";

  // System Admins manage the whole platform, not a single business -- keep them
  // in the /admin/* section and out of the regular per-business dashboard routes.
  if (isAdmin && !adminOnly) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (!isAdmin && adminOnly) {
    return <Navigate to="/dashboard" replace />;
  }

  // Admins aren't tied to a business, so the checks below don't apply to them.
  if (isAdmin) {
    return children;
  }

  // Check if user is a Human Agent
  const isHumanAgent = (() => {
    const r = String(currentUser.role || "").toLowerCase().replace(/[-_]/g, " ").trim();
    return r === "human agent" || r === "agent" || r === "human" || r.includes("human agent");
  })();

  // If user is a Human Agent, block access to Dashboard, Agent, and Settings
  if (isHumanAgent && (
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/agent") ||
    location.pathname.startsWith("/settings") ||
    location.pathname === "/"
  )) {
    return <Navigate to="/tickets" replace />;
  }

  // If user is logged in but has no business associated, force them to onboarding (Settings Page), unless they are a Human Agent
  if (!currentUser.businessId && location.pathname !== "/settings" && !isHumanAgent) {
    return <Navigate to="/settings?onboarding=true" replace />;
  }

  // Otherwise, render the protected component
  return children;
};

export default ProtectedRoute;

