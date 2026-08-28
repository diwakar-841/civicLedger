import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../lib/apiClient";
import type { ElectionResultSummary } from "../types/api";

export function useResultsSummary(electionId: string | undefined) {
  const [summary, setSummary] = useState<ElectionResultSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!electionId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<ElectionResultSummary>(`/results/${electionId}/summary`);
      setSummary(data);
    } catch {
      setError("Results summary unavailable.");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { summary, loading, error, refetch };
}
