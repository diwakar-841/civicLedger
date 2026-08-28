import { useEffect, useRef, useState } from "react";
import { apiClient } from "../lib/apiClient";

export type AdminSearchType = "all" | "election" | "user" | "admin";

export interface AdminSearchElection {
  kind: "election";
  id: string;
  displayId: string;
  title: string;
  status: "draft" | "active" | "closed";
  isHidden: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface AdminSearchUser {
  kind: "user" | "admin";
  id: string;
  displayId: string;
  fullName: string;
  email: string;
  isVerified?: boolean;
}

export interface AdminSearchResults {
  elections: AdminSearchElection[];
  users: AdminSearchUser[];
  admins: AdminSearchUser[];
}

const EMPTY: AdminSearchResults = { elections: [], users: [], admins: [] };

/** Debounced search against GET /admin/search — powers the admin search bar. */
export function useAdminSearch(query: string, type: AdminSearchType = "all") {
  const [results, setResults] = useState<AdminSearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
        const { data } = await apiClient.get<AdminSearchResults>("/admin/search", {
          params: { q, type },
        });
        if (id === requestId.current) {
          setResults({
            elections: data.elections ?? [],
            users: data.users ?? [],
            admins: data.admins ?? [],
          });
        }
      } catch (err: any) {
        if (id === requestId.current) {
          setError(err?.response?.data?.message || err?.message || "Search failed");
          setResults(EMPTY);
        }
      } finally {
        if (id === requestId.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, type]);

  return { results, loading, error };
}
