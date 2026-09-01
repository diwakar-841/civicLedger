import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute, AdminRoute } from "./components/auth/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { RegisterCompletePage } from "./pages/RegisterCompletePage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { VerifyEmailPage } from "./pages/VerifyEmailPage";
import { KycWizardPage } from "./pages/auth/KycWizardPage";
import { BiometricSetupPage } from "./pages/auth/BiometricSetupPage";
import { PinSetupPage } from "./pages/auth/PinSetupPage";
import { HomePage } from "./pages/HomePage";
import { ElectionListPage } from "./pages/ElectionListPage";
import { MyElectionsPage } from "./pages/MyElectionsPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { BallotPage } from "./pages/BallotPage";
import { ConfirmationPage } from "./pages/ConfirmationPage";
import { ResultsPage } from "./pages/ResultsPage";
import { SecuritySettingsPage } from "./pages/settings/SecuritySettingsPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { CreateElectionPage } from "./pages/admin/CreateElectionPage";
import { ManageCandidatesPage } from "./pages/admin/ManageCandidatesPage";
import { AdminAnalyticsPage } from "./pages/admin/AdminAnalyticsPage";
import { AuditLogPage } from "./pages/admin/AuditLogPage";
import { AdminRequire2FAPage } from "./pages/admin/AdminRequire2FAPage";
import { ElectionStatusPage } from "./pages/admin/ElectionStatusPage";
import { ProfilePage } from "./pages/ProfilePage";
import { CandidateProfileCompletionPage } from "./pages/CandidateProfileCompletionPage";
import { RequestsPage } from "./pages/RequestsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { GroupsPage } from "./pages/GroupsPage";
import { CreateGroupPage } from "./pages/admin/CreateGroupPage";
import { AdminGroupDetailPage } from "./pages/admin/AdminGroupDetailPage";
import { AdminGroupMembersPage } from "./pages/admin/AdminGroupMembersPage";
import { AdminGroupsPage } from "./pages/admin/AdminGroupsPage";
import { AdminElectionsPage } from "./pages/admin/AdminElectionsPage";
import { NotFoundPage } from "./pages/NotFoundPage";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function RootRedirect() {
  const { isAuthenticated, isAdmin, isLoading } = useAuthContext();
  if (isLoading) {return null;}
  if (!isAuthenticated) {return _jsxDEV(Navigate, { to: "/login", replace: true }, void 0, false);}
  return _jsxDEV(Navigate, { to: isAdmin ? "/admin" : "/home", replace: true }, void 0, false);
}

export default function App() {
  return (
    _jsxDEV(ThemeProvider, {
 children:
      _jsxDEV(AuthProvider, {
 children:
        _jsxDEV(ToastProvider, {
 children:
          _jsxDEV(BrowserRouter, {
 children:
            _jsxDEV(Routes, {
 children: [
              _jsxDEV(Route, { path: "/", element: _jsxDEV(RootRedirect, {}, void 0, false) }, void 0, false),

              _jsxDEV(Route, { path: "/login", element: _jsxDEV(LoginPage, {}, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/register", element: _jsxDEV(RegisterPage, {}, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/register/complete", element: _jsxDEV(RegisterCompletePage, {}, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/forgot-password", element: _jsxDEV(ForgotPasswordPage, {}, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/reset-password/:token", element: _jsxDEV(ResetPasswordPage, {}, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/verify-email/:token", element: _jsxDEV(VerifyEmailPage, {}, void 0, false) }, void 0, false),

              _jsxDEV(Route, { path: "/kyc", element: _jsxDEV(KycWizardPage, {}, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/biometric-setup", element: _jsxDEV(BiometricSetupPage, {}, void 0, false) }, void 0, false),

              _jsxDEV(Route, { path: "/pin-setup", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(PinSetupPage, {}, void 0, false) }, void 0, false) }, void 0, false),

              _jsxDEV(Route, { path: "/home", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(HomePage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/elections", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(ElectionListPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/elections/:id", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(BallotPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/elections/:id/confirmation", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(ConfirmationPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/elections/:id/results", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(ResultsPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/my-elections", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(MyElectionsPage, {}, void 0, false) }, void 0, false) }, void 0, false),

              _jsxDEV(Route, { path: "/settings/security", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(SecuritySettingsPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/profile", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(ProfilePage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/requests", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(RequestsPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/notifications", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(NotificationsPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/groups", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(GroupsPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/groups/:id", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(GroupDetailPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, {
                path: "/candidate-profile/:requestId",
                element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(CandidateProfileCompletionPage, {}, void 0, false) }, void 0, false) 
}, void 0, false
              ),

              _jsxDEV(Route, { path: "/admin/require-2fa", element: _jsxDEV(ProtectedRoute, { children: _jsxDEV(AdminRequire2FAPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin", element: _jsxDEV(AdminRoute, { children: _jsxDEV(AdminDashboardPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin/groups", element: _jsxDEV(AdminRoute, { children: _jsxDEV(AdminGroupsPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin/elections", element: _jsxDEV(AdminRoute, { children: _jsxDEV(AdminElectionsPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin/elections/new", element: _jsxDEV(AdminRoute, { children: _jsxDEV(CreateElectionPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin/groups/new", element: _jsxDEV(AdminRoute, { children: _jsxDEV(CreateGroupPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin/groups/:id", element: _jsxDEV(AdminRoute, { children: _jsxDEV(AdminGroupDetailPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin/groups/:id/members", element: _jsxDEV(AdminRoute, { children: _jsxDEV(AdminGroupMembersPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin/elections/:id/status", element: _jsxDEV(AdminRoute, { children: _jsxDEV(ElectionStatusPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin/elections/:id/candidates", element: _jsxDEV(AdminRoute, { children: _jsxDEV(ManageCandidatesPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin/elections/:id/analytics", element: _jsxDEV(AdminRoute, { children: _jsxDEV(AdminAnalyticsPage, {}, void 0, false) }, void 0, false) }, void 0, false),
              _jsxDEV(Route, { path: "/admin/audit-log", element: _jsxDEV(AdminRoute, { children: _jsxDEV(AuditLogPage, {}, void 0, false) }, void 0, false) }, void 0, false),

              _jsxDEV(Route, { path: "*", element: _jsxDEV(NotFoundPage, {}, void 0, false) }, void 0, false)] 
}, void 0, true
            ) 
}, void 0, false
          ) 
}, void 0, false
        ) 
}, void 0, false
      ) 
}, void 0, false
    ));

}