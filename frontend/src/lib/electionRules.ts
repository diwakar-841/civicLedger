import type { Election } from "../hooks/useElections";
import { deriveStatus } from "../hooks/useElections";

type RuleFields = Pick<Election, "startTime" | "endTime">;

/**
 * True once voters can actually see results — either the admin turned live
 * results on, or the scheduled manual release date/time has passed. Mirrors
 * the same check enforced server-side in election.service.ts.
 */
/**
 * Deleting is only allowed before an election has started — i.e. while it's
 * still a draft (not yet scheduled, or scheduled with a start time still in
 * the future). The instant voting opens, the election is locked: it can't be
 * deleted while active, once closed, once decided, or once results are
 * published — none of that matters once it's started. Mirrors the check in
 * election.service.ts's deleteElection.
 */
export function canDeleteElection(election: RuleFields): boolean {
  const status = deriveStatus(election);
  return status === "draft" || status === "cancelled";
}

/**
 * A cancelled election is terminal — no voting, no results, no further admin
 * actions beyond deleting the record.
 */
export function isCancelled(election: { status?: string | null }): boolean {
  return election.status === "cancelled";
}
