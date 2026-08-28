/**
 * AdminAuthModal
 *
 * Step-up confirmation modal for sensitive admin actions (e.g. creating an
 * election). The admin proves identity with either:
 *   • Biometric  — reuses the existing /auth/vote/challenge + /auth/vote/verify
 *                  flow (no new backend routes).
 *   • Login PIN  — calls POST /auth/session-pin (requireAuth) which verifies
 *                  the 6-digit loginPinHash stored on the user record.
 *
 * Usage:
 *   <AdminAuthModal
 *     open={showModal}
 *     title="Confirm election creation"
 *     description="Send nomination requests to 3 candidates and schedule the election."
 *     onConfirm={() => { /* do the action *\/ }}
 *     onClose={() => setShowModal(false)}
 *   />
 */

import { useState } from "react";
import { ShieldCheck, Fingerprint, KeyRound, X, AlertCircle } from "lucide-react";
import { runAdminBiometricAuth } from "../../lib/webauthn";
import { apiClient } from "../../lib/apiClient";
import { Button } from "../shared/Button";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  /** Called after the admin successfully authenticates. */
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

type Tab = "biometric" | "pin";

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminAuthModal({
  open,
  title = "Confirm action",
  description,
  onConfirm,
  onClose,
}: Props) {
  const [tab, setTab] = useState<Tab>("biometric");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setPin("");
    setError(null);
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleBiometric() {
    setError(null);
    setLoading(true);
    try {
      // Reuses the existing /auth/vote/challenge + /auth/vote/verify endpoints.
      // The returned voteToken is discarded — we only need the biometric prompt.
      await runAdminBiometricAuth();
      await onConfirm();
      handleClose();
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? "Biometric authentication failed";
      // WebAuthn cancelled by user — show a softer message
      if (
        msg.includes("NotAllowedError") ||
        msg.toLowerCase().includes("cancelled") ||
        msg.toLowerCase().includes("not allowed")
      ) {
        setError("Authentication cancelled — please try again.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePin() {
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      // POST /auth/session-pin — requireAuth, body: { pin }
      await apiClient.post("/auth/session-pin", { pin });
      await onConfirm();
      handleClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "PIN verification failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl dark:bg-navy-900 sm:rounded-2xl">

        {/* Close button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="mb-5 flex items-start gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-500 dark:bg-gold-400/10">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h2>
            {description && (
              <p className="mt-0.5 text-sm text-gray-500 dark:text-navy-300">{description}</p>
            )}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="mb-5 flex rounded-xl border border-gray-200 p-1 dark:border-navy-700">
          <TabBtn
            icon={<Fingerprint className="h-4 w-4" />}
            label="Biometric"
            active={tab === "biometric"}
            onClick={() => { setTab("biometric"); reset(); }}
          />
          <TabBtn
            icon={<KeyRound className="h-4 w-4" />}
            label="Login PIN"
            active={tab === "pin"}
            onClick={() => { setTab("pin"); reset(); }}
          />
        </div>

        {/* ── Biometric tab ─────────────────────────────────────────── */}
        {tab === "biometric" && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-gray-50 py-8 dark:bg-navy-800">
              <Fingerprint className="h-14 w-14 text-navy-400 dark:text-navy-300" strokeWidth={1.25} />
              <p className="text-center text-sm text-gray-500 dark:text-navy-300">
                Tap below — your device will prompt for{" "}
                <strong className="text-gray-700 dark:text-white">fingerprint or face ID</strong>
              </p>
            </div>

            {error && <ErrorBanner message={error} />}

            <Button
              onClick={handleBiometric}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Waiting for biometric…" : "Confirm with biometric"}
            </Button>
            <button
              type="button"
              onClick={handleClose}
              className="text-center text-sm text-gray-500 hover:text-gray-700 dark:text-navy-400 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {/* ── Login PIN tab ──────────────────────────────────────────── */}
        {tab === "pin" && (
          <div className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-navy-200">
                Enter your 6-digit Login PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPin(v);
                  setError(null);
                }}
                onKeyDown={(e) => { if (e.key === "Enter" && pin.length === 6) handlePin(); }}
                placeholder="••••••"
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-2xl tracking-widest text-gray-900 shadow-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 dark:border-navy-600 dark:bg-navy-800 dark:text-white dark:placeholder-navy-400"
                autoFocus
                disabled={loading}
              />
              <p className="mt-1.5 text-xs text-gray-400 dark:text-navy-400">
                This is the same PIN you use to log in.
              </p>
            </div>

            {error && <ErrorBanner message={error} />}

            <Button
              onClick={handlePin}
              disabled={loading || pin.length !== 6}
              className="w-full"
            >
              {loading ? "Verifying…" : "Confirm with PIN"}
            </Button>
            <button
              type="button"
              onClick={handleClose}
              className="text-center text-sm text-gray-500 hover:text-gray-700 dark:text-navy-400 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TabBtn({
  icon, label, active, onClick,
}: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
        active
          ? "bg-gold-400 text-navy-950 shadow-sm"
          : "text-gray-500 hover:text-gray-700 dark:text-navy-400 dark:hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}
