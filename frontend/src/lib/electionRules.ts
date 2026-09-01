import type { Election } from "../hooks/useElections";
import { deriveStatus } from "../hooks/useElections";

type RuleFields = Pick<Election, "startTime" | "endTime">;

export function canDeleteElection(election: RuleFields): boolean {
  const status = deriveStatus(election);
  return status === "draft" || status === "cancelled";
}

export function isCancelled(election: { status?: string | null }): boolean {
  return election.status === "cancelled";
}
