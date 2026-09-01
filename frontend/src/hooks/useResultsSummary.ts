import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../lib/apiClient";

export function useResultsSummary(electionId) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!electionId) {return;}
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/results/${electionId}/summary`);
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