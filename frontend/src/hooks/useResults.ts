import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../lib/apiClient";

export interface ResultRow {
  candidateId: string;
  name: string;
  party: string | null;
  votes: number;
}

interface ResultsResponse {
  resultsAvailable: boolean;
  message?: string;
  rows?: ResultRow[];
}

export function useResults(electionId: string | undefined) {
  const [results, setResults] = useState<ResultRow[]>([]);

  const [resultsAvailable, setResultsAvailable] = useState(true);
  const [unavailableMessage, setUnavailableMessage] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!electionId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<ResultsResponse>(
        `/results/${electionId}`,
      );
      setResultsAvailable(data.resultsAvailable);
      setUnavailableMessage(
        data.resultsAvailable
          ? null
          : (data.message ?? "Results are not available yet."),
      );
      setResults(data.rows ?? []);
    } catch {
      setError("Results are not available for this election yet.");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    results,
    resultsAvailable,
    unavailableMessage,
    loading,
    error,
    refetch,
  };
}
