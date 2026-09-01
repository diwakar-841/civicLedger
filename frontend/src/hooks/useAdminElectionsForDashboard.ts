import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { formatError } from "../lib/formatError";

export function useAdminElectionsForDashboard() {
  const [elections, setElections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/admin/elections");
      setElections(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = formatError(err, "Could not load elections");
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