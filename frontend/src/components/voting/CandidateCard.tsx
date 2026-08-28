import { CheckCircle2, BadgeCheck, Building2, Info } from "lucide-react";
import { Candidate } from "../../hooks/useElections";

interface Props {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
  onViewDetails: () => void;
  disabled?: boolean;
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
 * A single ballot row.
 *
 * Layout is deliberately split in two:
 *  - LEFT  — the selection control + name/party. This is the "pick this
 *            candidate" click target, so choosing someone is always one
 *            unambiguous tap.
 *  - RIGHT — the candidate's photo, doubling as a "view details" button.
 *            Tapping it never selects/deselects anything — it only opens
 *            the full profile (unique Voter ID, party, qualification,
 *            agenda, bio) so a name alone is never the only thing a voter
 *            has to go on.
 */
export function CandidateCard({ candidate, selected, onSelect, onViewDetails, disabled }: Props) {
  return (
    <div
      className={`flex items-stretch gap-3 rounded-2xl border-2 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
        selected ? "border-indigo-500 bg-indigo-50 shadow-card" : "border-navy-100 bg-white hover:border-indigo-300"
      }`}
    >
      {/* ── LEFT: select control ── click anywhere here to choose this candidate */}
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        aria-pressed={selected}
        className={`focus-ring group flex flex-1 items-center gap-3 rounded-lg p-2 text-left ${
          disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"
        }`}
      >
        {/* Radio-style selection indicator */}
        <span
          className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? "border-indigo-600 bg-indigo-500" : "border-navy-300 bg-white group-hover:border-indigo-400"
          }`}
        >
          {selected && <CheckCircle2 className="h-4 w-4 text-navy-950" />}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-bold leading-tight text-navy-900">{candidate.name}</p>
            {candidate.voterId && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700">
                <BadgeCheck className="h-3 w-3" />
                {candidate.voterId}
              </span>
            )}
          </div>
          {candidate.party && (
            <div className="mt-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 flex-shrink-0 text-navy-400" />
              <p className="truncate text-sm font-medium text-navy-600">{candidate.party}</p>
            </div>
          )}
        </div>
      </button>

      {/* ── RIGHT: photo / info icon — opens full candidate details ── */}
      <button
        type="button"
        onClick={onViewDetails}
        className="focus-ring group relative flex-shrink-0 rounded-xl"
        aria-label={`View details for ${candidate.name}`}
        title="View candidate details"
      >
        {candidate.photoUrl && (
          <img
            src={candidate.photoUrl}
            alt={candidate.name}
            className="h-16 w-16 rounded-xl border-2 border-navy-100 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const sib = (e.target as HTMLImageElement).nextElementSibling as HTMLElement | null;
              if (sib) sib.style.display = "flex";
            }}
          />
        )}
        <div
          style={{ display: candidate.photoUrl ? "none" : "flex" }}
          className={`h-16 w-16 items-center justify-center rounded-xl border-2 text-xl font-bold ${
              selected
              ? "border-indigo-300 bg-indigo-100 text-indigo-700"
              : "border-navy-200 bg-navy-100 text-navy-600"
          }`}
        >
          {initials(candidate.name)}
        </div>
        <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-navy-800 text-white shadow-sm transition-colors group-hover:bg-navy-950">
          <Info className="h-3.5 w-3.5" />
        </span>
      </button>
    </div>
  );
}
