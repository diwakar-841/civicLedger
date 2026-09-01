import { deriveStatus } from "../hooks/useElections";

export function canDeleteElection(election) {
  const status = deriveStatus(election);
  return status === "draft" || status === "cancelled";
}

export function isCancelled(election) {
  return election.status === "cancelled";
}