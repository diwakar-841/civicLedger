import { X, BadgeCheck, UserPlus, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";
import type { VoterSearchResult } from "../../hooks/useAdminElections";

interface VoterDetailModalProps {
  voter: VoterSearchResult;
  onClose: () => void;

  onAdd?: () => void;
  alreadyAdded?: boolean;
}

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * Quick-look details for a verified voter turned up by the candidate search —
 * reached by tapping their avatar in the search dropdown. Lets the admin
 * confirm they've got the right person (photo, full voter ID, wallet status)
 * before adding them, without leaving the wizard.
 */
export function VoterDetailModal({
  voter,
  onClose,
  onAdd,
  alreadyAdded,
}: VoterDetailModalProps) {
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {}
          <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
            <h2 className="text-base font-semibold text-navy-900">
              Voter details
            </h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-6">
            {}
            <div className="flex flex-col items-center gap-3 text-center">
              {voter.photoUrl ? (
                <img
                  src={voter.photoUrl}
                  alt={voter.fullName}
                  className="h-24 w-24 rounded-2xl border-2 border-navy-100 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-navy-200 bg-navy-100 text-3xl font-bold text-navy-600">
                  {initials(voter.fullName)}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-navy-900">
                  {voter.fullName}
                </p>
                <p className="mt-0.5 flex items-center justify-center gap-1 font-mono text-xs text-navy-500">
                  <Hash className="h-3 w-3" />
                  {voter.voterId}
                </p>
              </div>
            </div>

            {}
            <div className="flex items-center justify-center gap-2">
              {voter.walletLinked ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Wallet linked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-500">
                  No wallet linked yet
                </span>
              )}
            </div>

            {}
            {onAdd && (
              <Button fullWidth onClick={onAdd} disabled={alreadyAdded}>
                <UserPlus className="h-4 w-4" />
                {alreadyAdded ? "Already added" : "Add as candidate"}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
