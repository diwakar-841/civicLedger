import { useEffect, useRef, useState } from "react";
import { apiClient } from "../lib/apiClient";

export type GlobalSearchType = "all" | "election" | "user" | "admin" | "group";
export interface GlobalSearchGroup { kind: "group"; id: string; displayId: string; name: string; }

export interface GlobalSearchElection {
  kind: "election";
  id: string;
  displayId: string;
  title: string;
  status: "draft" | "active" | "closed";
  isHidden: boolean;
  startTime: string | null;
  endTime: string | null;
}

export interface GlobalSearchUser {
  kind: "user" | "admin";
  id: string;
  displayId: string;
  fullName: string;
  email: string;
  isVerified?: boolean;
}

export interface GlobalSearchResults {
  elections: GlobalSearchElection[];
  users: GlobalSearchUser[];
  admins: GlobalSearchUser[];
  groups: GlobalSearchGroup[];
}

const EMPTY: GlobalSearchResults = { elections: [], users: [], admins: [], groups: [] };

/**
 * Debounced search against GET /elections/search — powers the global search
 * bar (Navbar) available to every signed-in user. Voters get election
 * results only (already scoped server-side); admins get elections, voters,
 * and admins.
 */
export function useGlobalSearch(query: string, type: GlobalSearchType = "all") {
  const [results, setResults] = useState<GlobalSearchResults>(EMPTY);
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
        const { data } = await apiClient.get<GlobalSearchResults>("/elections/search", {
          params: { q, type },
        });
        if (id === requestId.current) {
          setResults({
            elections: data.elections ?? [],
            users: data.users ?? [],
            admins: data.admins ?? [],
            groups: data.groups ?? [],
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
