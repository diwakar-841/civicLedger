import { AlertTriangle, BadgeCheck, Building2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";
import { Candidate } from "../../hooks/useElections";

interface Props {
  candidate: Candidate;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Returns up-to-2-letter initials from a full name, e.g. "Rahul Sharma" → "RS" */
function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * ConfirmVoteModal — the "are you sure?" step shown right after the voter
 * taps "Cast my vote", before biometric/PIN verification even starts.
 *
 * Its only job is to make the choice unmistakable and to warn, explicitly,
 * that the vote can never be changed once submitted.
 */
export function ConfirmVoteModal({ candidate, onConfirm, onCancel }: Props) {
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
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </span>
              <h2 className="text-base font-semibold text-navy-900">Confirm your vote</h2>
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
            <p className="text-sm text-navy-600">
              Please check carefully — this is who you're about to vote for:
            </p>

            {/* Candidate summary */}
            <div className="flex items-center gap-3 rounded-xl border border-navy-100 bg-navy-50 p-3">
              {candidate.photoUrl ? (
                <img
                  src={candidate.photoUrl}
                  alt={candidate.name}
                  className="h-14 w-14 flex-shrink-0 rounded-lg border border-navy-200 object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-navy-200 text-base font-bold text-navy-700">
                  {initials(candidate.name)}
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-navy-900">{candidate.name}</p>
                {candidate.voterId && (
                  <span className="mt-0.5 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-mono font-semibold text-emerald-700">
                    <BadgeCheck className="h-3 w-3" />
                    {candidate.voterId}
                  </span>
                )}
                {candidate.party && (
                  <div className="mt-1 flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-navy-400" />
                    <p className="text-xs text-navy-500">{candidate.party}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Explicit warning */}
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold text-red-800">
                Once you submit, your vote cannot be changed, edited, or withdrawn — for
                any reason.
              </p>
              <p className="mt-1 text-xs text-red-700">
                Make sure this is the candidate you intend to vote for before continuing.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row-reverse">
              <Button fullWidth onClick={onConfirm}>
                Yes, this is who I'm voting for
              </Button>
              <Button fullWidth variant="ghost" onClick={onCancel}>
                Go back
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
