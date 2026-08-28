import { useState, useCallback, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

export interface ElectionNominationRequest {
  id: string;
  electionId: string;
  userId: string;
  candidateName: string | null;
  status: "pending" | "accepted" | "rejected" | "expired";
  expiresAt: string;
  respondedAt: string | null;
  profileCompletedAt: string | null;
  createdAt: string;
}

export function useCreateElection() {
  const [loading, setLoading] = useState(false);

  async function createElection(input: { title: string; description?: string; electionType?: "public" | "group"; groupId?: string }) {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/elections", input);
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { createElection, loading };
}

/**
 * Final step of election setup — sets the timing.
 *
 * nominationDeadline:
 *   Set when using the nomination-invite flow. Candidates are sent requests
 *   and must accept before voting opens. Every nominee shares this one
 *   election-wide deadline. The backend skips the "≥2 direct
 *   candidates" check and the scheduler enforces it at activation time.
 *   Must be ≤ startTime.
 *
 * startTime / endTime:
 *   The voting window. startTime ≥ nominationDeadline.
 *   Window must be ≥ 10 minutes long.
 */
export function useScheduleElection() {
  const [loading, setLoading] = useState(false);

  async function scheduleElection(
    electionId: string,
    input: {
      nominationDeadline?: string;
      startTime?: string;
      endTime?: string;
    }
  ) {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (input.startTime) body.startTime = input.startTime;
      if (input.endTime) body.endTime = input.endTime;
      // Include the one shared deadline for the nomination flow.
      if (input.nominationDeadline) {
        body.nominationDeadline = input.nominationDeadline;
      }
      const { data } = await apiClient.post(`/elections/${electionId}/schedule`, body);
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { scheduleElection, loading };
}

/** Admin-only nomination flow. Candidate details are never accepted here. */
export function useCreateNominationRequest() {
  const [loading, setLoading] = useState(false);

  async function createRequest(electionId: string, userId: string) {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/candidate-requests", {
        electionId,
        userId,
      });
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { createRequest, loading };
}

/** Save the one election-wide deadline shared by every nomination request. */
export function useSetNominationDeadline() {
  const [loading, setLoading] = useState(false);

  async function setNominationDeadline(electionId: string, deadline: string) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/admin/elections/${electionId}/set-nomination-deadline`, {
        deadline,
      });
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { setNominationDeadline, loading };
}

/** Admin view of every nomination request for one election, including history. */
export function useElectionNominationRequests(electionId: string | undefined) {
  const [requests, setRequests] = useState<ElectionNominationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!electionId) {
      setRequests([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<ElectionNominationRequest[]>(
        `/candidate-requests/election/${electionId}`
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load nomination requests.");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { requests, loading, error, refetch };
}

/** Hide/unhide an election from the voter-facing election list. Reversible anytime. */
export function useSetElectionVisibility() {
  const [loading, setLoading] = useState(false);

  async function setVisibility(electionId: string, hidden: boolean) {
    setLoading(true);
    try {
      const { data } = await apiClient.patch(`/elections/${electionId}/visibility`, { hidden });
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { setVisibility, loading };
}

/** Toggle live results on/off for voters. */
/**
 * Permanently deletes an election. Requires the admin's password + current
 * 2FA code (step-up auth) — the backend re-verifies both before anything
 * is removed. Cannot be undone.
 */
export function useDeleteElection() {
  const [loading, setLoading] = useState(false);

  async function deleteElection(electionId: string, password: string, code: string) {
    setLoading(true);
    try {
      const { data } = await apiClient.delete(`/elections/${electionId}`, {
        data: { password, code },
      });
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { deleteElection, loading };
}

export interface VoterSearchResult {
  id: string;
  fullName: string;
  /** VTR-XXXXXXXX display ID */
  voterId: string;
  walletLinked: boolean;
  /** Verified voter's profile photo, if they've set one — null falls back to initials in the UI. */
  photoUrl: string | null;
}

/**
 * Search registered voters by name or voter ID.
 * Used by the admin UI to pick a real registered user as a candidate —
 * prevents admins from adding fictitious names like "xx", "yy".
 */
export function useVoterSearch() {
  const [results, setResults] = useState<VoterSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.get<VoterSearchResult[]>(
        `/elections/search-voters?q=${encodeURIComponent(query.trim())}`
      );
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
  }, []);

  return { results, loading, search, clear };
}

// ── Candidate allowance & voting-start workflow ──────────────────────────────

export type CandidateResponseStatus = "accepted" | "rejected" | "no_response";

export interface CandidateResponse {
  requestId: string;
  userId: string;
  name: string;
  status: CandidateResponseStatus;
  rawStatus: "pending" | "accepted" | "rejected" | "expired";
  respondedAt: string | null;
  profileCompletedAt: string | null;
  /** When the single allowed nomination reminder was sent, or null. */
  reminderSentAt: string | null;
}

export interface NominationStatus {
  electionId: string;
  title: string;
  status: string;
  nominationDeadline: string | null;
  startTime: string | null;
  endTime: string | null;
  allowanceEnded: boolean;
  /** End of the 24-hour admin decision window, once the allowance period has ended. Null while it's still active. */
  adminWindowEndsAt: string | null;
  totalInvited: number;
  acceptedCount: number;
  rejectedCount: number;
  noResponseCount: number;
  profileCompletedCount: number;
  candidates: CandidateResponse[];
  case: "A" | "B" | "C" | "D" | "E" | "OPEN" | "NO_REQUESTS";
  canStartVoting: boolean;
  canExtendAllowance: boolean;
  canCloseElection: boolean;
  /** Nominees who never responded and haven't been reminded yet. */
  remindableCount: number;
  /** True once every no-response nominee already got their one reminder. */
  remindersAlreadySent: boolean;
  /** Reminders are allowed only while the allowance runs and someone is still remindable. */
  canSendReminders: boolean;
  recommendationTitle: string;
  recommendation: string;
  rules: {
    minAcceptedCandidates: number;
    minAllowanceMinutes: number;
    minGapMinutes: number;
    minVotingMinutes: number;
    minExtensionMinutes: number;
    maxExtensionMinutes: number;
  };
}

/**
 * Full candidate-allowance outcome for one election: per-candidate responses,
 * the matching workflow case (A–E) and which admin actions are permitted.
 */
export function useNominationStatus(electionId: string | undefined) {
  const [status, setStatus] = useState<NominationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!electionId) {
      setStatus(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<NominationStatus>(
        `/admin/elections/${electionId}/nomination-status`
      );
      setStatus(data);
    } catch {
      setError("Could not load the election status.");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { status, loading, error, refetch };
}

/** Start voting immediately. Backend refuses with fewer than 2 accepted candidates. */
export function useStartVoting() {
  const [loading, setLoading] = useState(false);

  async function startVoting(
    electionId: string,
    input: {
      startTime: string;
      endTime: string;
      /** How results are revealed to voters. Defaults to "live" server-side if omitted. */
      resultsMode?: "live" | "manual";
      /** Required when resultsMode is "manual" — must be after endTime. */
      resultsReleaseAt?: string;
    }
  ) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/admin/elections/${electionId}/start-voting`, input);
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { startVoting, loading };
}

/**
 * Change how results are revealed after the voting window already exists —
 * switch to live, or set/extend the manual release date. Works whether
 * voting is scheduled, currently open, or already closed.
 */
export function useUpdateResultsSettings() {
  const [loading, setLoading] = useState(false);

  async function updateResultsSettings(
    electionId: string,
    input: { mode: "live" } | { mode: "manual"; resultsReleaseAt: string }
  ) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        `/admin/elections/${electionId}/results-settings`,
        input
      );
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { updateResultsSettings, loading };
}

/**
 * Extend the candidate allowance period by `minutes` (10 … 1440).
 * Only candidates who never responded are given more time; the voting window slides
 * automatically to keep the required gap.
 */
export function useExtendAllowance() {
  const [loading, setLoading] = useState(false);

  async function extendAllowance(electionId: string, minutes: number) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/admin/elections/${electionId}/extend-allowance`, {
        minutes,
      });
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { extendAllowance, loading };
}

/** Close/cancel a draft election that can no longer produce a valid ballot. */
export function useCloseDraftElection() {
  const [loading, setLoading] = useState(false);

  async function closeDraft(electionId: string) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/admin/elections/${electionId}/close-draft`, {});
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { closeDraft, loading };
}
