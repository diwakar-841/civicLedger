import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";
import { TextField } from "../shared/Input";

interface Props {
  electionTitle: string;
  password: string;
  code: string;
  loading: boolean;
  error: string | null;
  onPasswordChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteElectionModal({
  electionTitle,
  password,
  code,
  loading,
  error,
  onPasswordChange,
  onCodeChange,
  onCancel,
  onConfirm,
}: Props) {
  const canSubmit = password.trim().length > 0 && code.trim().length >= 6;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        />

        <motion.div
          className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </span>
              <h2 className="text-base font-semibold text-navy-900">
                Delete election
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold text-red-800">
                You are about to permanently delete "{electionTitle}", including
                all its candidates.
              </p>
              <p className="mt-1 text-xs text-red-700">
                This cannot be undone. Votes already recorded on-chain remain
                part of the blockchain's history, but this election will no
                longer appear anywhere in the app.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-navy-500">
                <ShieldAlert className="h-3.5 w-3.5" />
                Confirm your identity to continue
              </p>
              <TextField
                label="Password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
              />
              <TextField
                label="2FA code"
                type="text"
                inputMode="numeric"
                placeholder="6-digit authenticator code"
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
              />
              {error && (
                <p className="text-xs font-medium text-red-600">{error}</p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button
                fullWidth
                variant="danger"
                onClick={onConfirm}
                loading={loading}
                disabled={!canSubmit}
              >
                Yes, permanently delete
              </Button>
              <Button
                fullWidth
                variant="ghost"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
