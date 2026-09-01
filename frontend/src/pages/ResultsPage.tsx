import { useState } from "react";
import { useParams } from "react-router-dom";
import {
  BadgeCheck,
  BarChart3,
  Radio,
  Trophy,
  Users,
  Vote,
} from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { StatusBadge } from "../components/shared/Badge";
import { CandidateDetailsModal } from "../components/voting/CandidateDetailModal";
import { useResults } from "../hooks/useResults";
import {
  useElection,
  deriveStatus,
  type Candidate,
} from "../hooks/useElections";

const GOLD = "#dfab38";
const NAVY = "#3d5091";
const COLORS = [GOLD, NAVY, "#5c6fac", "#c9922a", "#2b3c74", "#eac25e"];

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

export function ResultsPage() {
  const { id } = useParams();
  const { election } = useElection(id);
  const { results, resultsAvailable, unavailableMessage, loading, error } =
    useResults(id);
  // Results only carry vote counts; the full candidate profile (photo, unique
  // voter ID, party, qualification, agenda, bio) comes from the election
  // itself. Tapping a candidate merges the two into one full profile view.
  const [detailsCandidate, setDetailsCandidate] = useState<Candidate | null>(
    null,
  );

  function candidateProfile(candidateId: string): Candidate | null {
    return election?.candidates?.find((c) => c.id === candidateId) ?? null;
  }

  const totalVotes = results.reduce((sum, r) => sum + r.votes, 0);
  const sortedResults = [...results].sort((a, b) => b.votes - a.votes);
  const leader =
    sortedResults.length > 0 && sortedResults[0].votes > 0
      ? sortedResults[0]
      : null;
  const status = election ? deriveStatus(election) : undefined;
  const isFinal = status === "closed";

  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        {}
        <div className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-6 py-7 text-white shadow-xl shadow-indigo-600/20 sm:px-9 sm:py-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[24px] border-white/10" />
          <div className="pointer-events-none absolute bottom-[-5rem] right-24 h-40 w-40 rounded-full bg-teal-300/20 blur-2xl" />
          <div className="relative">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-200">
              <BarChart3 className="h-3.5 w-3.5" />
              Election insights
            </p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
              {election?.title ?? "Results"}
            </h1>
            <p className="mt-2 text-sm text-indigo-100">
              Tallied directly from verified on-chain votes.
            </p>
            {status && (
              <div className="mt-3">
                <StatusBadge status={status} />
              </div>
            )}
          </div>
        </div>

        {loading && <Spinner label="Loading results" />}
        {!loading && error && (
          <EmptyState title="Results unavailable" description={error} />
        )}
        {!loading && !error && !resultsAvailable && (
          <EmptyState
            title="Results not published yet"
            description={unavailableMessage ?? "Results are not available yet."}
          />
        )}
        {!loading && !error && resultsAvailable && results.length === 0 && (
          <EmptyState
            title="No votes yet"
            description="Results will appear here once votes are cast."
          />
        )}

        {!loading && !error && resultsAvailable && results.length > 0 && (
          <>
            {}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Card className="flex flex-col gap-1 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-600 dark:bg-navy-800 dark:text-gold-400">
                  <Vote className="h-4 w-4" />
                </span>
                <p className="mt-1 text-2xl font-extrabold text-navy-900 dark:text-navy-50">
                  {totalVotes}
                </p>
                <p className="text-xs font-semibold text-navy-500">
                  Total votes cast
                </p>
              </Card>
              <Card className="flex flex-col gap-1 p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-navy-800 dark:text-indigo-400">
                  <Users className="h-4 w-4" />
                </span>
                <p className="mt-1 text-2xl font-extrabold text-navy-900 dark:text-navy-50">
                  {results.length}
                </p>
                <p className="text-xs font-semibold text-navy-500">
                  Candidates
                </p>
              </Card>
              <Card className="col-span-2 flex flex-col gap-1 p-5 sm:col-span-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-navy-800 dark:text-emerald-400">
                  <Trophy className="h-4 w-4" />
                </span>
                <p className="mt-1 truncate text-lg font-extrabold text-navy-900 dark:text-navy-50">
                  {leader ? leader.name : "—"}
                </p>
                <p className="text-xs font-semibold text-navy-500">
                  {leader
                    ? isFinal
                      ? `Winner · ${totalVotes > 0 ? Math.round((leader.votes / totalVotes) * 100) : 0}%`
                      : `Leading with ${totalVotes > 0 ? Math.round((leader.votes / totalVotes) * 100) : 0}%`
                    : "No votes yet"}
                </p>
              </Card>
            </div>

            {}
            <Card className="p-6">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400 dark:text-navy-500">
                  Candidate breakdown
                </h2>
                {status === "active" && (
                  <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                    <Radio className="h-3 w-3 animate-pulse" /> Live
                  </span>
                )}
              </div>
              <p className="mb-4 text-[11px] text-navy-400 dark:text-navy-500">
                Tap a candidate to view their full profile.
              </p>

              <div className="flex flex-col gap-4">
                {sortedResults.map((r, i) => {
                  const pct =
                    totalVotes > 0
                      ? Math.round((r.votes / totalVotes) * 100)
                      : 0;
                  const isLeader = i === 0 && r.votes > 0;
                  const profile = candidateProfile(r.candidateId);
                  return (
                    <button
                      key={r.candidateId}
                      type="button"
                      onClick={() =>
                        setDetailsCandidate(
                          profile ?? {
                            id: r.candidateId,
                            name: r.name,
                            party: r.party,
                            onChainCandidateId: 0,
                            voterUserId: null,
                            voterId: null,
                            photoUrl: null,
                            bio: null,
                            qualification: null,
                            supports: null,
                          },
                        )
                      }
                      className="focus-ring group w-full rounded-xl p-2 text-left transition-colors hover:bg-navy-50 dark:hover:bg-navy-800"
                    >
                      <div className="mb-1.5 flex items-center gap-3">
                        {}
                        {profile?.photoUrl ? (
                          <img
                            src={profile.photoUrl}
                            alt={r.name}
                            className="h-10 w-10 flex-shrink-0 rounded-full border border-navy-100 object-cover dark:border-navy-700"
                          />
                        ) : (
                          <span
                            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white"
                            style={{
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          >
                            {initials(r.name)}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center gap-1.5">
                            <span className="truncate text-sm font-bold text-navy-900 dark:text-navy-100">
                              {r.name}
                            </span>
                            {profile?.voterId && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                <BadgeCheck className="h-2.5 w-2.5" />
                                {profile.voterId}
                              </span>
                            )}
                          </span>
                          {r.party && (
                            <span className="text-xs text-navy-400 dark:text-navy-500">
                              {r.party}
                            </span>
                          )}
                        </span>
                        {isLeader && (
                          <span className="flex-shrink-0 rounded-full bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700 dark:bg-gold-900/30 dark:text-gold-400">
                            {isFinal ? "Winner" : "Leading"}
                          </span>
                        )}
                        <span className="flex-shrink-0 text-sm font-semibold text-navy-500 dark:text-navy-400">
                          {r.votes} vote{r.votes === 1 ? "" : "s"} &middot;{" "}
                          {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy-100 dark:bg-navy-700">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${isLeader ? "shadow-[0_0_12px_rgba(45,212,191,.45)]" : "opacity-80"}`}
                          style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}dd)`,
                          }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </Card>
          </>
        )}
      </div>

      {detailsCandidate && (
        <CandidateDetailsModal
          candidate={detailsCandidate}
          onClose={() => setDetailsCandidate(null)}
          readOnly
        />
      )}
    </Layout>
  );
}
