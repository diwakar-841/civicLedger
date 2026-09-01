import { useState } from "react";
import { ShieldCheck, Fingerprint, KeyRound, X, AlertCircle } from "lucide-react";
import { runAdminBiometricAuth } from "../../lib/webauthn";
import { apiClient } from "../../lib/apiClient";
import { Button } from "../shared/Button";

interface Props {
  open: boolean;
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

type Tab = "biometric" | "pin";

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
      await runAdminBiometricAuth();
      await onConfirm();
      handleClose();
    } catch (err: any) {
      const msg: string = err?.response?.data?.message ?? err?.message ?? "Biometric authentication failed";
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
      await apiClient.post("/auth/session-pin", { pin });
      await onConfirm();
      handleClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? err?.message ?? "PIN verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl dark:bg-navy-900 sm:rounded-2xl">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

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
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••••"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-center text-lg font-bold tracking-widest text-gray-900 outline-none focus:border-gold-400 focus:ring-1 focus:ring-gold-400 dark:border-navy-700 dark:bg-navy-800 dark:text-white"
              />
            </div>

            {error && <ErrorBanner message={error} />}

            <Button
              onClick={handlePin}
              disabled={loading || pin.length !== 6}
              className="w-full"
            >
              {loading ? "Verifying PIN…" : "Confirm with PIN"}
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

function TabBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
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

