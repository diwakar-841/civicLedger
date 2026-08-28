import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, Mail, Smartphone, Monitor, Trash2, AlertTriangle, Copy, CheckCircle2, QrCode } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { TextField } from "../../components/shared/Input";
import { Spinner } from "../../components/shared/Spinner";
import { useAuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { apiClient } from "../../lib/apiClient";
import { formatError } from "../../lib/formatError";
import type { Session, TwoFASetupResponse, TwoFAEnableResponse } from "../../types/api";

type TwoFAStep = "idle" | "setup" | "codes";

export function SecuritySettingsPage() {
  const { user, refreshUser } = useAuthContext();
  const { show } = useToast();

  // Email verification
  const [resending, setResending] = useState(false);

  // 2FA
  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>("idle");
  const [setupData, setSetupData] = useState<TwoFASetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [disableCode, setDisableCode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sessions
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [signingOut, setSigningOut] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const { data } = await apiClient.get<Session[]>("/auth/sessions");
      setSessions(data);
    } catch {
      // ignore
    } finally {
      setSessionsLoading(false);
    }
  }

  async function handleResendVerification() {
    setResending(true);
    try {
      await apiClient.post("/auth/resend-verification");
      show("Verification email sent. Check your inbox.", "success");
    } catch (err) {
      show(formatError(err, "Could not send verification email"), "error");
    } finally {
      setResending(false);
    }
  }

  async function handle2FASetup() {
    setTwoFALoading(true);
    try {
      const { data } = await apiClient.post<TwoFASetupResponse>("/auth/2fa/setup");
      setSetupData(data);
      setTwoFAStep("setup");
    } catch (err) {
      show(formatError(err, "Could not start 2FA setup"), "error");
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handle2FAEnable() {
    if (!code.trim()) return;
    setTwoFALoading(true);
    try {
      const { data } = await apiClient.post<TwoFAEnableResponse>("/auth/2fa/enable", { code: code.trim() });
      setRecoveryCodes(data.recoveryCodes);
      setTwoFAStep("codes");
      setCode("");
      await refreshUser();
    } catch (err) {
      show(formatError(err, "Invalid code. Please try again."), "error");
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handle2FADisable() {
    if (!disableCode.trim()) return;
    setDisabling(true);
    try {
      await apiClient.post("/auth/2fa/disable", { code: disableCode.trim() });
      show("Two-factor authentication disabled.", "success");
      setShowDisableForm(false);
      setDisableCode("");
      await refreshUser();
    } catch (err) {
      show(formatError(err, "Invalid code"), "error");
    } finally {
      setDisabling(false);
    }
  }

  async function handleSignOutSession(sessionId: string) {
    setSigningOut(sessionId);
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      show("Session ended.", "success");
    } catch (err) {
      show(formatError(err, "Could not end session"), "error");
    } finally {
      setSigningOut(null);
    }
  }

  async function handleSignOutAll() {
    setSigningOutAll(true);
    try {
      await apiClient.post("/auth/logout-all");
      show("Signed out of all devices.", "success");
      await loadSessions();
    } catch (err) {
      show(formatError(err, "Could not sign out all devices"), "error");
    } finally {
      setSigningOutAll(false);
    }
  }

  function copyRecoveryCodes() {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  };

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <motion.div {...fadeIn}>
          <div className="mb-2 flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-gold-500" />
            <h1 className="text-2xl font-bold text-navy-900 dark:text-navy-50">Security settings</h1>
          </div>
          <p className="mb-8 text-navy-500 dark:text-navy-400">Manage your email verification, two-factor authentication, and active sessions.</p>
        </motion.div>

        {/* Email verification */}
        <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.05 }}>
          <Card className="mb-6 p-6 dark:bg-navy-900 dark:border-navy-700">
            <div className="flex items-start gap-4">
              <span className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${user?.emailVerified || user?.isVerified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                <Mail className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-navy-900 dark:text-navy-100">Email verification</h2>
                  {user?.emailVerified || user?.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      <AlertTriangle className="h-3 w-3" /> Unverified
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">{user?.email}</p>
                {!user?.emailVerified && !user?.isVerified && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    loading={resending}
                    onClick={handleResendVerification}
                  >
                    Resend verification email
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Phone identity verification */}
        <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.075 }}>
          <Card className="mb-6 p-6 dark:border-navy-700 dark:bg-navy-900">
            <div className="flex items-start gap-4">
              <span className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${user?.phoneVerified || user?.isVerified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`}>
                <Smartphone className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-navy-900 dark:text-navy-100">Phone identity verification</h2>
                  {user?.phoneVerified || user?.isVerified ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      <AlertTriangle className="h-3 w-3" /> Required at first sign-in
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
                  {user?.phone || "A unique phone number is confirmed after your first sign-in."}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 2FA */}
        <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.1 }}>
          <Card className="mb-6 p-6 dark:bg-navy-900 dark:border-navy-700">
            <div className="flex items-start gap-4">
              <span className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${user?.isTwoFactorEnabled ? "bg-emerald-100 text-emerald-600" : "bg-navy-100 text-navy-500"}`}>
                <Smartphone className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-navy-900 dark:text-navy-100">Two-factor authentication</h2>
                  {user?.isTwoFactorEnabled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3 w-3" /> Enabled
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
                  {user?.isTwoFactorEnabled
                    ? "Your account is protected with an authenticator app."
                    : "Add a second layer of security using an authenticator app."}
                </p>

                <AnimatePresence mode="wait">
                  {!user?.isTwoFactorEnabled && twoFAStep === "idle" && (
                    <motion.div key="enable-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Button size="sm" className="mt-3" loading={twoFALoading} onClick={handle2FASetup}>
                        <QrCode className="h-4 w-4" />
                        Set up 2FA
                      </Button>
                    </motion.div>
                  )}

                  {twoFAStep === "setup" && setupData && (
                    <motion.div
                      key="setup"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 space-y-4"
                    >
                      <div className="rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-4">
                        <p className="mb-3 text-sm font-medium text-navy-700 dark:text-navy-300">
                          1. Scan this QR code with your authenticator app
                        </p>
                        <div className="flex justify-center">
                          <img src={setupData.qrCodeDataUrl} alt="QR code for authenticator app" className="h-40 w-40 rounded-lg" />
                        </div>
                        <p className="mt-3 text-xs text-navy-500 dark:text-navy-400">Or enter this key manually:</p>
                        <code className="mt-1 block break-all rounded bg-navy-50 dark:bg-navy-700 px-3 py-2 text-xs font-mono text-navy-800 dark:text-navy-200">
                          {setupData.secret}
                        </code>
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-navy-700 dark:text-navy-300">2. Enter the 6-digit code to confirm</p>
                        <div className="flex gap-3">
                          <TextField
                            label="Authentication code"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                            placeholder="000000"
                          />
                          <div className="mt-6 flex-shrink-0">
                            <Button loading={twoFALoading} onClick={handle2FAEnable} disabled={code.length !== 6}>
                              Confirm
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {twoFAStep === "codes" && (
                    <motion.div
                      key="codes"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-4"
                    >
                      <div className="rounded-xl border-2 border-gold-400 bg-gold-50 dark:bg-navy-800 dark:border-gold-600 p-5">
                        <div className="mb-3 flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-gold-600 dark:text-gold-400 flex-shrink-0" />
                          <p className="text-sm font-semibold text-gold-900 dark:text-gold-300">Save these recovery codes now</p>
                        </div>
                        <p className="mb-4 text-xs text-gold-800 dark:text-gold-400">
                          These codes will only be shown once. Each can be used once if you lose access to your authenticator app.
                        </p>
                        <div className="mb-4 grid grid-cols-2 gap-2">
                          {recoveryCodes.map((c) => (
                            <code key={c} className="rounded bg-white dark:bg-navy-700 px-3 py-1.5 text-center text-xs font-mono text-navy-900 dark:text-navy-100 shadow-sm">
                              {c}
                            </code>
                          ))}
                        </div>
                        <Button size="sm" variant="secondary" onClick={copyRecoveryCodes}>
                          {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          {copied ? "Copied!" : "Copy all codes"}
                        </Button>
                      </div>
                      <p className="mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        Two-factor authentication is now enabled on your account.
                      </p>
                    </motion.div>
                  )}

                  {user?.isTwoFactorEnabled && !showDisableForm && twoFAStep === "idle" && (
                    <motion.div key="disable-btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <Button size="sm" variant="danger" className="mt-3" onClick={() => setShowDisableForm(true)}>
                        Disable 2FA
                      </Button>
                    </motion.div>
                  )}

                  {user?.isTwoFactorEnabled && showDisableForm && (
                    <motion.div key="disable-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4">
                      <p className="mb-2 text-sm text-navy-600 dark:text-navy-400">Enter your authenticator code to disable 2FA:</p>
                      <div className="flex gap-3">
                        <TextField
                          label="Authentication code"
                          inputMode="numeric"
                          maxLength={6}
                          value={disableCode}
                          onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="000000"
                        />
                        <div className="mt-6 flex flex-shrink-0 gap-2">
                          <Button variant="danger" loading={disabling} onClick={handle2FADisable} disabled={disableCode.length !== 6}>
                            Disable
                          </Button>
                          <Button variant="ghost" onClick={() => { setShowDisableForm(false); setDisableCode(""); }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Sessions */}
        <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.15 }}>
          <Card className="p-6 dark:bg-navy-900 dark:border-navy-700">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-navy-300">
                  <Monitor className="h-5 w-5" />
                </span>
                <h2 className="font-semibold text-navy-900 dark:text-navy-100">Active sessions</h2>
              </div>
              <Button
                size="sm"
                variant="danger"
                loading={signingOutAll}
                onClick={handleSignOutAll}
              >
                Sign out all
              </Button>
            </div>

            {sessionsLoading && <Spinner label="Loading sessions" />}
            {!sessionsLoading && sessions.length === 0 && (
              <p className="text-sm text-navy-500 dark:text-navy-400">No active sessions found.</p>
            )}
            {!sessionsLoading && sessions.length > 0 && (
              <div className="flex flex-col gap-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-navy-100 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-navy-800 dark:text-navy-200">
                        {session.userAgent || "Unknown device"}
                      </p>
                      <p className="mt-0.5 text-xs text-navy-400 dark:text-navy-500">
                        IP: {session.ipAddress || "Unknown"} &middot; Created: {new Date(session.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-0.5 text-xs text-navy-400 dark:text-navy-500">
                        Expires: {new Date(session.expiresAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      loading={signingOut === session.id}
                      onClick={() => handleSignOutSession(session.id)}
                      className="flex-shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>

        <motion.div {...fadeIn} transition={{ ...fadeIn.transition, delay: 0.2 }} className="mt-4">
          <p className="text-center text-xs text-navy-400 dark:text-navy-500">
            Need to change your password?{" "}
            <Link to="/forgot-password" className="font-medium text-gold-500 hover:text-gold-600">
              Request a reset link
            </Link>
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
