import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, CalendarClock, Search, Settings2, Vote } from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { EmptyState } from "../../components/shared/EmptyState";
import { Spinner } from "../../components/shared/Spinner";
import { StatusBadge } from "../../components/shared/Badge";
import { useAdminElectionsForDashboard } from "../../hooks/useAdminElectionsForDashboard";
import { deriveStatus } from "../../hooks/useElections";
import { electionDisplayId } from "../../lib/idFormat";

type Tab = "all" | "open" | "draft" | "closed";

/** Collapses the four lifecycle states into the three buckets the admin
 *  actually needs to filter by — cancelled elections read as "closed"
 *  since there's nothing further to do with them either way. */
function bucket(status: string): "open" | "draft" | "closed" {
  if (status === "active") return "open";
  if (status === "draft") return "draft";
  return "closed";
}

export function AdminElectionsPage() {
  const { elections, loading, error } = useAdminElectionsForDashboard();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>("all");

  const matchingQuery = useMemo(
    () => elections.filter((e) => `${e.title} ${e.description ?? ""}`.toLowerCase().includes(query.toLowerCase())),
    [elections, query]
  );

  const counts = useMemo(() => ({
    all: matchingQuery.length,
    open: matchingQuery.filter((e) => bucket(deriveStatus(e)) === "open").length,
    draft: matchingQuery.filter((e) => bucket(deriveStatus(e)) === "draft").length,
    closed: matchingQuery.filter((e) => bucket(deriveStatus(e)) === "closed").length,
  }), [matchingQuery]);

  const visible = useMemo(
    () => (tab === "all" ? matchingQuery : matchingQuery.filter((e) => bucket(deriveStatus(e)) === tab)),
    [matchingQuery, tab]
  );

  const TABS: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "draft", label: "Draft" },
    { key: "closed", label: "Closed" },
  ];

  return (
    <Layout>
      <div className="mb-6">
        <p className="eyebrow text-indigo-600">Control center</p>
        <h1 className="mt-1 text-3xl font-extrabold text-navy-900 dark:text-white">Elections</h1>
        <p className="mt-1 text-sm text-navy-500">Search, monitor, and manage every election you create.</p>
      </div>

      {!loading && !error && elections.length > 0 && (
        <div className="relative mb-5 max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search elections"
            className="focus-ring w-full rounded-xl border border-navy-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm"
          />
        </div>
      )}

      {!loading && !error && elections.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`focus-ring flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/20"
                  : "border-navy-200 bg-white text-navy-600 hover:border-indigo-200 hover:text-indigo-700 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-300"
              }`}
            >
              {t.label}
              <span className={`rounded-full px-1.5 py-0.5 text-xs ${tab === t.key ? "bg-white/20" : "bg-navy-100 text-navy-500 dark:bg-navy-800"}`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading && <Spinner label="Loading elections" />}
      {!loading && error && <EmptyState title="Something went wrong" description={error} />}
      {!loading && !error && elections.length === 0 && (
        <EmptyState title="No elections yet" description="Create your first election to start collecting verified on-chain votes." icon={<Vote className="h-6 w-6" />} />
      )}
      {!loading && !error && elections.length > 0 && visible.length === 0 && (
        <EmptyState title="No matching elections" description="Try a different search term or filter." icon={<Search className="h-6 w-6" />} />
      )}

      {!loading && !error && visible.length > 0 && (
        <div className="flex flex-col gap-3">
          {visible.map((election) => (
            <Card key={election.id} className="border-l-4 border-l-indigo-500 p-5 dark:bg-navy-900">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <h2 className="font-bold text-navy-900 dark:text-white">{election.title}</h2>
                    <StatusBadge status={deriveStatus(election)} />
                    <span className="font-mono text-[11px] text-navy-400">{electionDisplayId(election.id)}</span>
                  </div>
                  <p className="flex items-center gap-1.5 text-xs text-navy-400">
                    <CalendarClock className="h-3.5 w-3.5" />
                    {election.startTime && election.endTime
                      ? `${new Date(election.startTime).toLocaleDateString()} – ${new Date(election.endTime).toLocaleDateString()}`
                      : "Not scheduled yet"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/admin/elections/${election.id}/status`}>
                    <Button size="sm" variant="ghost"><Settings2 className="h-4 w-4" />Manage</Button>
                  </Link>
                  <Link to={`/admin/elections/${election.id}/analytics`}>
                    <Button size="sm" variant="ghost"><BarChart3 className="h-4 w-4" />Analytics</Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
