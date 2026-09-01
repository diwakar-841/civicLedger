import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

export interface Candidate {
  id: string;
  name: string;
  party: string | null;
  onChainCandidateId: number;

  voterUserId: string | null;

  voterId: string | null;
  photoUrl: string | null;
  bio: string | null;
  qualification: string | null;
  supports: string | null;
}

export interface Election {
  id: string;
  title: string;

  status?: "draft" | "active" | "closed" | "cancelled";
  description: string | null;

  startTime: string | null;
  endTime: string | null;

  nominationDeadline: string | null;

  isHidden: boolean;

  liveResultsEnabled: boolean;

  resultsReleaseAt: string | null;

  resultsPublishedAt: string | null;
  candidates?: Candidate[];
}

export function deriveStatus(
  election: Pick<Election, "startTime" | "endTime"> & {
    status?: string | null;
  },
): "draft" | "active" | "closed" | "cancelled" {
  if (election.status === "cancelled") return "cancelled";
  if (!election.startTime || !election.endTime) return "draft";

  const now = Date.now();
  const start = new Date(election.startTime).getTime();
  const end = new Date(election.endTime).getTime();

  if (election.status === "closed") return "closed";
  if (election.status === "active") {
    if (now > end) return "closed";

    return now < start ? "draft" : "active";
  }

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
