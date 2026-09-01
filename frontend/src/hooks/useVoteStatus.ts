import { useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

export interface VoteStatusVote {
  candidateId: string;
  candidateName: string;
  candidateParty: string | null;
  txHash: string;
  blockNumber: number;
  votedAt: string;
}

export interface VoteStatus {
  hasVoted: boolean;
  vote?: VoteStatusVote;
}

export function useVoteStatus(electionId: string | undefined) {
  const [status, setStatus] = useState<VoteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (!electionId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient
      .get(`/votes/my-vote/${electionId}`)
      .then(({ data }) => {
        if (!cancelled) setStatus(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [electionId]);

  return { status, loading, error };
}
