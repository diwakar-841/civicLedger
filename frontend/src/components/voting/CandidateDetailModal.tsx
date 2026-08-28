import { X, BadgeCheck, Building2, Award, Lightbulb, CheckCircle2, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";
import type { Candidate } from "../../hooks/useElections";

interface CandidateDetailsModalProps {
  candidate: Candidate;
  onClose: () => void;
  /** Voter ballot flow (default): lets the voter select this candidate. */
  selected?: boolean;
  onSelect?: () => void;
  disabled?: boolean;
  /**
   * Admin/read-only view (e.g. Manage Candidates after voting has started):
   * hides the "Choose this candidate" action entirely and surfaces the
   * on-chain candidate id, since there's nothing to select — this is just
   * a details lookup.
   */
  readOnly?: boolean;
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
 * Full candidate profile — reached by tapping the photo/info icon on a
 * CandidateCard. Shows everything the ballot list keeps compact: the photo,
 * the candidate's unique Voter ID (so name alone never causes confusion),
 * party/team, qualification and agenda. Selecting can be done from here too,
 * so viewing details and choosing a candidate are part of the same flow.
 */
export function CandidateDetailsModal({
  candidate,
  selected = false,
  onSelect,
  onClose,
  disabled,
  readOnly = false,
}: CandidateDetailsModalProps) {
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
          {/* Header */}
          <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
            <h2 className="text-base font-semibold text-navy-900">Candidate details</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-col gap-4 p-6">
            {/* Photo + name + unique ID */}
            <div className="flex flex-col items-center gap-3 text-center">
              {candidate.photoUrl ? (
                <img
                  src={candidate.photoUrl}
                  alt={candidate.name}
                  className="h-24 w-24 rounded-2xl border-2 border-navy-100 object-cover"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-navy-200 bg-navy-100 text-3xl font-bold text-navy-600">
                  {initials(candidate.name)}
                </div>
              )}

              <div>
                <p className="text-lg font-bold text-navy-900">{candidate.name}</p>
                {candidate.voterId && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="h-3 w-3" />
                    {candidate.voterId}
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="flex flex-col gap-3 rounded-xl border border-navy-100 bg-navy-50 p-4">
              {candidate.party && (
                <div className="flex items-start gap-2">
                  <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-navy-400" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Team / Party</p>
                    <p className="text-sm text-navy-700">{candidate.party}</p>
                  </div>
                </div>
              )}

              {candidate.qualification && (
                <div className="flex items-start gap-2">
                  <Award className="mt-0.5 h-4 w-4 flex-shrink-0 text-gold-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Qualification</p>
                    <p className="text-sm text-navy-700">{candidate.qualification}</p>
                  </div>
                </div>
              )}

              {candidate.supports && (
                <div className="flex items-start gap-2">
                  <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Agenda</p>
                    <p className="text-sm text-navy-700">{candidate.supports}</p>
                  </div>
                </div>
              )}

              {readOnly && (
                <div className="flex items-start gap-2">
                  <Hash className="mt-0.5 h-4 w-4 flex-shrink-0 text-navy-400" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">On-chain ID</p>
                    <p className="text-sm text-navy-700">#{candidate.onChainCandidateId}</p>
                  </div>
                </div>
              )}

              {candidate.bio && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">About</p>
                  <p className="text-sm text-navy-700">{candidate.bio}</p>
                </div>
              )}

              {!candidate.party && !candidate.qualification && !candidate.supports && !candidate.bio && (
                <p className="text-sm text-navy-400">No additional details provided for this candidate.</p>
              )}
            </div>

            {!readOnly && (
              <Button
                fullWidth
                variant={selected ? "secondary" : "primary"}
                disabled={disabled}
                onClick={onSelect}
              >
                {selected ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Selected — choose this candidate
                  </>
                ) : (
                  "Choose this candidate"
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
