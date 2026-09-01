import { useEffect, useState, useCallback } from "react";
import { apiClient } from "../lib/apiClient";

export function useResults(electionId) {
  const [results, setResults] = useState([]);

  const [resultsAvailable, setResultsAvailable] = useState(true);
  const [unavailableMessage, setUnavailableMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!electionId) {return;}
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/results/${electionId}`);
      setResultsAvailable(data.resultsAvailable);
      setUnavailableMessage(data.resultsAvailable ? null : data.message ?? "Results are not available yet.");
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

  return { results, resultsAvailable, unavailableMessage, loading, error, refetch };
}