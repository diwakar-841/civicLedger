import { useEffect, useRef, useState } from "react";
import { apiClient } from "../lib/apiClient";
import { formatError } from "../lib/formatError";

const EMPTY = { elections: [], users: [], admins: [] };

export function useAdminSearch(query, type = "all") {
  const [results, setResults] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults(EMPTY);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const { data } = await apiClient.get("/admin/search", { params: { q, type } });
        if (id === requestId.current) {
          setResults({
            elections: data.elections ?? [],
            users: data.users ?? [],
            admins: data.admins ?? []
          });
        }
      } catch (err) {
        if (id === requestId.current) {
          setError(formatError(err, "Search failed"));
          setResults(EMPTY);
        }
      } finally {
        if (id === requestId.current) {setLoading(false);}
      }
    }, 300);

    return () => {return clearTimeout(timer);};
  }, [query, type]);

  return { results, loading, error };
}