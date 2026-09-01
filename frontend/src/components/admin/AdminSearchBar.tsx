import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Vote, User, ShieldCheck, Loader2 } from "lucide-react";
import {
  useAdminSearch,
  type AdminSearchType,
} from "../../hooks/useAdminSearch";
import { deriveStatus } from "../../hooks/useElections";
import { StatusBadge } from "../shared/Badge";

const TYPE_TABS: { value: AdminSearchType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "election", label: "Elections" },
  { value: "user", label: "Voters" },
  { value: "admin", label: "Admins" },
];

export function AdminSearchBar() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState<AdminSearchType>("all");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);

  const { results, loading, error } = useAdminSearch(query, type);
  const hasQuery = query.trim().length >= 2;
  const hasResults =
    results.elections.length + results.users.length + results.admins.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function goToElection(id: string) {
    setOpen(false);
    navigate(`/admin/elections/${id}/status`);
  }

  return (
    <div ref={containerRef} className="relative w-full sm:max-w-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search elections, voters, admins..."
          aria-label="Search elections, voters, and admins"
          className="focus-ring w-full rounded-lg border border-navy-200 bg-white py-2.5 pl-9 pr-9 text-sm text-navy-900 placeholder:text-navy-400 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-100 dark:placeholder:text-navy-500"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-600 dark:hover:text-navy-200"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {open && hasQuery && (
        <div className="absolute z-30 mt-2 w-full min-w-[20rem] rounded-xl border border-navy-100 bg-white p-3 shadow-elevated dark:border-navy-700 dark:bg-navy-900">
          {}
          <div className="mb-3 flex gap-1.5">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setType(tab.value)}
                className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                  type === tab.value
                    ? "bg-navy-900 text-white dark:bg-gold-400 dark:text-navy-950"
                    : "bg-navy-100 text-navy-500 hover:bg-navy-200 dark:bg-navy-800 dark:text-navy-400 dark:hover:bg-navy-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading && (
            <div className="flex items-center gap-2 px-1 py-3 text-sm text-navy-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}

          {!loading && error && (
            <p className="px-1 py-3 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {!loading && !error && !hasResults && (
            <p className="px-1 py-3 text-sm text-navy-400">
              No matches for "{query}".
            </p>
          )}

          {!loading && !error && hasResults && (
            <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
              {results.elections.length > 0 && (
                <div>
                  <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400">
                    Elections
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {results.elections.map((e) => (
                      <button
                        key={e.id}
                        type="button"
                        onClick={() => goToElection(e.id)}
                        className="focus-ring flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-navy-50 dark:hover:bg-navy-800"
                      >
                        <Vote className="h-4 w-4 flex-shrink-0 text-gold-500" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-navy-900 dark:text-navy-100">
                            {e.title}
                          </span>
                          <span className="font-mono text-[11px] text-navy-400">
                            {e.displayId}
                          </span>
                        </span>
                        <StatusBadge
                          status={deriveStatus({
                            startTime: e.startTime,
                            endTime: e.endTime,
                          })}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {results.users.length > 0 && (
                <div>
                  <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400">
                    Voters
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {results.users.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-2"
                      >
                        <User className="h-4 w-4 flex-shrink-0 text-navy-400" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-navy-900 dark:text-navy-100">
                            {u.fullName}
                          </span>
                          <span className="font-mono text-[11px] text-navy-400">
                            {u.displayId}
                          </span>
                        </span>
                        {u.isVerified && (
                          <span title="Verified">
                            <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {results.admins.length > 0 && (
                <div>
                  <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400">
                    Admins
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {results.admins.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-2"
                      >
                        <ShieldCheck className="h-4 w-4 flex-shrink-0 text-gold-500" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-navy-900 dark:text-navy-100">
                            {a.fullName}
                          </span>
                          <span className="font-mono text-[11px] text-navy-400">
                            {a.displayId}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
