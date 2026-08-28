import { useEffect, useState, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, PlayCircle, Calendar, Trash2, CheckCircle2, XCircle, Clock3 } from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { Spinner } from "../../components/shared/Spinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { apiClient } from "../../lib/apiClient";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";

interface CandidateResponseRow {
  requestId: string;
  userId: string;
  name: string;
  status: "accepted" | "rejected" | "pending" | "expired";
  displayStatus: "Accepted" | "Rejected" | "No Response";
  profileCompleted: boolean;
  respondedAt: string | null;
}

interface CandidateAllowanceSummary {
  electionId: string;
  title?: string;
  status?: "draft" | "active" | "closed" | "cancelled";
  totalInvited: number;
  accepted: number;
  rejected: number;
  noResponse: number;
  profileCompleted: number;
  candidates: CandidateResponseRow[];
  canStartVoting: boolean;
  canExtend: boolean;
  canCancel: boolean;
  mustClose: boolean;
  allowanceEnded: boolean;
  decisionPhase: "initial" | "final";
  extensionUsed: boolean;
  decisionWindowOpen: boolean;
  adminWindowEndsAt: string | null;
  nominationDeadline: string | null;
  recommendationTitle?: string;
  recommendation: string;
}

// The single permitted extension lasts 10 → 24 hours and only ever applies to
// candidates who never responded (workflow spec §3 option B / §4).
const MIN_EXTEND_HOURS = 10;
const MAX_EXTEND_HOURS = 24;
const DEFAULT_EXTEND_HOURS = 12;

/** "3h 12m" style countdown to an ISO timestamp; null once it has passed. */
function countdownTo(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function statusPillClasses(status: CandidateResponseRow["displayStatus"]): string {
  switch (status) {
    case "Accepted":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "Rejected":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-navy-100 text-navy-600 dark:bg-navy-800 dark:text-navy-300";
  }
}

function statusIcon(status: CandidateResponseRow["displayStatus"]) {
  if (status === "Accepted") return <CheckCircle2 className="h-3.5 w-3.5" />;
  if (status === "Rejected") return <XCircle className="h-3.5 w-3.5" />;
  return <Clock3 className="h-3.5 w-3.5" />;
}

/**
 * Election status page (feature spec §5): the full candidate-by-candidate
 * breakdown for a draft election's nomination window, plus the same
 * start/extend/close actions available on the drafts list — used when an
 * admin wants to drill into a single election's detail.
 */
export function ElectionStatusPage() {
  const { id } = useParams<{ id: string }>();
  const { show } = useToast();

  const [summary, setSummary] = useState<CandidateAllowanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const navigate = useNavigate();
  const [extendHours, setExtendHours] = useState(DEFAULT_EXTEND_HOURS);
  // Re-render once a minute so the decision-period countdown stays live.
  const [, setTick] = useState(0);

  const fetchSummary = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const { data } = await apiClient.get<CandidateAllowanceSummary>(`/admin/elections/${id}/status`);
      setSummary(data);
      setError(null);
    } catch (err) {
      setError(formatError(err, "Failed to load election status"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // The workflow's periods expire on their own (server-side); refresh so the
  // available actions never go stale while the page is open.
  useEffect(() => {
    const tick = setInterval(() => setTick((t) => t + 1), 30_000);
    const refresh = setInterval(() => fetchSummary(), 60_000);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [fetchSummary]);

  /**
   * Voting always needs an explicit start and end time chosen by the admin, so
   * this navigates to the page where that window is set instead of opening
   * voting immediately.
   */
  function handleStartVoting() {
    if (!id) return;
    navigate(`/admin/elections/${id}/candidates`);
  }

  async function handleExtend() {
    if (!id) return;
    const hours = Math.round(extendHours);
    if (!Number.isFinite(hours) || hours < MIN_EXTEND_HOURS || hours > MAX_EXTEND_HOURS) {
      show(`Extension must be between ${MIN_EXTEND_HOURS} and ${MAX_EXTEND_HOURS} hours`, "error");
      return;
    }
    const minutes = hours * 60;
    setActionLoading("extend");
    try {
      await apiClient.post(`/admin/elections/${id}/extend-allowance`, { minutes });
      show(
        "Deadline extended for non-responders. This was the only extension available.",
        "success"
      );
      setExtendOpen(false);
      fetchSummary();
    } catch (err) {
      show(formatError(err, "Failed to extend deadline"), "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleClose() {
    if (!id || !summary) return;
    if (!window.confirm("Cancel this election permanently?")) return;
    setActionLoading("close");
    try {
      await apiClient.post(`/admin/elections/${id}/cancel`);
      show("Election cancelled", "success");
      // The election no longer exists — staying on its detail page would show
      // a permanent "Failed to load election status" error.
      navigate("/admin/elections");
    } catch (err) {
      show(formatError(err, "Failed to close draft"), "error");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <Layout><Spinner label="Loading election status" /></Layout>;
  if (error || !summary) return <Layout><EmptyState title="Error" description={error ?? "Election not found"} /></Layout>;

  return (
    <Layout>
      <Link
        to="/admin/elections"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-700 dark:text-navy-400 dark:hover:text-navy-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to elections
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 dark:text-navy-50">Election Status</h1>
        <p className="mt-1 text-sm text-navy-500 dark:text-navy-400">
          Candidate allowance breakdown and recommended next step.
        </p>
      </div>

      {/* Summary counters */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryStat label="Total invited" value={summary.totalInvited} />
        <SummaryStat label="Accepted" value={summary.accepted} highlight={summary.accepted >= 2} />
        <SummaryStat label="Rejected" value={summary.rejected} />
        <SummaryStat label="No response" value={summary.noResponse} />
      </div>

      {/* Decision-period banner */}
      {summary.allowanceEnded && summary.decisionWindowOpen && (
        <Card className="mb-4 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {summary.decisionPhase === "final"
              ? "Final 24-hour admin decision period"
              : "First 24-hour admin decision period"}
            {countdownTo(summary.adminWindowEndsAt) && (
              <span className="ml-2 font-normal">
                &mdash; {countdownTo(summary.adminWindowEndsAt)} left
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
            {summary.decisionPhase === "final"
              ? "Already extended once. Start voting (2+ accepted) or cancel."
              : "Start voting (2+ accepted), extend once for non-responders, or cancel."}{" "}
            If this period expires without a decision, the election is cancelled automatically.
          </p>
        </Card>
      )}

      {/* Recommendation */}
      <Card
        className={`mb-6 p-4 dark:bg-navy-900 ${
          summary.mustClose
            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20"
            : summary.canStartVoting
            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20"
            : ""
        }`}
      >
        <p
          className={`text-sm font-medium ${
            summary.mustClose
              ? "text-red-700 dark:text-red-400"
              : summary.canStartVoting
              ? "text-emerald-700 dark:text-emerald-400"
              : "text-navy-700 dark:text-navy-200"
          }`}
        >
          {summary.recommendation}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {summary.canStartVoting && (
            <button
              onClick={handleStartVoting}
              disabled={actionLoading === "start"}
              className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-40 dark:text-emerald-400"
              type="button"
            >
              {actionLoading === "start" ? <Spinner /> : <PlayCircle className="h-4 w-4" />}
              Schedule voting
            </button>
          )}

          {summary.canExtend && !extendOpen && (
            <button
              onClick={() => setExtendOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-400/10 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-400/20 dark:text-blue-400"
              type="button"
            >
              <Calendar className="h-4 w-4" />
              Extend Allowance
            </button>
          )}

          {summary.allowanceEnded && !summary.canExtend && summary.extensionUsed && (
            <span className="flex items-center gap-2 rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-500 dark:border-navy-700 dark:text-navy-400">
              <Calendar className="h-4 w-4" />
              Extension already used
            </span>
          )}

          {summary.canCancel && (
            <button
              onClick={handleClose}
              disabled={actionLoading === "close"}
              className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-400/20 disabled:opacity-40 dark:text-red-400"
              type="button"
            >
              {actionLoading === "close" ? <Spinner /> : <Trash2 className="h-4 w-4" />}
              Cancel Election
            </button>
          )}
        </div>

        {extendOpen && (
          <div className="mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
            <div>
              <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400">
                Extend by (hours)
              </label>
              <input
                type="number"
                min={MIN_EXTEND_HOURS}
                max={MAX_EXTEND_HOURS}
                value={extendHours}
                onChange={(e) => setExtendHours(Number(e.target.value))}
                className="w-28 rounded-lg border border-navy-200 px-2 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-900"
              />
            </div>
            <p className="pb-2 text-xs text-navy-500 dark:text-navy-400">
              {MIN_EXTEND_HOURS}h &ndash; {MAX_EXTEND_HOURS}h. Applies only to candidates with no response, and can be
              used only once &mdash; afterwards you get a final 24-hour decision period.
            </p>
            <div className="ml-auto flex gap-2">
              <button
                onClick={handleExtend}
                disabled={actionLoading === "extend"}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40"
                type="button"
              >
                {actionLoading === "extend" ? <Spinner /> : "Confirm"}
              </button>
              <button
                onClick={() => setExtendOpen(false)}
                className="rounded-lg border border-navy-200 px-3 py-1.5 text-sm text-navy-600 dark:border-navy-700 dark:text-navy-300"
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Candidate-by-candidate breakdown */}
      <Card className="overflow-hidden dark:bg-navy-900 dark:border-navy-700">
        <table className="w-full text-left text-sm">
          <thead className="bg-navy-50 text-[10px] font-semibold uppercase tracking-wide text-navy-400 dark:bg-navy-800">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Profile</th>
              <th className="px-4 py-3">Response time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-100 dark:divide-navy-800">
            {summary.candidates.map((c) => (
              <tr key={c.requestId}>
                <td className="px-4 py-3 font-medium text-navy-800 dark:text-navy-100">{c.name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClasses(c.displayStatus)}`}>
                    {statusIcon(c.displayStatus)}
                    {c.displayStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-navy-500 dark:text-navy-400">
                  {c.status === "accepted" ? (c.profileCompleted ? "Complete" : "Pending") : "—"}
                </td>
                <td className="px-4 py-3 text-navy-500 dark:text-navy-400">
                  {c.respondedAt ? new Date(c.respondedAt).toLocaleString() : "—"}
                </td>
              </tr>
            ))}
            {summary.candidates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-navy-400">
                  No candidates have been invited yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="mt-4">
        {summary.status === "draft" ? (
          <Link to={`/admin/elections/${id}/candidates`}>
            <Button size="sm" variant="secondary">Manage candidates</Button>
          </Link>
        ) : (
          <Link to={`/admin/elections/${id}/analytics`}>
            <Button size="sm" variant="secondary">View results</Button>
          </Link>
        )}
      </div>
    </Layout>
  );
}

function SummaryStat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-navy-50 p-3 dark:bg-navy-800">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-navy-400">{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-navy-900 dark:text-navy-100"}`}>
        {value}
      </p>
    </div>
  );
}
