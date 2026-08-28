import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { Spinner } from "../shared/Spinner";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) return <Spinner label="Checking your session" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuthContext();
  const location = useLocation();

  if (isLoading) return <Spinner label="Checking your session" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;

  // Admin must have 2FA enabled to access admin pages
  if (user && !user.isTwoFactorEnabled) {
    return <Navigate to="/admin/require-2fa" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}
