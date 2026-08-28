import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

export interface Candidate {
  id: string;
  name: string;
  party: string | null;
  onChainCandidateId: number;
  /** UUID of the registered user this candidate is linked to, or null */
  voterUserId: string | null;
  /** VTR-XXXXXXXX display ID derived from voterUserId, or null */
  voterId: string | null;
  photoUrl: string | null;
  bio: string | null;
  qualification: string | null;
  supports: string | null;
}

export interface Election {
  id: string;
  title: string;
  /** Authoritative lifecycle state from the server: draft | active | closed. */
  status?: "draft" | "active" | "closed" | "cancelled";
  description: string | null;
  /** Null until the admin finishes adding candidates and schedules the vote. */
  startTime: string | null;
  endTime: string | null;
  /** One shared cutoff for sending and responding to nomination requests. */
  nominationDeadline: string | null;
  /** Hidden from the voter-facing election list; admins still see it. */
  isHidden: boolean;
  /** Results option chosen alongside the voting window (see /results-settings). */
  liveResultsEnabled: boolean;
  /** Manual results release date/time, or null when live results are used instead. */
  resultsReleaseAt: string | null;
  /** Set the moment results actually became visible to voters (live toggle or release date passing). */
  resultsPublishedAt: string | null;
  candidates?: Candidate[];
}

/**
 * Lifecycle state of an election.
 *
 * The server's `status` column is authoritative: an election only becomes
 * "active" once an admin explicitly opened voting AND the scheduler verified
 * the eligibility rules (≥ 2 accepted candidates with completed profiles).
 * Times alone are never enough — a scheduled window whose start has passed
 * stays a draft until the server activates it, so the UI can no longer claim
 * "voting has started" on its own.
 */
export function deriveStatus(
  election: Pick<Election, "startTime" | "endTime"> & { status?: string | null }
): "draft" | "active" | "closed" | "cancelled" {
  // A cancelled election is terminal: no voting ever happens, whatever the
  // times say.
  if (election.status === "cancelled") return "cancelled";
  if (!election.startTime || !election.endTime) return "draft";

  const now = Date.now();
  const start = new Date(election.startTime).getTime();
  const end = new Date(election.endTime).getTime();

  if (election.status === "closed") return "closed";
  if (election.status === "active") {
    if (now > end) return "closed";
    // Guard against a stale/incorrect "active" row: voting can never be open
    // before its own start time.
    return now < start ? "draft" : "active";
  }
  // status is "draft" (or unknown): only the time window can close it out.
  if (election.status === "draft") return now > end ? "closed" : "draft";

  if (now < start) return "draft";
  if (now > end) return "closed";
  return "active";
}

export function useElections() {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<Election[]>("/elections");
      setElections(data);
    } catch {
      setError("Could not load elections. Please refresh and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { elections, loading, error, refetch };
}

export function useElection(id: string | undefined) {
  const [election, setElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<Election>(`/elections/${id}`);
      setElection(data);
    } catch {
      setError("Could not load this election.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { election, loading, error, refetch };
}
