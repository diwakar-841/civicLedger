/**
 * Human-readable IDs derived from a record's UUID — first 8 hex chars,
 * uppercased, behind a kind-specific prefix. Same convention already used
 * for voter IDs (see useElections' voterId and election.service's
 * searchVoters); this just gives elections and admins the same treatment so
 * everything in the system can be looked up the same way.
 *
 * These are deterministic (no extra DB column needed) and match what the
 * backend computes in election.service.ts (electionDisplayId / adminSearch)
 * — keep the two in sync if this format ever changes.
 */

function toDisplayId(prefix: string, id: string): string {
  return `${prefix}-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export const electionDisplayId = (id: string) => toDisplayId("ELC", id);
export const voterDisplayId = (id: string) => toDisplayId("VTR", id);
export const adminDisplayId = (id: string) => toDisplayId("ADM", id);
