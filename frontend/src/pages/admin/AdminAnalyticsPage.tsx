import { downloadAuthenticatedFile } from "../../lib/download";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  BarChart3,
  Download,
  RefreshCw,
  ArrowLeft,
  Users,
  Trophy,
  ListChecks,
  Radio,
  BadgeCheck,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { Spinner } from "../../components/shared/Spinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/Badge";
import { useResultsSummary } from "../../hooks/useResultsSummary";
import {
  useElection,
  deriveStatus,
  type Candidate,
} from "../../hooks/useElections";
import { ElectionDeleteMenu } from "../../components/admin/ElectionDeleteMenu";
import { canDeleteElection } from "../../lib/electionRules";
import { CandidateDetailsModal } from "../../components/voting/CandidateDetailModal";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const GOLD = "#dfab38";
const NAVY = "#3d5091";
const COLORS = [GOLD, NAVY, "#5c6fac", "#c9922a", "#2b3c74", "#eac25e"];

export function AdminAnalyticsPage() {
  const { id } = useParams<{ id: string }>();
  const { election } = useElection(id);
  const { summary, loading, error, refetch } = useResultsSummary(id);
  const [exporting, setExporting] = useState(false);

  const [detailsCandidate, setDetailsCandidate] = useState<Candidate | null>(
    null,
  );

  function candidateProfile(candidateId: string): Candidate | null {
    return election?.candidates?.find((c) => c.id === candidateId) ?? null;
  }

  function handleExport() {
    setExporting(true);
    downloadAuthenticatedFile(`/results/${id}/export.csv`, `results-${id}.csv`)
      .catch(() => {})
      .finally(() => setExporting(false));
  }

  const barData =
    summary?.candidates.map((c: any) => ({
      name: c.name,
      votes: c.votes,
      percent: c.percent,
    })) ?? [];

  const pieData =
    summary?.candidates.map((c: any) => ({
      name: c.name,
      value: c.votes,
    })) ?? [];

  const sortedCandidates = summary
    ? [...summary.candidates].sort((a: any, b: any) => b.votes - a.votes)
    : [];
  const leader =
    sortedCandidates.length > 0 && sortedCandidates[0].votes > 0
      ? sortedCandidates[0]
      : null;
  const isFinal = election ? deriveStatus(election) === "closed" : false;

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
  };

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        <Link
          to="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800 dark:text-navy-400 dark:hover:text-navy-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {}
        <div className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-6 py-7 text-white shadow-xl shadow-indigo-600/20 sm:px-9 sm:py-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[24px] border-white/10" />
          <div className="pointer-events-none absolute bottom-[-5rem] right-24 h-40 w-40 rounded-full bg-teal-300/20 blur-2xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-200">
                <BarChart3 className="h-3.5 w-3.5" />
                Analytics
              </p>
              <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">
                {election?.title ?? "Election analytics"}
              </h1>
              {election && (
                <div className="mt-2">
                  <StatusBadge status={deriveStatus(election)} />
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={refetch}
                className="!bg-white/10 !text-white hover:!bg-white/20"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleExport}
                loading={exporting}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
              {election && canDeleteElection(election) && (
                <ElectionDeleteMenu election={election} />
              )}
            </div>
          </div>
        </div>

        {loading && <Spinner label="Loading results" />}
        {!loading && error && (
          <EmptyState title="Results unavailable" description={error} />
        )}

        {!loading && !error && summary && (
          <>
            {}
            <motion.div
              {...fadeIn}
              className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3"
            >
              <Card className="flex flex-col gap-1 p-5 dark:bg-navy-900 dark:border-navy-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-600 dark:bg-navy-800 dark:text-gold-400">
                  <Users className="h-4 w-4" />
                </span>
                <p className="mt-1 text-2xl font-extrabold text-navy-900 dark:text-navy-50">
                  {summary.totalVotesCast}
                </p>
                <p className="text-xs font-semibold text-navy-500">
                  Total votes cast
                </p>
              </Card>
              <Card className="flex flex-col gap-1 p-5 dark:bg-navy-900 dark:border-navy-700">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-navy-800 dark:text-indigo-400">
                  <ListChecks className="h-4 w-4" />
                </span>
                <p className="mt-1 text-2xl font-extrabold text-navy-900 dark:text-navy-50">
                  {summary.candidates.length}
                </p>
                <p className="text-xs font-semibold text-navy-500">
                  Candidates
                </p>
              </Card>
              <Card className="col-span-2 flex flex-col gap-1 p-5 dark:bg-navy-900 dark:border-navy-700 sm:col-span-1">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-navy-800 dark:text-emerald-400">
                  <Trophy className="h-4 w-4" />
                </span>
                <p className="mt-1 truncate text-lg font-extrabold text-navy-900 dark:text-navy-50">
                  {leader ? leader.name : "—"}
                </p>
                <p className="text-xs font-semibold text-navy-500">
                  {leader
                    ? isFinal
                      ? `Winner · ${leader.percent}%`
                      : `Leading with ${leader.percent}%`
                    : "No votes yet"}
                </p>
              </Card>
            </motion.div>

            {summary.candidates.length === 0 ? (
              <EmptyState
                title="No votes yet"
                description="Results will appear once votes are cast."
              />
            ) : (
              <>
                {}
                <motion.div
                  {...fadeIn}
                  transition={{ ...fadeIn.transition, delay: 0.05 }}
                >
                  <Card className="mb-6 p-6 dark:bg-navy-900 dark:border-navy-700">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-sm font-semibold uppercase tracking-wide text-navy-400 dark:text-navy-500">
                        Vote breakdown
                      </h2>
                      {deriveStatus(
                        election ?? { startTime: null, endTime: null },
                      ) === "active" && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          <Radio className="h-3 w-3 animate-pulse" /> Live
                        </span>
                      )}
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart
                        data={barData}
                        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="name"
                          tick={{ fontSize: 12, fill: "#5c6fac" }}
                          axisLine={{ stroke: "#e2e8f0" }}
                          tickLine={false}
                        />
                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: "#5c6fac" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: "rgba(91, 95, 239, 0.06)" }}
                          formatter={(
                            value: number,
                            _name: string,
                            props: { payload?: { percent?: number } },
                          ) => [
                            `${value} votes (${props.payload?.percent ?? 0}%)`,
                            "Votes",
                          ]}
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid #b0bfdf",
                            fontSize: 12,
                            boxShadow: "0 8px 24px -12px rgba(12,20,40,.25)",
                          }}
                        />
                        <Bar
                          dataKey="votes"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={56}
                        >
                          {barData.map((_entry: any, index: number) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </Card>
                </motion.div>

                {}
                <motion.div
                  {...fadeIn}
                  transition={{ ...fadeIn.transition, delay: 0.1 }}
                >
                  <div className="grid gap-6 sm:grid-cols-2">
                    <Card className="p-6 dark:bg-navy-900 dark:border-navy-700">
                      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-navy-400 dark:text-navy-500">
                        Share of votes
                      </h2>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={54}
                            outerRadius={84}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="none"
                          >
                            {pieData.map((_entry: any, index: number) => (
                              <Cell
                                key={`pie-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Legend
                            iconType="circle"
                            iconSize={8}
                            wrapperStyle={{ fontSize: 11 }}
                          />
                          <Tooltip
                            formatter={(value: number) => [
                              `${value} votes`,
                              "Votes",
                            ]}
                            contentStyle={{
                              borderRadius: 12,
                              border: "1px solid #b0bfdf",
                              fontSize: 12,
                              boxShadow: "0 8px 24px -12px rgba(12,20,40,.25)",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Card>

                    <Card className="p-6 dark:bg-navy-900 dark:border-navy-700">
                      <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-navy-400 dark:text-navy-500">
                        Candidate details
                      </h2>
                      <p className="mb-4 text-[11px] text-navy-400 dark:text-navy-500">
                        Tap a candidate to view their full profile.
                      </p>
                      <div className="flex flex-col gap-4">
                        {sortedCandidates.map((c: any, i: number) => {
                          const isLeader = i === 0 && c.votes > 0;
                          const profile = candidateProfile(c.id);
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() =>
                                setDetailsCandidate(
                                  profile ?? {
                                    id: c.id,
                                    name: c.name,
                                    party: c.party ?? null,
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
                              className="focus-ring group w-full rounded-xl p-1 text-left transition-colors hover:bg-navy-50 dark:hover:bg-navy-800"
                            >
                              <div className="mb-1.5 flex items-center gap-2.5">
                                {}
                                {profile?.photoUrl ? (
                                  <img
                                    src={profile.photoUrl}
                                    alt={c.name}
                                    className="h-8 w-8 flex-shrink-0 rounded-full border border-navy-100 object-cover dark:border-navy-700"
                                  />
                                ) : (
                                  <span
                                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
                                    style={{
                                      backgroundColor:
                                        COLORS[i % COLORS.length],
                                    }}
                                  >
                                    {initials(c.name)}
                                  </span>
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-1.5">
                                    <span className="truncate text-sm font-semibold text-navy-900 dark:text-navy-100">
                                      {c.name}
                                    </span>
                                    {profile?.voterId && (
                                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                                        <BadgeCheck className="h-2.5 w-2.5" />
                                        {profile.voterId}
                                      </span>
                                    )}
                                  </span>
                                </span>
                                {isLeader && (
                                  <span className="flex-shrink-0 rounded-full bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700 dark:bg-gold-900/30 dark:text-gold-400">
                                    {isFinal ? "Winner" : "Leading"}
                                  </span>
                                )}
                                <span className="flex-shrink-0 text-xs font-semibold text-navy-500 dark:text-navy-400">
                                  {c.percent}%
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-navy-100 dark:bg-navy-700">
                                <div
                                  className="h-full rounded-full transition-all duration-700"
                                  style={{
                                    width: `${c.percent}%`,
                                    background: COLORS[i % COLORS.length],
                                  }}
                                />
                              </div>
                              <p className="mt-1 text-[11px] text-navy-400">
                                {c.votes} vote{c.votes === 1 ? "" : "s"}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </Card>
                  </div>
                </motion.div>
              </>
            )}
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
