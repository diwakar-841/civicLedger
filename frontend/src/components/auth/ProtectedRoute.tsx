import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "../../contexts/AuthContext";
import { Spinner } from "../shared/Spinner";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

export function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {return _jsxDEV(Spinner, { label: "Checking your session" }, void 0, false);}
  if (!isAuthenticated) {return _jsxDEV(Navigate, { to: "/login", replace: true }, void 0, false);}
  return _jsxDEV(_Fragment, { children: children }, void 0, false);
}

export function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, isLoading, user } = useAuthContext();
  const location = useLocation();

  if (isLoading) {return _jsxDEV(Spinner, { label: "Checking your session" }, void 0, false);}
  if (!isAuthenticated) {return _jsxDEV(Navigate, { to: "/login", replace: true }, void 0, false);}
  if (!isAdmin) {return _jsxDEV(Navigate, { to: "/home", replace: true }, void 0, false);}

  if (user && !user.isTwoFactorEnabled) {
    return _jsxDEV(Navigate, { to: "/admin/require-2fa", state: { from: location.pathname }, replace: true }, void 0, false);
  }

  return _jsxDEV(_Fragment, { children: children }, void 0, false);
}