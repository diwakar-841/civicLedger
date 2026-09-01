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
import { formatError } from "../../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function SecuritySettingsPage() {
  const { user, refreshUser } = useAuthContext();
  const { show } = useToast();

  const [resending, setResending] = useState(false);

  const [twoFAStep, setTwoFAStep] = useState("idle");
  const [setupData, setSetupData] = useState(null);
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState([]);
  const [disableCode, setDisableCode] = useState("");
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [copied, setCopied] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    setSessionsLoading(true);
    try {
      const { data } = await apiClient.get("/auth/sessions");
      setSessions(data);
    } catch {

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
      const { data } = await apiClient.post("/auth/2fa/setup");
      setSetupData(data);
      setTwoFAStep("setup");
    } catch (err) {
      show(formatError(err, "Could not start 2FA setup"), "error");
    } finally {
      setTwoFALoading(false);
    }
  }

  async function handle2FAEnable() {
    if (!code.trim()) {return;}
    setTwoFALoading(true);
    try {
      const { data } = await apiClient.post("/auth/2fa/enable", { code: code.trim() });
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
    if (!disableCode.trim()) {return;}
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

  async function handleSignOutSession(sessionId) {
    setSigningOut(sessionId);
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`);
      setSessions((prev) => {return prev.filter((s) => {return s.id !== sessionId;});});
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
    setTimeout(() => {return setCopied(false);}, 2000);
  }

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    _jsxDEV(Layout, {
 children:
      _jsxDEV("div", {
 className: "mx-auto max-w-2xl", children: [
        _jsxDEV(motion.div, {
 ...fadeIn, children: [
          _jsxDEV("div", {
 className: "mb-2 flex items-center gap-3", children: [
            _jsxDEV(ShieldCheck, { className: "h-6 w-6 text-gold-500" }, void 0, false),
            _jsxDEV("h1", { className: "text-2xl font-bold text-navy-900 dark:text-navy-50", children: "Security settings" }, void 0, false)] 
}, void 0, true
          ),
          _jsxDEV("p", { className: "mb-8 text-navy-500 dark:text-navy-400", children: "Manage your email verification, two-factor authentication, and active sessions." }, void 0, false)] 
}, void 0, true
        ),

        _jsxDEV(motion.div, {
 ...fadeIn, transition: { ...fadeIn.transition, delay: 0.05 }, children:
          _jsxDEV(Card, {
 className: "mb-6 p-6 dark:bg-navy-900 dark:border-navy-700", children:
            _jsxDEV("div", {
 className: "flex items-start gap-4", children: [
              _jsxDEV("span", {
 className: `mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${user?.emailVerified || user?.isVerified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`, children:
                _jsxDEV(Mail, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("div", {
 className: "flex-1", children: [
                _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                  _jsxDEV("h2", { className: "font-semibold text-navy-900 dark:text-navy-100", children: "Email verification" }, void 0, false),
                  user?.emailVerified || user?.isVerified ?
                  _jsxDEV("span", {
 className: "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700", children: [
                    _jsxDEV(CheckCircle2, { className: "h-3 w-3" }, void 0, false), " Verified"] 
}, void 0, true
                  ) :

                  _jsxDEV("span", {
 className: "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700", children: [
                    _jsxDEV(AlertTriangle, { className: "h-3 w-3" }, void 0, false), " Unverified"] 
}, void 0, true
                  )] 
}, void 0, true

                ),
                _jsxDEV("p", { className: "mt-1 text-sm text-navy-500 dark:text-navy-400", children: user?.email }, void 0, false),
                !user?.emailVerified && !user?.isVerified &&
                _jsxDEV(Button, {
                  size: "sm",
                  variant: "secondary",
                  className: "mt-3",
                  loading: resending,
                  onClick: handleResendVerification, children:
                  "Resend verification email" 
}, void 0, false

                )] 
}, void 0, true

              )] 
}, void 0, true
            ) 
}, void 0, false
          ) 
}, void 0, false
        ),

        _jsxDEV(motion.div, {
 ...fadeIn, transition: { ...fadeIn.transition, delay: 0.075 }, children:
          _jsxDEV(Card, {
 className: "mb-6 p-6 dark:border-navy-700 dark:bg-navy-900", children:
            _jsxDEV("div", {
 className: "flex items-start gap-4", children: [
              _jsxDEV("span", {
 className: `mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${user?.phoneVerified || user?.isVerified ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"}`, children:
                _jsxDEV(Smartphone, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("div", {
 children: [
                _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                  _jsxDEV("h2", { className: "font-semibold text-navy-900 dark:text-navy-100", children: "Phone identity verification" }, void 0, false),
                  user?.phoneVerified || user?.isVerified ?
                  _jsxDEV("span", {
 className: "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700", children: [
                    _jsxDEV(CheckCircle2, { className: "h-3 w-3" }, void 0, false), " Verified"] 
}, void 0, true
                  ) :

                  _jsxDEV("span", {
 className: "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700", children: [
                    _jsxDEV(AlertTriangle, { className: "h-3 w-3" }, void 0, false), " Required at first sign-in"] 
}, void 0, true
                  )] 
}, void 0, true

                ),
                _jsxDEV("p", {
 className: "mt-1 text-sm text-navy-500 dark:text-navy-400", children:
                  user?.phone || "A unique phone number is confirmed after your first sign-in." 
}, void 0, false
                )] 
}, void 0, true
              )] 
}, void 0, true
            ) 
}, void 0, false
          ) 
}, void 0, false
        ),

        _jsxDEV(motion.div, {
 ...fadeIn, transition: { ...fadeIn.transition, delay: 0.1 }, children:
          _jsxDEV(Card, {
 className: "mb-6 p-6 dark:bg-navy-900 dark:border-navy-700", children:
            _jsxDEV("div", {
 className: "flex items-start gap-4", children: [
              _jsxDEV("span", {
 className: `mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${user?.isTwoFactorEnabled ? "bg-emerald-100 text-emerald-600" : "bg-navy-100 text-navy-500"}`, children:
                _jsxDEV(Smartphone, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("div", {
 className: "flex-1", children: [
                _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                  _jsxDEV("h2", { className: "font-semibold text-navy-900 dark:text-navy-100", children: "Two-factor authentication" }, void 0, false),
                  user?.isTwoFactorEnabled &&
                  _jsxDEV("span", {
 className: "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700", children: [
                    _jsxDEV(CheckCircle2, { className: "h-3 w-3" }, void 0, false), " Enabled"] 
}, void 0, true
                  )] 
}, void 0, true

                ),
                _jsxDEV("p", {
 className: "mt-1 text-sm text-navy-500 dark:text-navy-400", children:
                  user?.isTwoFactorEnabled ?
                  "Your account is protected with an authenticator app." :
                  "Add a second layer of security using an authenticator app." 
}, void 0, false
                ),

                _jsxDEV(AnimatePresence, {
 mode: "wait", children: [
                  !user?.isTwoFactorEnabled && twoFAStep === "idle" &&
                  _jsxDEV(motion.div, {
 initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, children:
                    _jsxDEV(Button, {
 size: "sm", className: "mt-3", loading: twoFALoading, onClick: handle2FASetup, children: [
                      _jsxDEV(QrCode, { className: "h-4 w-4" }, void 0, false), "Set up 2FA"] 
}, void 0, true

                    ) 
}, "enable-btn", false
                  ),

                  twoFAStep === "setup" && setupData &&
                  _jsxDEV(motion.div, {

                    initial: { opacity: 0, y: 8 },
                    animate: { opacity: 1, y: 0 },
                    exit: { opacity: 0 },
                    className: "mt-4 space-y-4", children: [

                    _jsxDEV("div", {
 className: "rounded-xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-4", children: [
                      _jsxDEV("p", { className: "mb-3 text-sm font-medium text-navy-700 dark:text-navy-300", children: "1. Scan this QR code with your authenticator app" }, void 0, false

                      ),
                      _jsxDEV("div", {
 className: "flex justify-center", children:
                        _jsxDEV("img", { src: setupData.qrCodeDataUrl, alt: "QR code for authenticator app", className: "h-40 w-40 rounded-lg" }, void 0, false) 
}, void 0, false
                      ),
                      _jsxDEV("p", { className: "mt-3 text-xs text-navy-500 dark:text-navy-400", children: "Or enter this key manually:" }, void 0, false),
                      _jsxDEV("code", {
 className: "mt-1 block break-all rounded bg-navy-50 dark:bg-navy-700 px-3 py-2 text-xs font-mono text-navy-800 dark:text-navy-200", children:
                        setupData.secret 
}, void 0, false
                      )] 
}, void 0, true
                    ),
                    _jsxDEV("div", {
 children: [
                      _jsxDEV("p", { className: "mb-2 text-sm font-medium text-navy-700 dark:text-navy-300", children: "2. Enter the 6-digit code to confirm" }, void 0, false),
                      _jsxDEV("div", {
 className: "flex gap-3", children: [
                        _jsxDEV(TextField, {
                          label: "Authentication code",
                          inputMode: "numeric",
                          maxLength: 6,
                          value: code,
                          onChange: (e) => {return setCode(e.target.value.replace(/\D/g, ""));},
                          placeholder: "000000" 
}, void 0, false
                        ),
                        _jsxDEV("div", {
 className: "mt-6 flex-shrink-0", children:
                          _jsxDEV(Button, { loading: twoFALoading, onClick: handle2FAEnable, disabled: code.length !== 6, children: "Confirm" }, void 0, false

                          ) 
}, void 0, false
                        )] 
}, void 0, true
                      )] 
}, void 0, true
                    )] 
}, "setup", true
                  ),

                  twoFAStep === "codes" &&
                  _jsxDEV(motion.div, {

                    initial: { opacity: 0, scale: 0.97 },
                    animate: { opacity: 1, scale: 1 },
                    exit: { opacity: 0 },
                    className: "mt-4", children: [

                    _jsxDEV("div", {
 className: "rounded-xl border-2 border-gold-400 bg-gold-50 dark:bg-navy-800 dark:border-gold-600 p-5", children: [
                      _jsxDEV("div", {
 className: "mb-3 flex items-center gap-2", children: [
                        _jsxDEV(AlertTriangle, { className: "h-5 w-5 text-gold-600 dark:text-gold-400 flex-shrink-0" }, void 0, false),
                        _jsxDEV("p", { className: "text-sm font-semibold text-gold-900 dark:text-gold-300", children: "Save these recovery codes now" }, void 0, false)] 
}, void 0, true
                      ),
                      _jsxDEV("p", { className: "mb-4 text-xs text-gold-800 dark:text-gold-400", children: "These codes will only be shown once. Each can be used once if you lose access to your authenticator app." }, void 0, false

                      ),
                      _jsxDEV("div", {
 className: "mb-4 grid grid-cols-2 gap-2", children:
                        recoveryCodes.map((c) => {return (
                            _jsxDEV("code", {
 className: "rounded bg-white dark:bg-navy-700 px-3 py-1.5 text-center text-xs font-mono text-navy-900 dark:text-navy-100 shadow-sm", children:
                              c 
}, c, false
                            ));
                        }) 
}, void 0, false
                      ),
                      _jsxDEV(Button, {
 size: "sm", variant: "secondary", onClick: copyRecoveryCodes, children: [
                        copied ? _jsxDEV(CheckCircle2, { className: "h-4 w-4" }, void 0, false) : _jsxDEV(Copy, { className: "h-4 w-4" }, void 0, false),
                        copied ? "Copied!" : "Copy all codes"] 
}, void 0, true
                      )] 
}, void 0, true
                    ),
                    _jsxDEV("p", { className: "mt-3 text-xs text-emerald-600 dark:text-emerald-400 font-medium", children: "Two-factor authentication is now enabled on your account." }, void 0, false

                    )] 
}, "codes", true
                  ),

                  user?.isTwoFactorEnabled && !showDisableForm && twoFAStep === "idle" &&
                  _jsxDEV(motion.div, {
 initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 }, children:
                    _jsxDEV(Button, { size: "sm", variant: "danger", className: "mt-3", onClick: () => {return setShowDisableForm(true);}, children: "Disable 2FA" }, void 0, false

                    ) 
}, "disable-btn", false
                  ),

                  user?.isTwoFactorEnabled && showDisableForm &&
                  _jsxDEV(motion.div, {
 initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0 }, className: "mt-4", children: [
                    _jsxDEV("p", { className: "mb-2 text-sm text-navy-600 dark:text-navy-400", children: "Enter your authenticator code to disable 2FA:" }, void 0, false),
                    _jsxDEV("div", {
 className: "flex gap-3", children: [
                      _jsxDEV(TextField, {
                        label: "Authentication code",
                        inputMode: "numeric",
                        maxLength: 6,
                        value: disableCode,
                        onChange: (e) => {return setDisableCode(e.target.value.replace(/\D/g, ""));},
                        placeholder: "000000" 
}, void 0, false
                      ),
                      _jsxDEV("div", {
 className: "mt-6 flex flex-shrink-0 gap-2", children: [
                        _jsxDEV(Button, { variant: "danger", loading: disabling, onClick: handle2FADisable, disabled: disableCode.length !== 6, children: "Disable" }, void 0, false

                        ),
                        _jsxDEV(Button, { variant: "ghost", onClick: () => {setShowDisableForm(false);setDisableCode("");}, children: "Cancel" }, void 0, false

                        )] 
}, void 0, true
                      )] 
}, void 0, true
                    )] 
}, "disable-form", true
                  )] 
}, void 0, true

                )] 
}, void 0, true
              )] 
}, void 0, true
            ) 
}, void 0, false
          ) 
}, void 0, false
        ),

        _jsxDEV(motion.div, {
 ...fadeIn, transition: { ...fadeIn.transition, delay: 0.15 }, children:
          _jsxDEV(Card, {
 className: "p-6 dark:bg-navy-900 dark:border-navy-700", children: [
            _jsxDEV("div", {
 className: "mb-4 flex items-center justify-between", children: [
              _jsxDEV("div", {
 className: "flex items-center gap-3", children: [
                _jsxDEV("span", {
 className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 dark:bg-navy-700 text-navy-500 dark:text-navy-300", children:
                  _jsxDEV(Monitor, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
                ),
                _jsxDEV("h2", { className: "font-semibold text-navy-900 dark:text-navy-100", children: "Active sessions" }, void 0, false)] 
}, void 0, true
              ),
              _jsxDEV(Button, {
                size: "sm",
                variant: "danger",
                loading: signingOutAll,
                onClick: handleSignOutAll, children:
                "Sign out all" 
}, void 0, false

              )] 
}, void 0, true
            ),

            sessionsLoading && _jsxDEV(Spinner, { label: "Loading sessions" }, void 0, false),
            !sessionsLoading && sessions.length === 0 &&
            _jsxDEV("p", { className: "text-sm text-navy-500 dark:text-navy-400", children: "No active sessions found." }, void 0, false),

            !sessionsLoading && sessions.length > 0 &&
            _jsxDEV("div", {
 className: "flex flex-col gap-3", children:
              sessions.map((session) => {return (
                  _jsxDEV("div", {

                    className: "flex items-start justify-between gap-4 rounded-lg border border-navy-100 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 p-4", children: [

                    _jsxDEV("div", {
 className: "min-w-0 flex-1", children: [
                      _jsxDEV("p", {
 className: "truncate text-sm font-medium text-navy-800 dark:text-navy-200", children:
                        session.userAgent || "Unknown device" 
}, void 0, false
                      ),
                      _jsxDEV("p", {
 className: "mt-0.5 text-xs text-navy-400 dark:text-navy-500", children: ["IP: ",
                        session.ipAddress || "Unknown", " · Created: ", new Date(session.createdAt).toLocaleString()] 
}, void 0, true
                      ),
                      _jsxDEV("p", {
 className: "mt-0.5 text-xs text-navy-400 dark:text-navy-500", children: ["Expires: ",
                        new Date(session.expiresAt).toLocaleString()] 
}, void 0, true
                      )] 
}, void 0, true
                    ),
                    _jsxDEV(Button, {
                      size: "sm",
                      variant: "ghost",
                      loading: signingOut === session.id,
                      onClick: () => {return handleSignOutSession(session.id);},
                      className: "flex-shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700", children: [

                      _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false), "Sign out"] 
}, void 0, true

                    )] 
}, session.id, true
                  ));
              }) 
}, void 0, false
            )] 
}, void 0, true

          ) 
}, void 0, false
        ),

        _jsxDEV(motion.div, {
 ...fadeIn, transition: { ...fadeIn.transition, delay: 0.2 }, className: "mt-4", children:
          _jsxDEV("p", {
 className: "text-center text-xs text-navy-400 dark:text-navy-500", children: ["Need to change your password?",
            " ",
            _jsxDEV(Link, { to: "/forgot-password", className: "font-medium text-gold-500 hover:text-gold-600", children: "Request a reset link" }, void 0, false

            )] 
}, void 0, true
          ) 
}, void 0, false
        )] 
}, void 0, true
      ) 
}, void 0, false
    ));

}