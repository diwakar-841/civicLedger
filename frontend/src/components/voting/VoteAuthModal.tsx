import { useState } from "react";
import { Fingerprint, KeyRound, X, BadgeCheck, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";
import { runVoteAuth } from "../../lib/webauthn";
import { apiClient } from "../../lib/apiClient";
import { formatError } from "../../lib/formatError";
import type { VoteTokenResponse } from "../../types/api";
import type { Candidate } from "../../hooks/useElections";

interface VoteAuthModalProps {
  candidate: Candidate;
  onSuccess: (voteToken: string) => void;
  onCancel: () => void;
}

type Tab = "biometric" | "pin";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function VoteAuthModal({
  candidate,
  onSuccess,
  onCancel,
}: VoteAuthModalProps) {
  const [tab, setTab] = useState<Tab>("biometric");
  const [votingPin, setVotingPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBiometric() {
    setError("");
    setLoading(true);
    try {
      const voteToken = await runVoteAuth();
      onSuccess(voteToken);
    } catch (err) {
      setError(formatError(err, "Verification failed — please try again"));
    } finally {
      setLoading(false);
    }
  }

  async function handlePin() {
    if (votingPin.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      const { data } = await apiClient.post<VoteTokenResponse>(
        "/auth/vote/verify-pin",
        {
          pin: votingPin,
        },
      );
      onSuccess(data.voteToken);
    } catch (err) {
      setError(formatError(err, "Incorrect voting PIN — please try again"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        {}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
        />

        {}
        <motion.div
          className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {}
          <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100">
                {tab === "biometric" ? (
                  <Fingerprint className="h-5 w-5 text-gold-600" />
                ) : (
                  <KeyRound className="h-5 w-5 text-gold-600" />
                )}
              </span>
              <h2 className="text-base font-semibold text-navy-900">
                Verify to vote
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

          {}
          <div className="flex border-b border-navy-100">
            <button
              onClick={() => {
                setTab("biometric");
                setError("");
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
                tab === "biometric"
                  ? "border-b-2 border-gold-400 text-gold-600"
                  : "text-navy-400 hover:text-navy-700"
              }`}
            >
              <Fingerprint className="h-3.5 w-3.5" />
              Biometric
            </button>
            <button
              onClick={() => {
                setTab("pin");
                setError("");
                setVotingPin("");
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
                tab === "pin"
                  ? "border-b-2 border-gold-400 text-gold-600"
                  : "text-navy-400 hover:text-navy-700"
              }`}
            >
              <KeyRound className="h-3.5 w-3.5" />
              Voting PIN
            </button>
          </div>

          <div className="p-6 flex flex-col gap-4">
            {}
            <div className="rounded-xl border border-navy-100 bg-navy-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">
                Voting for
              </p>
              <div className="flex items-center gap-3">
                {candidate.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={candidate.name}
                    className="h-12 w-12 rounded-lg object-cover border border-navy-200 flex-shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-navy-200 flex items-center justify-center text-sm font-bold text-navy-700 flex-shrink-0">
                    {initials(candidate.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="font-bold text-navy-900">{candidate.name}</p>
                    {candidate.voterId && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                        <BadgeCheck className="h-3 w-3" />
                        {candidate.voterId}
                      </span>
                    )}
                  </div>
                  {candidate.party && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <Building2 className="h-3 w-3 text-navy-400" />
                      <p className="text-xs text-navy-500">{candidate.party}</p>
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                This action is permanent and cannot be undone. Your vote is
                recorded on the blockchain.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {tab === "biometric" ? (
                <motion.div
                  key="biometric"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col items-center gap-3 rounded-xl border border-navy-100 bg-navy-50 p-5">
                    <Fingerprint className="h-12 w-12 text-navy-400" />
                    <p className="text-center text-sm text-navy-600">
                      Your device will prompt for{" "}
                      <strong>fingerprint or face ID</strong>
                    </p>
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                      {error}
                    </p>
                  )}

                  <Button loading={loading} fullWidth onClick={handleBiometric}>
                    {loading ? "Waiting for biometric…" : "Confirm vote"}
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="pin"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col gap-4"
                >
                  <p className="text-sm text-navy-600">
                    Enter your 6-digit <strong>Voting PIN</strong> to confirm
                    this vote.
                  </p>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-navy-800">
                      Voting PIN
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        pattern="\d*"
                        maxLength={6}
                        value={votingPin}
                        onChange={(e) =>
                          setVotingPin(
                            e.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        placeholder="••••••"
                        autoFocus
                        className="flex-1 rounded-lg border border-navy-200 px-3 py-2.5 text-sm font-mono tracking-widest text-navy-900 placeholder-navy-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPin((v) => !v)}
                        className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg border border-navy-200 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
                        aria-label={showPin ? "Hide PIN" : "Show PIN"}
                      >
                        {showPin ? (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                      {error}
                    </p>
                  )}

                  <Button
                    loading={loading}
                    fullWidth
                    onClick={handlePin}
                    disabled={votingPin.length !== 6}
                  >
                    {loading ? "Verifying…" : "Confirm vote with PIN"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={onCancel}
              className="text-center text-xs text-navy-400 hover:text-navy-600"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
