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
import { NotFoundPage } from "./pages/NotFoundPage";

// WalletProvider removed — wallets are now managed server-side.
// No external wallet app (OKX, MetaMask) is needed.

function RootRedirect() {
  const { isAuthenticated, isAdmin, isLoading } = useAuthContext();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={isAdmin ? "/admin" : "/home"} replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRedirect />} />

              {/* Public auth routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/register/complete" element={<RegisterCompletePage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
              <Route path="/verify-email/:token" element={<VerifyEmailPage />} />

              {/* KYC + biometric setup */}
              <Route path="/kyc" element={<KycWizardPage />} />
              <Route path="/biometric-setup" element={<BiometricSetupPage />} />

              {/* PIN setup */}
              <Route path="/pin-setup" element={<ProtectedRoute><PinSetupPage /></ProtectedRoute>} />

              {/* Protected voter routes */}
              <Route path="/home" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
              <Route path="/elections" element={<ProtectedRoute><ElectionListPage /></ProtectedRoute>} />
              <Route path="/elections/:id" element={<ProtectedRoute><BallotPage /></ProtectedRoute>} />
              <Route path="/elections/:id/confirmation" element={<ProtectedRoute><ConfirmationPage /></ProtectedRoute>} />
              <Route path="/elections/:id/results" element={<ProtectedRoute><ResultsPage /></ProtectedRoute>} />
              <Route path="/my-elections" element={<ProtectedRoute><MyElectionsPage /></ProtectedRoute>} />

              <Route path="/settings/security" element={<ProtectedRoute><SecuritySettingsPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/requests" element={<ProtectedRoute><RequestsPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/groups" element={<ProtectedRoute><GroupsPage /></ProtectedRoute>} />
              <Route path="/groups/:id" element={<ProtectedRoute><GroupDetailPage /></ProtectedRoute>} />
              <Route
                path="/candidate-profile/:requestId"
                element={<ProtectedRoute><CandidateProfileCompletionPage /></ProtectedRoute>}
              />

              {/* Admin routes */}
              <Route path="/admin/require-2fa" element={<ProtectedRoute><AdminRequire2FAPage /></ProtectedRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
              <Route path="/admin/groups" element={<AdminRoute><AdminGroupsPage /></AdminRoute>} />
              <Route path="/admin/elections" element={<AdminRoute><AdminElectionsPage /></AdminRoute>} />
              <Route path="/admin/elections/new" element={<AdminRoute><CreateElectionPage /></AdminRoute>} />
              <Route path="/admin/groups/new" element={<AdminRoute><CreateGroupPage /></AdminRoute>} />
              <Route path="/admin/groups/:id" element={<AdminRoute><AdminGroupDetailPage /></AdminRoute>} />
              <Route path="/admin/groups/:id/members" element={<AdminRoute><AdminGroupMembersPage /></AdminRoute>} />
              <Route path="/admin/elections/:id/status" element={<AdminRoute><ElectionStatusPage /></AdminRoute>} />
              <Route path="/admin/elections/:id/candidates" element={<AdminRoute><ManageCandidatesPage /></AdminRoute>} />
              <Route path="/admin/elections/:id/analytics" element={<AdminRoute><AdminAnalyticsPage /></AdminRoute>} />
              <Route path="/admin/audit-log" element={<AdminRoute><AuditLogPage /></AdminRoute>} />

              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
