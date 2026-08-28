/**
 * ManageCandidatesPage — 2-step election setup wizard
 *
 * Step 1 — Select candidates
 *   Search verified voters → click to add to the selected list.
 *   Each selected entry shows name + voter ID + a × remove button.
 *   No requests are sent yet. Minimum 2 required to advance.
 *
 * Step 2 — Set the candidate allowance period.
 *
 * Submit → AdminAuthModal (biometric / PIN, NOT email+password)
 *   On confirm: save nomination deadline → send requests → done.
 *
 * LOCKED state (requests already sent):
 *   Once any nomination request has been sent, the wizard is replaced with a
 *   read-only status view showing each nominee and their response status.
 *   The admin can extend the deadline, resend reminders, or close the draft
 *   from the Elections page's Draft tab (/admin/elections) or the election's
 *   status view (/admin/elections/:id/status).
 *
 *   Early-close logic — the admin is offered a "close draft" shortcut when:
 *     • All remaining pending requests have been fully resolved (accepted or
 *       rejected/expired) AND fewer than 2 candidates have completed profiles.
 *     • i.e., there's no realistic path to ≥ 2 candidates without admin action.
 */
import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, UserPlus, Search, BadgeCheck, X, Plus,
  CalendarClock, Info, CheckCircle2, AlertTriangle, Lock, Users,
  Building2, Clock, Send, Trash2, RefreshCw,
} from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { TextField } from "../../components/shared/Input";
import { Spinner } from "../../components/shared/Spinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { AdminAuthModal } from "../../components/auth/AdminAuthModal";
import { useElection, deriveStatus } from "../../hooks/useElections";
import type { Candidate } from "../../hooks/useElections";
import { CandidateDetailsModal } from "../../components/voting/CandidateDetailModal";
import { VoterDetailModal } from "../../components/admin/VoterDetailModal";
import {
  useVoterSearch,
  useCreateNominationRequest,
  useSetNominationDeadline,
  useElectionNominationRequests,
  useNominationStatus,
  useStartVoting,
  useExtendAllowance,
  useCloseDraftElection,
  type VoterSearchResult,
} from "../../hooks/useAdminElections";
import { NominationStatusPanel } from "../../components/admin/NominationStatusPanel";
import { ResultsSettingsCard } from "../../components/admin/ResultsSettingsCard";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";
import { apiClient } from "../../lib/apiClient";

// Workflow minimums — mirrored from the backend (backend/src/lib/electionTiming.ts).
const MIN_ALLOWANCE_MINUTES = 10; // allowance period must last ≥ 10 minutes
const MAX_ALLOWANCE_MINUTES = 7 * 24 * 60;
const MIN_VOTING_MINUTES = 10;  // voting window must stay open ≥ 10 minutes
const MAX_VOTING_MINUTES = 7 * 24 * 60;

/** Parses either an ISO string or "YYYY-MM-DD HH:MM" local input. */
function parseLocal(value: string): Date {
  return new Date(value.trim().replace(" ", "T"));
}

/** Formats a date as "YYYY-MM-DD HH:MM" in the admin's local time. */
function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


type Step = 1 | 2;

// ── Status badge colours ───────────────────────────────────────────────────────
function statusClass(status: string) {
  if (status === "accepted") return "bg-emerald-100 text-emerald-700";
  if (status === "rejected") return "bg-red-100 text-red-700";
  if (status === "expired")  return "bg-navy-100 text-navy-600";
  return "bg-gold-100 text-gold-800"; // pending
}

export function ManageCandidatesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { election, loading, error, refetch } = useElection(id);
  const { createRequest } = useCreateNominationRequest();
  const { setNominationDeadline, loading: savingDeadline } = useSetNominationDeadline();
  const { requests, loading: requestsLoading, refetch: refetchRequests } =
    useElectionNominationRequests(id);
  const { results: voterResults, loading: searching, search, clear } = useVoterSearch();
  const {
    status: nominationStatus,
    loading: statusLoading,
    refetch: refetchStatus,
  } = useNominationStatus(id);
  const { startVoting } = useStartVoting();
  const { extendAllowance } = useExtendAllowance();
  const { closeDraft } = useCloseDraftElection();
  const { show } = useToast();


  // ── wizard state ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>(1);
  const [selectedVoters, setSelectedVoters] = useState<VoterSearchResult[]>([]);
  const [voterQuery, setVoterQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [schedule, setSchedule] = useState({
    nominationDeadline: "",
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [viewingVoter, setViewingVoter] = useState<VoterSearchResult | null>(null);

  // ── draft management state (locked mode) ──────────────────────────────────
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);

  const hasStarted = Boolean(election) && deriveStatus(election!) !== "draft";

  // ── derive "locked" — requests have already been sent for this election ───
  // Once any request exists (pending, accepted, rejected, or expired) the
  // wizard is replaced with the status / management view. The admin cannot
  // re-run the wizard; they use the management actions instead.
  const hasExistingRequests = !requestsLoading && requests.length > 0;

  // For the "early close" shortcut: all requests are resolved (nothing pending)
  // AND fewer than 2 accepted+profile-complete candidates exist.
  const pendingCount   = requests.filter((r) => r.status === "pending").length;
  const acceptedCount  = requests.filter((r) => r.status === "accepted").length;
  // profileCompletedAt isn't on the list type directly — proxy via election candidates
  const profileDoneCount = nominationStatus?.profileCompletedCount ?? election?.candidates?.length ?? 0;
  const allResolved    = pendingCount === 0 && requests.length > 0;
  const canEarlyClose  = allResolved && profileDoneCount < 2;

  // ── timing validation ─────────────────────────────────────────────────────
  // Three independent minimums, all 10 minutes:
  //   • the candidate allowance period itself
  //   • the gap between the allowance ending and voting opening
  //   • the voting window
  const nominationDate = schedule.nominationDeadline
    ? new Date(schedule.nominationDeadline)
    : null;

  const allowanceMinutes = nominationDate
    ? (nominationDate.getTime() - Date.now()) / 60_000
    : null;
  const allowanceValid =
    allowanceMinutes !== null && allowanceMinutes >= MIN_ALLOWANCE_MINUTES;
  const allowanceWithinMax =
    allowanceMinutes !== null && allowanceMinutes <= MAX_ALLOWANCE_MINUTES;
  const nominationInFuture = Boolean(nominationDate && nominationDate > new Date());

  const scheduleValid =
    Boolean(schedule.nominationDeadline) &&
    allowanceValid &&
    allowanceWithinMax &&
    nominationInFuture;



  // ── close dropdown on outside click ──────────────────────────────────────
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  // ── search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      if (voterQuery.trim().length >= 2) {
        search(voterQuery);
        setShowDropdown(true);
      } else {
        clear();
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [voterQuery, search, clear]);

  // ── candidate helpers ─────────────────────────────────────────────────────
  function addVoter(voter: VoterSearchResult) {
    if (selectedVoters.some((v) => v.id === voter.id)) return;
    setSelectedVoters((prev) => [...prev, voter]);
    setVoterQuery("");
    clear();
    setShowDropdown(false);
  }

  function removeVoter(voterId: string) {
    setSelectedVoters((prev) => prev.filter((v) => v.id !== voterId));
  }

  // ── draft management actions (locked mode) ────────────────────────────────
  /**
   * Extends the allowance period for candidates who never responded.
   * Rejected candidates are never re-invited, and the voting window slides
   * automatically on the server to keep the required gap.
   */
  async function handleExtendAllowance(minutes: number) {
    if (!id) return;
    setActionLoading("extend");
    try {
      const data = await extendAllowance(id, minutes);
      show(data?.message ?? "Allowance period extended", "success");
      await Promise.all([refetchRequests(), refetch(), refetchStatus()]);
    } catch (err) {
      show(formatError(err, "Failed to extend the allowance period"), "error");
    } finally {
      setActionLoading(null);
    }
  }

  /**
   * Schedules voting during the post-allowance admin action window.
   *
   * A voting window is NEVER assumed: the admin must supply both a start and an
   * end time, the start cannot be in the past and the window must stay open for
   * at least MIN_VOTING_MINUTES. Nothing is sent to the server until every rule
   * passes, so an election can never slip into "started" without a real
   * decision.
   */
  async function handleStartVoting(input?: {
    startTime: string;
    endTime: string;
    resultsMode?: "live" | "manual";
    resultsReleaseAt?: string;
  }) {
    if (!id || !nominationStatus) return;

    const minAccepted = nominationStatus.rules?.minAcceptedCandidates ?? 2;
    if (nominationStatus.acceptedCount < minAccepted) {
      show(
        `Voting needs at least ${minAccepted} accepted candidates (${nominationStatus.acceptedCount} so far).`,
        "error"
      );
      return;
    }
    if ((nominationStatus.profileCompletedCount ?? 0) < minAccepted) {
      show(
        `Voting needs at least ${minAccepted} candidates with a completed profile (${nominationStatus.profileCompletedCount ?? 0} so far).`,
        "error"
      );
      return;
    }

    // The panel always passes an explicit window. Guard against being wired
    // directly to onClick (which would pass a MouseEvent) by falling back to
    // prompts only when no usable start/end pair was provided.
    if (typeof input?.startTime !== "string" || typeof input?.endTime !== "string") {
      const start = window.prompt(
        "Voting start (YYYY-MM-DD HH:MM, local time):",
        toLocalInput(new Date(Date.now() + 10 * 60_000))
      );
      if (!start) return;
      const end = window.prompt(
        `Voting end (YYYY-MM-DD HH:MM, at least ${MIN_VOTING_MINUTES} minutes after the start):`,
        toLocalInput(new Date(Date.now() + 70 * 60_000))
      );
      if (!end) return;
      input = { startTime: start, endTime: end };
    }

    const startDate = parseLocal(input.startTime);
    const endDate = parseLocal(input.endTime);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      show("Please enter a valid voting start and end date/time.", "error");
      return;
    }
    if (startDate.getTime() < Date.now() - 60_000) {
      show("Voting cannot start in the past.", "error");
      return;
    }
    if (endDate.getTime() - startDate.getTime() < MIN_VOTING_MINUTES * 60_000) {
      show(`Voting must stay open for at least ${MIN_VOTING_MINUTES} minutes.`, "error");
      return;
    }
    if (endDate.getTime() - startDate.getTime() > MAX_VOTING_MINUTES * 60_000) {
      show("Voting cannot stay open longer than 7 days.", "error");
      return;
    }
    if (
      !window.confirm(
        `Schedule voting from ${startDate.toLocaleString()} to ${endDate.toLocaleString()} with ${nominationStatus.acceptedCount} accepted candidates? Candidates who haven't responded will no longer be able to accept.`
      )
    )
      return;

    setActionLoading("start");
    try {
      await startVoting(id, {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        resultsMode: input.resultsMode,
        resultsReleaseAt: input.resultsReleaseAt,
      });
      show("Voting window scheduled.", "success");
      await Promise.all([refetch(), refetchRequests(), refetchStatus()]);
      navigate("/admin");
    } catch (err) {
      show(formatError(err, "Failed to start voting"), "error");
    } finally {
      setActionLoading(null);
    }
  }


  /**
   * Sends the ONE reminder allowed per nominee, and only to nominees who never
   * responded at all. The server refuses a second send, so the button is also
   * hidden once every remindable nominee has been contacted.
   */
  async function handleSendReminders() {
    if (!id) return;
    setActionLoading("resend");
    try {
      const { data } = await apiClient.post<{ remindersSent: number }>(
        `/admin/elections/${id}/resend-nominations`
      );
      show(
        `Reminder sent to ${data.remindersSent} nominee${data.remindersSent !== 1 ? "s" : ""} who never responded.`,
        "success"
      );
      await refetchStatus();
    } catch (err) {
      show(formatError(err, "Failed to send reminders"), "error");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCloseDraft() {
    if (!id || !election) return;
    if (
      !window.confirm(
        `Cancel "${election.title}"? Voting will not take place, and the election will be kept as cancelled for the audit trail.`
      )
    )
      return;
    setActionLoading("close");
    try {
      await closeDraft(id);

      show("Election cancelled", "success");
      navigate("/admin");
    } catch (err) {
      show(formatError(err, "Failed to close draft"), "error");
    } finally {
      setActionLoading(null);
    }
  }

  // ── final submit (called after auth succeeds) ─────────────────────────────
  async function handleConfirmedSubmit() {
    if (!id || !scheduleValid || selectedVoters.length < 2) return;
    setSubmitting(true);
    try {
      await setNominationDeadline(id, new Date(schedule.nominationDeadline).toISOString());

      const results = await Promise.allSettled(selectedVoters.map((v) => createRequest(id, v.id)));
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        show(`Allowance started. ${selectedVoters.length - failed} request(s) sent; ${failed} failed.`, "success");
      } else {
        show(`Allowance started. Nomination requests sent to ${selectedVoters.length} candidates. Voting dates are set after the allowance ends.`, "success");
      }

      await refetch();
      await refetchRequests();
      navigate("/admin");
    } catch (err) {
      show(formatError(err, "Could not complete election setup"), "error");
    } finally {
      setSubmitting(false);
      setShowAuthModal(false);
    }
  }

  // ── already-started guard (voting is live or closed) ─────────────────────
  if (!loading && election && hasStarted) {
    const candidateCount = election.candidates?.length ?? 0;
    return (
      <Layout>
        <div className="mx-auto max-w-2xl">
          <Link
            to="/admin"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
          <h1 className="mb-2 text-2xl font-bold text-navy-900">{election.title}</h1>
          <div className="flex items-start gap-2 rounded-lg border border-navy-200 bg-navy-50 p-3 text-sm text-navy-700">
            <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-navy-400" />
            <span>
              Voting has started — the ballot is locked. {candidateCount} candidate
              {candidateCount === 1 ? "" : "s"} have completed profiles.
            </span>
          </div>

          <ResultsSettingsCard
            electionId={election.id}
            liveResultsEnabled={election.liveResultsEnabled}
            resultsReleaseAt={election.resultsReleaseAt}
            resultsPublishedAt={election.resultsPublishedAt}
            onUpdated={refetch}
          />

          {candidateCount > 0 && (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {(election.candidates ?? []).map((c: Candidate) => (
                <Card
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-navy-50"
                  onClick={() => setViewingCandidate(c)}
                >
                  {c.photoUrl ? (
                    <img src={c.photoUrl} alt={c.name} className="h-12 w-12 flex-shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-navy-200 text-lg font-bold text-navy-600">
                      {c.name[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-navy-900">{c.name}</p>
                    {c.party && (
                      <p className="flex items-center gap-1 text-xs text-navy-500">
                        <Building2 className="h-3 w-3" />
                        {c.party}
                      </p>
                    )}
                    <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      Profile complete
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        {viewingCandidate && (
          <CandidateDetailsModal candidate={viewingCandidate} readOnly onClose={() => setViewingCandidate(null)} />
        )}
      </Layout>
    );
  }

  // ── LOCKED MODE — requests already sent, election still a draft ───────────
  if (!loading && !requestsLoading && hasExistingRequests) {
    return (

      <Layout>
        <div className="mx-auto max-w-2xl">
          <Link
            to="/admin"
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>

          <div className="mb-1 flex items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-navy-900">{election?.title ?? "Election"}</h1>
            <button
              type="button"
              onClick={async () => { await refetch(); await refetchRequests(); }}
              className="flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-sm text-navy-500 hover:bg-navy-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </div>

          <p className="mb-5 text-sm text-navy-500">
            Requests sent. The invited list is final.
          </p>

          {/* ── Election status: totals, responses, recommendation, actions ── */}
          {nominationStatus ? (
            <NominationStatusPanel
              status={nominationStatus}
              busy={actionLoading}
              onStartVoting={handleStartVoting}
              onExtend={handleExtendAllowance}
              onClose={handleCloseDraft}
            />
          ) : (
            statusLoading && <Spinner label="Loading election status…" />
          )}


          {/* ── One-time reminder (start / extend / close live in the panel) ── */}
          {nominationStatus && (nominationStatus.canSendReminders || nominationStatus.remindersAlreadySent) && (
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSendReminders}
                disabled={actionLoading === "resend" || !nominationStatus.canSendReminders}
                className="flex items-center gap-2 self-start rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-2 text-sm font-medium text-gold-600 hover:bg-gold-400/20 disabled:opacity-40"
              >
                {actionLoading === "resend" ? <Spinner /> : <Send className="h-4 w-4" />}
                {nominationStatus.canSendReminders ? "Send reminder" : "Reminder already sent"}
              </button>
              <p className="text-xs text-navy-400">
                {nominationStatus.canSendReminders
                  ? `Sends a single reminder to the ${nominationStatus.remindableCount} nominee${nominationStatus.remindableCount === 1 ? "" : "s"} who never responded. Each nominee is reminded only once.`
                  : "Every nominee awaiting a response has already received their one reminder."}
              </p>
            </div>
          )}

        </div>

        {viewingCandidate && (
          <CandidateDetailsModal candidate={viewingCandidate} readOnly onClose={() => setViewingCandidate(null)} />
        )}
      </Layout>
    );
  }

  // ── WIZARD MODE — no requests sent yet ───────────────────────────────────
  return (
    <Layout>
      <div className="mx-auto max-w-2xl">
        <Link
          to="/admin"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        {loading && <Spinner label="Loading election…" />}
        {!loading && !election && (
          <EmptyState
            title="Election unavailable"
            description={error ?? "Could not load this election. It may have been removed."}
          />
        )}

        {!loading && election && (
          <>
            <h1 className="mb-1 text-2xl font-bold text-navy-900">{election.title}</h1>
            <p className="mb-6 text-sm text-navy-500">
              Select at least 2 candidates, then set the response deadline.
            </p>

            {/* ── Step indicator ─────────────────────────────────────────── */}
            <div className="mb-6 flex items-center gap-3">
              {([1, 2] as Step[]).map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => step > s && setStep(s)}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                      s === step
                        ? "bg-gold-400 text-navy-950"
                        : s < step
                        ? "cursor-pointer bg-emerald-500 text-white"
                        : "bg-navy-100 text-navy-400"
                    }`}
                    disabled={s > step}
                    aria-label={`Step ${s}`}
                  >
                    {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
                  </button>
                  <span
                    className={`hidden text-sm font-medium sm:block ${
                      s === step ? "text-navy-900" : "text-navy-400"
                    }`}
                  >
                    {s === 1 ? "Select candidates" : "Set timing"}
                  </span>
                  {s < 2 && <ArrowRight className="h-4 w-4 text-navy-300" />}
                </div>
              ))}
            </div>

            {/* ════════════════════════════════════════════════════════════
                STEP 1 — Select candidates
               ════════════════════════════════════════════════════════════ */}
            {step === 1 && (
              <Card className="p-6">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-100">
                    <Users className="h-5 w-5 text-gold-700" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-navy-900">
                      Select candidates
                    </h2>
                    <p className="mt-1 text-sm text-navy-500">
                      Search verified voters. Minimum 2. Requests are sent in the next step.
                    </p>
                  </div>
                </div>

                {/* Search box */}
                <div ref={searchRef} className="relative mb-4">
                  <label className="mb-1.5 block text-sm font-medium text-navy-700">
                    Search voters
                  </label>
                  <div className="relative flex items-center">
                    <Search className="pointer-events-none absolute left-3 h-4 w-4 text-navy-400" />
                    <input
                      type="text"
                      value={voterQuery}
                      onChange={(e) => setVoterQuery(e.target.value)}
                      placeholder="Search by name or voter ID…"
                      className="w-full rounded-lg border border-navy-200 bg-white py-2.5 pl-9 pr-4 text-sm text-navy-900 placeholder:text-navy-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                    />
                  </div>

                  {/* Autocomplete dropdown */}
                  {showDropdown && (
                    <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-navy-200 bg-white shadow-lg">
                      {searching && (
                        <div className="px-4 py-3 text-sm text-navy-400">Searching…</div>
                      )}
                      {!searching && voterResults.length === 0 && (
                        <div className="px-4 py-3 text-sm text-navy-400">
                          No verified voters found
                        </div>
                      )}
                      {!searching &&
                        voterResults.map((v) => {
                          const alreadyAdded = selectedVoters.some((s) => s.id === v.id);
                          return (
                            <div
                              key={v.id}
                              className={`flex w-full items-center gap-3 border-b border-navy-100 px-4 py-3 last:border-0 ${
                                alreadyAdded ? "opacity-40" : "hover:bg-navy-50"
                              }`}
                            >
                              {/* Avatar — tap to view voter details (photo, full ID, wallet status) */}
                              <button
                                type="button"
                                onClick={() => setViewingVoter(v)}
                                className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-100 text-sm font-bold text-navy-600 ring-offset-2 transition hover:ring-2 hover:ring-gold-400"
                                aria-label={`View details for ${v.fullName}`}
                                title="View details"
                              >
                                {v.photoUrl ? (
                                  <img
                                    src={v.photoUrl}
                                    alt={v.fullName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  v.fullName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .slice(0, 2)
                                )}
                              </button>

                              {/* Name + ID — also opens details on tap */}
                              <button
                                type="button"
                                onClick={() => setViewingVoter(v)}
                                className="min-w-0 flex-1 text-left"
                              >
                                <p className="text-sm font-medium text-navy-900 truncate">
                                  {v.fullName}
                                </p>
                                <p className="font-mono text-xs text-navy-500">{v.voterId}</p>
                              </button>

                              <div className="flex flex-shrink-0 items-center gap-1.5">
                                {v.walletLinked && (
                                  <BadgeCheck className="h-4 w-4 text-emerald-500" />
                                )}
                                {alreadyAdded ? (
                                  <span className="text-[10px] font-semibold text-emerald-600">
                                    Added
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => addVoter(v)}
                                    className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700 hover:bg-gold-200"
                                    aria-label={`Add ${v.fullName} as candidate`}
                                    title="Add candidate"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Selected candidates list */}
                {selectedVoters.length > 0 ? (
                  <div className="mb-5 flex flex-col gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">
                      Selected ({selectedVoters.length})
                    </p>
                    {selectedVoters.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center gap-3 rounded-xl border border-navy-200 bg-white px-3 py-2.5"
                      >
                        <button
                          type="button"
                          onClick={() => setViewingVoter(v)}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gold-100 text-sm font-bold text-gold-700 transition hover:ring-2 hover:ring-gold-400"
                          aria-label={`View details for ${v.fullName}`}
                          title="View details"
                        >
                          {v.photoUrl ? (
                            <img
                              src={v.photoUrl}
                              alt={v.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            v.fullName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-semibold text-navy-900">
                            {v.fullName}
                          </p>
                          <p className="font-mono text-xs text-navy-500">{v.voterId}</p>
                        </div>
                        {v.walletLinked && (
                          <BadgeCheck className="h-4 w-4 flex-shrink-0 text-emerald-500" aria-label="Wallet linked" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeVoter(v.id)}
                          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-red-50 hover:text-red-600"
                          aria-label={`Remove ${v.fullName}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mb-5 flex items-center gap-2 rounded-xl border border-dashed border-navy-200 px-4 py-5 text-sm text-navy-400">
                    <UserPlus className="h-5 w-5 flex-shrink-0" />
                    <span>No candidates selected.</span>
                  </div>
                )}

                {selectedVoters.length < 2 && selectedVoters.length > 0 && (
                  <p className="mb-4 flex items-center gap-1.5 text-xs text-amber-700">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
                    At least 2 candidates required. Add {2 - selectedVoters.length} more.
                  </p>
                )}

                <Button
                  fullWidth
                  disabled={selectedVoters.length < 2}
                  onClick={() => setStep(2)}
                >
                  <ArrowRight className="h-4 w-4" />
                  Next — Set timing ({selectedVoters.length} selected)
                </Button>
              </Card>
            )}

            {/* ════════════════════════════════════════════════════════════
                STEP 2 — Set timing
               ════════════════════════════════════════════════════════════ */}
            {step === 2 && (
              <Card className="p-6">
                <div className="mb-4 flex items-start gap-3">
                  <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-100">
                    <CalendarClock className="h-5 w-5 text-gold-700" />
                  </span>
                  <div>
                    <h2 className="text-base font-semibold text-navy-900">Set the allowance period</h2>
                    <p className="mt-1 text-sm text-navy-500">
                      How long candidates have to respond. Voting times are set later, from the
                      election status page.
                    </p>
                  </div>
                </div>

                {/* Info banner */}
                <div className="mb-5 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                  <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>
                    With fewer than 2 acceptances, you can extend the deadline or close the election.
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  {/* Allowance deadline */}
                  <div>
                    <TextField
                      label="Allowance deadline (candidates must accept by this time)"
                      type="datetime-local"
                      required
                      value={schedule.nominationDeadline}
                      onChange={(e) =>
                        setSchedule((p) => ({ ...p, nominationDeadline: e.target.value }))
                      }
                      hint={`Between ${MIN_ALLOWANCE_MINUTES} minutes and 7 days from now. Pending requests expire at this time.`}
                    />
                    {schedule.nominationDeadline && !nominationInFuture && (
                      <p className="mt-1 text-xs text-red-500">
                        Allowance deadline must be in the future.
                      </p>
                    )}
                    {schedule.nominationDeadline && nominationInFuture && !allowanceValid && (
                      <p className="mt-1 text-xs text-red-500">
                        The candidate allowance period must last at least{" "}
                        {MIN_ALLOWANCE_MINUTES} minutes.
                      </p>
                    )}
                    {schedule.nominationDeadline && nominationInFuture && allowanceValid && !allowanceWithinMax && (
                      <p className="mt-1 text-xs text-red-500">
                        The candidate allowance period can't be longer than 7 days.
                      </p>
                    )}
                  </div>

                  {/* Summary of selected candidates */}
                  <div className="rounded-xl border border-navy-100 bg-navy-50 px-4 py-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400">
                      Sending requests to ({selectedVoters.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedVoters.map((v) => (
                        <span
                          key={v.id}
                          className="inline-flex items-center gap-1.5 rounded-full border border-navy-200 bg-white px-2.5 py-1 text-xs font-medium text-navy-700"
                        >
                          {v.fullName}
                          <button
                            type="button"
                            onClick={() => removeVoter(v.id)}
                            className="text-navy-400 hover:text-red-600"
                            aria-label={`Remove ${v.fullName}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    {selectedVoters.length < 2 && (
                      <p className="mt-2 text-xs text-red-500">
                        At least 2 candidates required. Go back to add more.
                      </p>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-1">
                    <Button
                      variant="secondary"
                      onClick={() => setStep(1)}
                      className="flex-shrink-0"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      fullWidth
                      disabled={!scheduleValid || selectedVoters.length < 2}
                      onClick={() => setShowAuthModal(true)}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Create election
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* ── Candidate detail modal ──────────────────────────────────────────── */}
      {viewingCandidate && (
        <CandidateDetailsModal
          candidate={viewingCandidate}
          readOnly
          onClose={() => setViewingCandidate(null)}
        />
      )}

      {/* ── Voter detail modal (from search results / selected list) ───────── */}
      {viewingVoter && (
        <VoterDetailModal
          voter={viewingVoter}
          alreadyAdded={selectedVoters.some((s) => s.id === viewingVoter.id)}
          onAdd={() => {
            addVoter(viewingVoter);
            setViewingVoter(null);
          }}
          onClose={() => setViewingVoter(null)}
        />
      )}

      {/* ── Admin auth modal ────────────────────────────────────────────────── */}
      <AdminAuthModal
        open={showAuthModal}
        title="Confirm election creation"
        description={`Send nomination requests to ${selectedVoters.length} candidate${selectedVoters.length === 1 ? "" : "s"} and schedule the election.`}
        onConfirm={handleConfirmedSubmit}
        onClose={() => setShowAuthModal(false)}
      />
    </Layout>
  );
}
