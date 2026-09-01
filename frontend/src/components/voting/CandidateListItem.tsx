import { CheckCircle2, BadgeCheck } from "lucide-react";
import { Candidate } from "../../hooks/useElections";

interface Props {
  candidate: Candidate;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
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
 * CandidateListItem — one row in the left-hand "choose a candidate" list.
 *
 * Deliberately compact: just enough to tell candidates apart (photo, name,
 * unique voter ID, party) and select one. Full details live in
 * CandidateDetailPanel / CandidateDetailModal on the right, so a duplicate
 * name never gets confused with the wrong person — the unique ID always
 * travels with the name.
 */
export function CandidateListItem({
  candidate,
  selected,
  onSelect,
  disabled,
}: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={selected}
      className={`focus-ring group flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-150 ${
        selected
          ? "border-gold-400 bg-gold-50 shadow-card"
          : "border-navy-100 bg-white hover:border-navy-300 hover:shadow-card"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      {}
      <div className="relative flex-shrink-0">
        {candidate.photoUrl ? (
          <img
            src={candidate.photoUrl}
            alt={candidate.name}
            className="h-11 w-11 rounded-lg border-2 border-navy-100 object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              const sib = (e.target as HTMLImageElement)
                .nextElementSibling as HTMLElement | null;
              if (sib) sib.style.display = "flex";
            }}
          />
        ) : null}
        <div
          style={{ display: candidate.photoUrl ? "none" : "flex" }}
          className={`h-11 w-11 items-center justify-center rounded-lg border-2 text-sm font-bold ${
            selected
              ? "border-gold-300 bg-gold-100 text-gold-700"
              : "border-navy-200 bg-navy-100 text-navy-600"
          }`}
        >
          {initials(candidate.name)}
        </div>
      </div>

      {}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-navy-900">
          {candidate.name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
          {candidate.voterId && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-700">
              <BadgeCheck className="h-2.5 w-2.5" />
              {candidate.voterId}
            </span>
          )}
          {candidate.party && (
            <span className="truncate text-xs text-navy-500">
              {candidate.party}
            </span>
          )}
        </div>
      </div>

      {}
      <div
        className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? "border-gold-500 bg-gold-400" : "border-navy-200 bg-white"
        }`}
      >
        {selected && <CheckCircle2 className="h-3.5 w-3.5 text-navy-950" />}
      </div>
    </button>
  );
}
