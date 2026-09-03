import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute, AdminRoute } from "./components/auth/ProtectedRoute";
import { PageLoader } from "./components/common/PageLoader";

// Auth Pages - Lazy Loaded
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const RegisterCompletePage = lazy(() => import("./pages/RegisterCompletePage"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage"));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage"));

// Auth Setup Pages - Lazy Loaded
const KycWizardPage = lazy(() => import("./pages/auth/KycWizardPage"));
const BiometricSetupPage = lazy(() => import("./pages/auth/BiometricSetupPage"));
const PinSetupPage = lazy(() => import("./pages/auth/PinSetupPage"));

// User Pages - Lazy Loaded
const HomePage = lazy(() => import("./pages/HomePage"));
const ElectionListPage = lazy(() => import("./pages/ElectionListPage"));
const MyElectionsPage = lazy(() => import("./pages/MyElectionsPage"));
const GroupDetailPage = lazy(() => import("./pages/GroupDetailPage"));
const BallotPage = lazy(() => import("./pages/BallotPage"));
const ConfirmationPage = lazy(() => import("./pages/ConfirmationPage"));
const ResultsPage = lazy(() => import("./pages/ResultsPage"));
const SecuritySettingsPage = lazy(() => import("./pages/settings/SecuritySettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CandidateProfileCompletionPage = lazy(() => import("./pages/CandidateProfileCompletionPage"));
const RequestsPage = lazy(() => import("./pages/RequestsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));

// Admin Pages - Lazy Loaded
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const CreateElectionPage = lazy(() => import("./pages/admin/CreateElectionPage"));
const ManageCandidatesPage = lazy(() => import("./pages/admin/ManageCandidatesPage"));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage"));
const AuditLogPage = lazy(() => import("./pages/admin/AuditLogPage"));
const AdminRequire2FAPage = lazy(() => import("./pages/admin/AdminRequire2FAPage"));
const ElectionStatusPage = lazy(() => import("./pages/admin/ElectionStatusPage"));
const CreateGroupPage = lazy(() => import("./pages/admin/CreateGroupPage"));
const AdminGroupDetailPage = lazy(() => import("./pages/admin/AdminGroupDetailPage"));
const AdminGroupMembersPage = lazy(() => import("./pages/admin/AdminGroupMembersPage"));
const AdminGroupsPage = lazy(() => import("./pages/admin/AdminGroupsPage"));
const AdminElectionsPage = lazy(() => import("./pages/admin/AdminElectionsPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

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
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<RootRedirect />} />

                {/* Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/register/complete"
                  element={<RegisterCompletePage />}
                />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route
                  path="/reset-password/:token"
                  element={<ResetPasswordPage />}
                />
                <Route
                  path="/verify-email/:token"
                  element={<VerifyEmailPage />}
                />

                {/* Auth Setup Routes */}
                <Route path="/kyc" element={<KycWizardPage />} />
                <Route path="/biometric-setup" element={<BiometricSetupPage />} />

                {/* Protected Routes */}
                <Route
                  path="/pin-setup"
                  element={
                    <ProtectedRoute>
                      <PinSetupPage />
                    </ProtectedRoute>
                  }
                />

                {/* User Routes */}
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <HomePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/elections"
                  element={
                    <ProtectedRoute>
                      <ElectionListPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/elections/:id"
                  element={
                    <ProtectedRoute>
                      <BallotPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/elections/:id/confirmation"
                  element={
                    <ProtectedRoute>
                      <ConfirmationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/elections/:id/results"
                  element={
                    <ProtectedRoute>
                      <ResultsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-elections"
                  element={
                    <ProtectedRoute>
                      <MyElectionsPage />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/settings/security"
                  element={
                    <ProtectedRoute>
                      <SecuritySettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/requests"
                  element={
                    <ProtectedRoute>
                      <RequestsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups"
                  element={
                    <ProtectedRoute>
                      <GroupsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/groups/:id"
                  element={
                    <ProtectedRoute>
                      <GroupDetailPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/candidate-profile/:requestId"
                  element={
                    <ProtectedRoute>
                      <CandidateProfileCompletionPage />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/require-2fa"
                  element={
                    <ProtectedRoute>
                      <AdminRequire2FAPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminDashboardPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/groups"
                  element={
                    <AdminRoute>
                      <AdminGroupsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/elections"
                  element={
                    <AdminRoute>
                      <AdminElectionsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/elections/new"
                  element={
                    <AdminRoute>
                      <CreateElectionPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/groups/new"
                  element={
                    <AdminRoute>
                      <CreateGroupPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/groups/:id"
                  element={
                    <AdminRoute>
                      <AdminGroupDetailPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/groups/:id/members"
                  element={
                    <AdminRoute>
                      <AdminGroupMembersPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/elections/:id/status"
                  element={
                    <AdminRoute>
                      <ElectionStatusPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/elections/:id/candidates"
                  element={
                    <AdminRoute>
                      <ManageCandidatesPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/elections/:id/analytics"
                  element={
                    <AdminRoute>
                      <AdminAnalyticsPage />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin/audit-log"
                  element={
                    <AdminRoute>
                      <AuditLogPage />
                    </AdminRoute>
                  }
                />

                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
