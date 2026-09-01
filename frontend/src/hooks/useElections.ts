import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

export function deriveStatus(
election)
{

  if (election.status === "cancelled") {return "cancelled";}
  if (!election.startTime || !election.endTime) {return "draft";}

  const now = Date.now();
  const start = new Date(election.startTime).getTime();
  const end = new Date(election.endTime).getTime();

  if (election.status === "closed") {return "closed";}
  if (election.status === "active") {
    if (now > end) {return "closed";}

    return now < start ? "draft" : "active";
  }

  if (election.status === "draft") {return now > end ? "closed" : "draft";}

  if (now < start) {return "draft";}
  if (now > end) {return "closed";}
  return "active";
}

export function useElections() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/elections");
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

export function useElection(id) {
  const [election, setElection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!id) {return;}
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/elections/${id}`);
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