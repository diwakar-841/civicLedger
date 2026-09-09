import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProtectedRoute, AdminRoute } from "./components/auth/ProtectedRoute";
import { PageLoader } from "./components/common/PageLoader";

// Auth Pages - Lazy Loaded
const LoginPage = lazy(() => import("./pages/LoginPage").then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then(m => ({ default: m.RegisterPage })));
const RegisterCompletePage = lazy(() => import("./pages/RegisterCompletePage").then(m => ({ default: m.RegisterCompletePage })));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage").then(m => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage").then(m => ({ default: m.ResetPasswordPage })));
const VerifyEmailPage = lazy(() => import("./pages/VerifyEmailPage").then(m => ({ default: m.VerifyEmailPage })));

// Auth Setup Pages - Lazy Loaded
const KycWizardPage = lazy(() => import("./pages/auth/KycWizardPage").then(m => ({ default: m.KycWizardPage })));
const BiometricSetupPage = lazy(() => import("./pages/auth/BiometricSetupPage").then(m => ({ default: m.BiometricSetupPage })));
const PinSetupPage = lazy(() => import("./pages/auth/PinSetupPage").then(m => ({ default: m.PinSetupPage })));

// User Pages - Lazy Loaded
const HomePage = lazy(() => import("./pages/HomePage").then(m => ({ default: m.HomePage })));
const ElectionListPage = lazy(() => import("./pages/ElectionListPage").then(m => ({ default: m.ElectionListPage })));
const MyElectionsPage = lazy(() => import("./pages/MyElectionsPage").then(m => ({ default: m.MyElectionsPage })));
const GroupDetailPage = lazy(() => import("./pages/GroupDetailPage").then(m => ({ default: m.GroupDetailPage })));
const BallotPage = lazy(() => import("./pages/BallotPage").then(m => ({ default: m.BallotPage })));
const ConfirmationPage = lazy(() => import("./pages/ConfirmationPage").then(m => ({ default: m.ConfirmationPage })));
const ResultsPage = lazy(() => import("./pages/ResultsPage").then(m => ({ default: m.ResultsPage })));
const SecuritySettingsPage = lazy(() => import("./pages/settings/SecuritySettingsPage").then(m => ({ default: m.SecuritySettingsPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then(m => ({ default: m.ProfilePage })));
const CandidateProfileCompletionPage = lazy(() => import("./pages/CandidateProfileCompletionPage").then(m => ({ default: m.CandidateProfileCompletionPage })));
const RequestsPage = lazy(() => import("./pages/RequestsPage").then(m => ({ default: m.RequestsPage })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then(m => ({ default: m.NotificationsPage })));
const GroupsPage = lazy(() => import("./pages/GroupsPage").then(m => ({ default: m.GroupsPage })));

// Admin Pages - Lazy Loaded
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage").then(m => ({ default: m.AdminDashboardPage })));
const CreateElectionPage = lazy(() => import("./pages/admin/CreateElectionPage").then(m => ({ default: m.CreateElectionPage })));
const ManageCandidatesPage = lazy(() => import("./pages/admin/ManageCandidatesPage").then(m => ({ default: m.ManageCandidatesPage })));
const AdminAnalyticsPage = lazy(() => import("./pages/admin/AdminAnalyticsPage").then(m => ({ default: m.AdminAnalyticsPage })));
const AuditLogPage = lazy(() => import("./pages/admin/AuditLogPage").then(m => ({ default: m.AuditLogPage })));
const AdminRequire2FAPage = lazy(() => import("./pages/admin/AdminRequire2FAPage").then(m => ({ default: m.AdminRequire2FAPage })));
const ElectionStatusPage = lazy(() => import("./pages/admin/ElectionStatusPage").then(m => ({ default: m.ElectionStatusPage })));
const CreateGroupPage = lazy(() => import("./pages/admin/CreateGroupPage").then(m => ({ default: m.CreateGroupPage })));
const AdminGroupDetailPage = lazy(() => import("./pages/admin/AdminGroupDetailPage").then(m => ({ default: m.AdminGroupDetailPage })));
const AdminGroupMembersPage = lazy(() => import("./pages/admin/AdminGroupMembersPage").then(m => ({ default: m.AdminGroupMembersPage })));
const AdminGroupsPage = lazy(() => import("./pages/admin/AdminGroupsPage").then(m => ({ default: m.AdminGroupsPage })));
const AdminElectionsPage = lazy(() => import("./pages/admin/AdminElectionsPage").then(m => ({ default: m.AdminElectionsPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then(m => ({ default: m.NotFoundPage })));

function RootRedirect() {
  const { isAuthenticated, isAdmin, isLoading } = useAuthContext();
  if (isLoading) return <PageLoader />;
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