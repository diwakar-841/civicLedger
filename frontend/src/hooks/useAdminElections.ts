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

  async function createElection(input: {
    title: string;
    description?: string;
    electionType?: "public" | "group";
    groupId?: string;
  }) {
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

export function useScheduleElection() {
  const [loading, setLoading] = useState(false);

  async function scheduleElection(
    electionId: string,
    input: {
      nominationDeadline?: string;
      startTime?: string;
      endTime?: string;
    },
  ) {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (input.startTime) body.startTime = input.startTime;
      if (input.endTime) body.endTime = input.endTime;

      if (input.nominationDeadline) {
        body.nominationDeadline = input.nominationDeadline;
      }
      const { data } = await apiClient.post(
        `/elections/${electionId}/schedule`,
        body,
      );
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { scheduleElection, loading };
}

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

export function useSetNominationDeadline() {
  const [loading, setLoading] = useState(false);

  async function setNominationDeadline(electionId: string, deadline: string) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        `/admin/elections/${electionId}/set-nomination-deadline`,
        {
          deadline,
        },
      );
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { setNominationDeadline, loading };
}

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
        `/candidate-requests/election/${electionId}`,
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

export function useSetElectionVisibility() {
  const [loading, setLoading] = useState(false);

  async function setVisibility(electionId: string, hidden: boolean) {
    setLoading(true);
    try {
      const { data } = await apiClient.patch(
        `/elections/${electionId}/visibility`,
        { hidden },
      );
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { setVisibility, loading };
}

export function useDeleteElection() {
  const [loading, setLoading] = useState(false);

  async function deleteElection(
    electionId: string,
    password: string,
    code: string,
  ) {
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

  voterId: string;
  walletLinked: boolean;

  photoUrl: string | null;
}

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
        `/elections/search-voters?q=${encodeURIComponent(query.trim())}`,
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

export type CandidateResponseStatus = "accepted" | "rejected" | "no_response";

export interface CandidateResponse {
  requestId: string;
  userId: string;
  name: string;
  status: CandidateResponseStatus;
  rawStatus: "pending" | "accepted" | "rejected" | "expired";
  respondedAt: string | null;
  profileCompletedAt: string | null;

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

  remindableCount: number;

  remindersAlreadySent: boolean;

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
        `/admin/elections/${electionId}/nomination-status`,
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

export function useStartVoting() {
  const [loading, setLoading] = useState(false);

  async function startVoting(
    electionId: string,
    input: {
      startTime: string;
      endTime: string;

      resultsMode?: "live" | "manual";

      resultsReleaseAt?: string;
    },
  ) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        `/admin/elections/${electionId}/start-voting`,
        input,
      );
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { startVoting, loading };
}

export function useUpdateResultsSettings() {
  const [loading, setLoading] = useState(false);

  async function updateResultsSettings(
    electionId: string,
    input: { mode: "live" } | { mode: "manual"; resultsReleaseAt: string },
  ) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        `/admin/elections/${electionId}/results-settings`,
        input,
      );
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { updateResultsSettings, loading };
}

export function useExtendAllowance() {
  const [loading, setLoading] = useState(false);

  async function extendAllowance(electionId: string, minutes: number) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        `/admin/elections/${electionId}/extend-allowance`,
        {
          minutes,
        },
      );
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { extendAllowance, loading };
}

export function useCloseDraftElection() {
  const [loading, setLoading] = useState(false);

  async function closeDraft(electionId: string) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        `/admin/elections/${electionId}/close-draft`,
        {},
      );
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { closeDraft, loading };
}
