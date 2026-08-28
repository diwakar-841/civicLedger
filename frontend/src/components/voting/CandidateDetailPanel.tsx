import { BadgeCheck, Building2, Info, MousePointerClick, Award, Lightbulb } from "lucide-react";
import { Candidate } from "../../hooks/useElections";
import { Button } from "../shared/Button";

interface Props {
  candidate: Candidate | null;
  onOpenDetails: () => void;
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
 * CandidateDetailPanel — the right-hand side of the ballot.
 *
 * Shows the photo/icon and key facts (unique ID, name, party) for whichever
 * candidate is currently selected on the left. The photo itself is a button —
 * clicking it (or "View full profile") opens CandidateDetailModal with the
 * complete bio / qualification / agenda, so a voter never has to decide based
 * on name alone.
 */
export function CandidateDetailPanel({ candidate, onOpenDetails }: Props) {
  if (!candidate) {
    return (
      <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-navy-200 p-8 text-center">
        <MousePointerClick className="h-8 w-8 text-navy-300" />
        <p className="text-sm font-medium text-navy-500">
          Select a candidate from the list to see their details here
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Photo / icon — click to view full profile */}
      <button
        type="button"
        onClick={onOpenDetails}
        className="focus-ring group relative mx-auto h-32 w-32 overflow-hidden rounded-2xl border-4 border-navy-100 shadow-card transition-transform hover:scale-[1.02]"
        aria-label={`View full details for ${candidate.name}`}
      >
        {candidate.photoUrl ? (
          <img src={candidate.photoUrl} alt={candidate.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-navy-100 text-3xl font-bold text-navy-600">
            {initials(candidate.name)}
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-navy-950/0 text-white opacity-0 transition-all group-hover:bg-navy-950/60 group-hover:opacity-100">
          <Info className="h-4 w-4" />
          <span className="text-xs font-semibold">View details</span>
        </div>
      </button>

      {/* Name + unique ID */}
      <div className="text-center">
        <p className="text-lg font-bold text-navy-900">{candidate.name}</p>
        {candidate.voterId && (
          <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-700">
            <BadgeCheck className="h-3.5 w-3.5" />
            {candidate.voterId}
          </span>
        )}
        {candidate.party && (
          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-navy-400" />
            <p className="text-sm text-navy-600">{candidate.party}</p>
          </div>
        )}
      </div>

      {/* Quick preview of bio / qualification / supports */}
      {(candidate.bio || candidate.qualification || candidate.supports) && (
        <div className="flex flex-col gap-2 rounded-xl border border-navy-100 bg-navy-50 p-3">
          {candidate.bio && (
            <p className="line-clamp-3 text-xs text-navy-600">{candidate.bio}</p>
          )}
          {candidate.qualification && (
            <div className="flex items-start gap-1.5">
              <Award className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold-500" />
              <p className="line-clamp-1 text-xs text-navy-500">{candidate.qualification}</p>
            </div>
          )}
          {candidate.supports && (
            <div className="flex items-start gap-1.5">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
              <p className="line-clamp-1 text-xs text-navy-500">{candidate.supports}</p>
            </div>
          )}
        </div>
      )}

      <Button variant="ghost" size="sm" onClick={onOpenDetails} className="mx-auto">
        <Info className="h-4 w-4" />
        View full profile
      </Button>
    </div>
  );
}
