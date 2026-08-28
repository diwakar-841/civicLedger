/**
 * RegisterCompletePage — reached after the user's Gmail is verified by OTP or link.
 *
 * URL: /register/complete?token=<setPasswordToken>
 *
 * The token is a short-lived JWT (purpose: "reg-setpwd") returned after the
 * user verifies their Gmail by OTP or the 24-hour email verification link. This page lets the user
 * create their login credentials; phone verification happens after sign-in.
 */
import { useState, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Eye, EyeOff, ShieldCheck, Copy, Check, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { apiClient } from "../lib/apiClient";
import { useToast } from "../contexts/ToastContext";
import { formatError } from "../lib/formatError";
import type { RegistrationCompleteResponse } from "../types/api";

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  autoComplete?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-navy-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type={show ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 rounded-lg border border-navy-200 px-3 py-2.5 text-sm text-navy-900 placeholder-navy-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20
            [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
        />
        <button
          type="button"
          onClick={onToggle}
          className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg border border-navy-200 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="text-xs text-navy-400">{hint}</p>}
    </div>
  );
}

export function RegisterCompletePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { show } = useToast();

  const setPasswordToken = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voterId, setVoterId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // If no token in URL, show error state
  const hasToken = Boolean(setPasswordToken);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!hasToken) return;
    if (password !== confirm) { show("Passwords do not match", "error"); return; }

    setLoading(true);
    try {
      const { data } = await apiClient.post<RegistrationCompleteResponse>(
        "/auth/register/set-password",
        { setPasswordToken, password }
      );
      // Don't navigate away immediately — show the voter their unique ID first,
      // since it's the one thing that tells them apart from anyone sharing
      // their name, and this is the only time it's handed to them directly.
      setVoterId(data.voterId);
    } catch (err) {
      show(formatError(err, "Could not set password — the link may have expired"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyVoterId() {
    if (!voterId) return;
    try {
      await navigator.clipboard.writeText(voterId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard may be unavailable — no-op, the ID is still visible on screen
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" />
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Header */}
          <div className="mb-8 flex flex-col items-center text-center">
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25">
              {voterId ? (
                <BadgeCheck className="h-7 w-7" />
              ) : hasToken ? (
                <KeyRound className="h-7 w-7" />
              ) : (
                <ShieldCheck className="h-7 w-7" />
              )}
            </span>
            <h1 className="text-2xl font-extrabold text-navy-900">
              {voterId ? "Password created" : hasToken ? "Create your password" : "Invalid link"}
            </h1>
            <p className="mt-1.5 max-w-sm text-sm text-navy-500">
              {voterId
                ? "Sign in next to verify your phone and finish setup."
                : hasToken
                ? "Choose a strong password. You'll verify your phone next."
                : "This link is invalid or has expired. Please start registration again."}
            </p>
          </div>

          {voterId ? (
            <Card className="p-6 sm:p-8">
              <div className="flex flex-col items-center gap-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">
                  Your unique Voter ID
                </p>
                <div className="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-gold-300 bg-gold-50 px-4 py-3">
                  <span className="font-mono text-lg font-bold tracking-wider text-navy-900">
                    {voterId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyVoterId}
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-navy-200 bg-white text-navy-500 hover:bg-navy-50 hover:text-navy-800"
                    aria-label="Copy Voter ID"
                  >
                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-sm text-navy-500">Your Voter ID is unique — keep it handy.</p>
                <Button fullWidth className="mt-2" onClick={() => navigate("/login")}>
                  Sign in to verify your phone
                </Button>
              </div>
            </Card>
          ) : hasToken ? (
            <Card className="p-6 sm:p-8">
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <PasswordField
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  show={showPwd}
                  onToggle={() => setShowPwd((v) => !v)}
                  autoComplete="new-password"
                  hint="At least 10 characters, with uppercase, lowercase and a number"
                />
                <PasswordField
                  label="Confirm password"
                  value={confirm}
                  onChange={setConfirm}
                  show={showPwd}
                  onToggle={() => setShowPwd((v) => !v)}
                  autoComplete="new-password"
                />
                {confirm && password !== confirm && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
                <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  className="mt-2"
                  disabled={!password || !confirm || password !== confirm}
                >
                  Create account
                </Button>
              </form>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <p className="mb-4 text-sm text-navy-500">
                Verification links expire after 24 hours.
              </p>
              <Link
                to="/register"
                className="inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Start registration again
              </Link>
            </Card>
          )}

          <p className="mt-4 text-center text-sm text-navy-400">
            Already registered?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
