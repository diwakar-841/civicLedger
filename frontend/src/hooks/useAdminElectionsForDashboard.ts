import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

export interface AdminElection {
  id: string;
  title: string;
  description: string | null;
  startTime: string | null;
  endTime: string | null;
  isHidden: boolean;
  candidateCount?: number;
  status?: "draft" | "active" | "closed" | "cancelled";
  resultsPublishedAt?: string | null;
}

export function useAdminElectionsForDashboard() {
  const [elections, setElections] = useState<AdminElection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<AdminElection[]>("/admin/elections");
      setElections(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Could not load elections";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { elections, loading, error, refetch };
}
