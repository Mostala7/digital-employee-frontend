import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // If there is no current user logged in, redirect to the login page
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // If user is logged in but has no business associated, force them to onboarding (Settings Page)
  if (!currentUser.businessId && location.pathname !== "/settings") {
    return <Navigate to="/settings?onboarding=true" replace />;
  }

  // Otherwise, render the protected component
  return children;
};

export default ProtectedRoute;
