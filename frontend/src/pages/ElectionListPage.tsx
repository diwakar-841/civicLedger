import { Link } from "react-router-dom";
import {
  Vote,
  ArrowRight,
  CalendarClock,
  ShieldCheck,
  Search,
  BarChart3,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { StatusBadge } from "../components/shared/Badge";
import { useAuthContext } from "../contexts/AuthContext";
import { useElections, deriveStatus } from "../hooks/useElections";

export function ElectionListPage() {
  const { elections, loading, error } = useElections();
  const { user } = useAuthContext();
  const [query, setQuery] = useState("");
  const activeCount = elections.filter(
    (e) => deriveStatus(e) === "active",
  ).length;
  const visibleElections = useMemo(
    () =>
      elections.filter((e) => {
        const matchesQuery =
          !query ||
          `${e.title} ${e.description ?? ""}`
            .toLowerCase()
            .includes(query.toLowerCase());
        return matchesQuery;
      }),
    [elections, query],
  );

  return (
    <Layout>
      <div className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-5 py-7 text-white shadow-xl shadow-indigo-600/20 sm:mb-8 sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[24px] border-white/10" />
        <div className="pointer-events-none absolute bottom-[-5rem] right-24 h-48 w-48 rounded-full bg-teal-300/20 blur-2xl" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Your elections
            </h1>
            <p className="mt-1 max-w-md text-sm text-indigo-100">
              Every ballot cast here is signed by your own wallet and verified
              on-chain.
            </p>
          </div>
          {!loading && !error && elections.length > 0 && (
            <div className="flex-shrink-0 self-start rounded-xl bg-white/5 px-4 py-3 sm:self-auto sm:text-right">
              <p className="text-3xl font-extrabold text-teal-300">
                {activeCount}
              </p>
              <p className="text-xs text-indigo-100">open for voting</p>
            </div>
          )}
        </div>
      </div>

      {!loading && !error && elections.length > 0 && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search elections"
              className="focus-ring w-full rounded-xl border border-navy-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm"
            />
          </div>
        </div>
      )}

      {loading && <Spinner label="Loading elections" />}
      {!loading && error && (
        <EmptyState title="Something went wrong" description={error} />
      )}
      {!loading && !error && elections.length === 0 && (
        <EmptyState
          title="No elections yet"
          description="Check back once an administrator schedules a new election."
          icon={<Vote className="h-6 w-6" />}
        />
      )}

      {!loading &&
        !error &&
        elections.length > 0 &&
        visibleElections.length === 0 && (
          <EmptyState
            title="No matching elections"
            description="Try a different search or filter."
            icon={<Search className="h-6 w-6" />}
          />
        )}
      {!loading && !error && visibleElections.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleElections.map((election, i) => {
            const status = deriveStatus(election);
            return (
              <div
                key={election.id}
                className="flex h-full flex-col gap-2 animate-slide-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <Link to={`/elections/${election.id}`} className="group flex-1">
                  <Card className="flex h-full flex-col gap-4 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/10">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-lg font-bold text-navy-900">
                        {election.title || "Untitled election"}
                      </h2>
                      <StatusBadge status={status} />
                    </div>
                    {election.description && (
                      <p className="line-clamp-2 flex-1 text-sm text-navy-500">
                        {election.description}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 border-t border-navy-100 pt-4 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex items-center gap-1.5">
                        <CalendarClock className="h-3.5 w-3.5 flex-shrink-0" />
                        {election.startTime && election.endTime
                          ? `${new Date(election.startTime).toLocaleDateString()} – ${new Date(election.endTime).toLocaleDateString()}`
                          : "Not scheduled yet"}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-800">
                        View <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Card>
                </Link>
                <Link
                  to={`/elections/${election.id}/results`}
                  className="focus-ring flex items-center justify-center gap-1.5 rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-xs font-semibold text-navy-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                  View results
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
