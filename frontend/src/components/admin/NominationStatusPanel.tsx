import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Info,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { Card } from "../shared/Card";
import { Spinner } from "../shared/Spinner";
import type {
  CandidateResponse,
  NominationStatus,
} from "../../hooks/useAdminElections";

interface Props {
  status: NominationStatus;
  busy: string | null;
  onStartVoting: (input: {
    startTime: string;
    endTime: string;
    resultsMode: "live" | "manual";
    resultsReleaseAt?: string;
  }) => void;
  onExtend: (minutes: number) => void;
  onClose: () => void;
}

const DEFAULT_RESULTS_DELAY_MS = 24 * 60 * 60 * 1000;

function statusLabel(s: CandidateResponse["status"]) {
  if (s === "accepted") return "Accepted";
  if (s === "rejected") return "Rejected";
  return "No response";
}

function statusClass(s: CandidateResponse["status"]) {
  if (s === "accepted") return "bg-emerald-100 text-emerald-700";
  if (s === "rejected") return "bg-red-100 text-red-700";
  return "bg-gold-100 text-gold-800";
}

const PRESETS = [
  { minutes: 10, label: "10 minutes" },
  { minutes: 30, label: "30 minutes" },
  { minutes: 60, label: "1 hour" },
  { minutes: 180, label: "3 hours" },
  { minutes: 360, label: "6 hours" },
  { minutes: 720, label: "12 hours" },
  { minutes: 1440, label: "24 hours" },
];
const MAX_VOTING_MINUTES = 7 * 24 * 60;

function toLocalInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NominationStatusPanel({
  status,
  busy,
  onStartVoting,
  onExtend,
  onClose,
}: Props) {
  const [showExtend, setShowExtend] = useState(false);
  const [minutes, setMinutes] = useState(60);
  const [showSchedule, setShowSchedule] = useState(false);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [resultsMode, setResultsMode] = useState<"live" | "manual">("live");
  const [releaseInput, setReleaseInput] = useState("");

  const { rules } = status;
  const minutesValid =
    Number.isFinite(minutes) &&
    minutes >= rules.minExtensionMinutes &&
    minutes <= rules.maxExtensionMinutes;

  const minVoting = rules.minVotingMinutes || 10;
  const startDate = startInput ? new Date(startInput) : null;
  const endDate = endInput ? new Date(endInput) : null;
  let scheduleError: string | null = null;
  if (
    !startDate ||
    Number.isNaN(startDate.getTime()) ||
    !endDate ||
    Number.isNaN(endDate.getTime())
  ) {
    scheduleError = "Choose both a voting start and a voting end time.";
  } else if (startDate.getTime() < Date.now() - 60_000) {
    scheduleError = "Voting cannot start in the past.";
  } else if (
    status.nominationDeadline &&
    startDate.getTime() < new Date(status.nominationDeadline).getTime()
  ) {
    scheduleError =
      "Voting cannot start before the candidate allowance period ends.";
  } else if (endDate.getTime() - startDate.getTime() < minVoting * 60_000) {
    scheduleError = `Voting must stay open for at least ${minVoting} minutes.`;
  } else if (
    endDate.getTime() - startDate.getTime() >
    MAX_VOTING_MINUTES * 60_000
  ) {
    scheduleError = "Voting cannot stay open longer than 7 days.";
  }

  // The results option only makes sense once the voting window itself is
  // valid — it's the step right after start/end time is fixed.
  const releaseDate = releaseInput ? new Date(releaseInput) : null;
  let resultsError: string | null = null;
  if (!scheduleError && resultsMode === "manual") {
    if (!releaseDate || Number.isNaN(releaseDate.getTime())) {
      resultsError =
        "Choose a results release date, or switch to live results.";
    } else if (endDate && releaseDate.getTime() <= endDate.getTime()) {
      resultsError = "Results release date must be after voting closes.";
    }
  }

  function openSchedule() {
    const now = Date.now();
    const start = new Date(now + 5 * 60_000);
    const end = new Date(now + 65 * 60_000);
    setStartInput(toLocalInput(start));
    setEndInput(toLocalInput(end));
    setResultsMode("live");
    setReleaseInput(
      toLocalInput(new Date(end.getTime() + DEFAULT_RESULTS_DELAY_MS)),
    );
    setShowSchedule(true);
  }

  function handleEndInputChange(value: string) {
    const prevEnd = endInput ? new Date(endInput) : null;
    const prevDefault =
      prevEnd && !Number.isNaN(prevEnd.getTime())
        ? toLocalInput(new Date(prevEnd.getTime() + DEFAULT_RESULTS_DELAY_MS))
        : null;
    setEndInput(value);
    const nextEnd = new Date(value);
    if (
      !Number.isNaN(nextEnd.getTime()) &&
      (!releaseInput || releaseInput === prevDefault)
    ) {
      setReleaseInput(
        toLocalInput(new Date(nextEnd.getTime() + DEFAULT_RESULTS_DELAY_MS)),
      );
    }
  }

  const blocking =
    status.case === "C" || status.case === "D" || status.case === "E";

  return (
    <div className="mb-5">
      {}
      <div
        className={`mb-5 flex items-start gap-3 rounded-lg border p-4 ${
          status.canStartVoting
            ? "border-emerald-200 bg-emerald-50"
            : blocking
              ? "border-red-200 bg-red-50"
              : "border-blue-200 bg-blue-50"
        }`}
      >
        {status.canStartVoting ? (
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
        ) : blocking ? (
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
        ) : (
          <Info className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
        )}
        <div className="flex-1">
          <p
            className={`text-sm font-semibold ${
              status.canStartVoting
                ? "text-emerald-800"
                : blocking
                  ? "text-red-800"
                  : "text-blue-900"
            }`}
          >
            {status.recommendationTitle}
          </p>
          <p
            className={`mt-0.5 text-sm ${
              status.canStartVoting
                ? "text-emerald-700"
                : blocking
                  ? "text-red-700"
                  : "text-blue-800"
            }`}
          >
            {status.recommendation}
          </p>
        </div>
      </div>

      {}
      {status.nominationDeadline && (
        <div className="mb-5 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-700">
            <Clock className="h-4 w-4 flex-shrink-0 text-navy-400" />
            <span>
              {status.allowanceEnded ? "Allowance ended" : "Allowance ends"}:{" "}
              {new Date(status.nominationDeadline).toLocaleString()}
            </span>
          </div>
          {status.startTime && (
            <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-700">
              <CalendarClock className="h-4 w-4 flex-shrink-0 text-navy-400" />
              <span>
                Voting opens: {new Date(status.startTime).toLocaleString()}
              </span>
            </div>
          )}
          {status.endTime && (
            <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-700">
              <CalendarClock className="h-4 w-4 flex-shrink-0 text-navy-400" />
              <span>
                Voting closes: {new Date(status.endTime).toLocaleString()}
              </span>
            </div>
          )}
          {status.allowanceEnded && status.adminWindowEndsAt && (
            <div className="flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-700">
              <Clock className="h-4 w-4 flex-shrink-0 text-navy-400" />
              <span>
                Admin decision window ends:{" "}
                {new Date(status.adminWindowEndsAt).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      )}

      {}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          {
            label: "Invited",
            value: status.totalInvited,
            tone: "text-navy-900",
          },
          {
            label: "Accepted",
            value: status.acceptedCount,
            tone: "text-emerald-600",
          },
          {
            label: "Rejected",
            value: status.rejectedCount,
            tone: "text-red-600",
          },
          {
            label: "No response",
            value: status.noResponseCount,
            tone: "text-gold-700",
          },
        ].map((s) => (
          <Card key={s.label} className="p-3 text-center">
            <p className={`text-2xl font-bold ${s.tone}`}>{s.value}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-navy-400">
              {s.label}
            </p>
          </Card>
        ))}
      </div>

      {}
      <Card className="mb-4 overflow-hidden p-0">
        <div className="border-b border-navy-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">
            Candidate responses
          </p>
        </div>
        <div className="divide-y divide-navy-100">
          {status.candidates.map((c) => (
            <div
              key={c.requestId}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-navy-100 text-sm font-bold text-navy-600">
                  {(c.name || "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-navy-900">
                    {c.name}
                  </p>
                  <p className="text-xs text-navy-500">
                    {c.respondedAt
                      ? `Responded ${new Date(c.respondedAt).toLocaleString()}`
                      : "No response recorded"}
                  </p>
                </div>
              </div>
              <span
                className={`flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(c.status)}`}
              >
                {statusLabel(c.status)}
              </span>
            </div>
          ))}
          {status.candidates.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-navy-400">
              No candidates have been invited yet.
            </p>
          )}
        </div>
      </Card>

      {}
      {showExtend && status.canExtendAllowance && (
        <Card className="mb-4 p-4">
          <p className="text-sm font-semibold text-navy-900">
            Extend the allowance period
          </p>
          <p className="mt-1 text-xs text-navy-500">
            The extension applies only to the {status.noResponseCount} candidate
            {status.noResponseCount === 1 ? "" : "s"} who never responded.
            Candidates who rejected the nomination are not contacted again.
            Voting start and end times move automatically to keep at least{" "}
            {rules.minGapMinutes} minutes between the end of the allowance
            period and the start of voting.
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                type="button"
                onClick={() => setMinutes(p.minutes)}
                className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
                  minutes === p.minutes
                    ? "border-gold-400 bg-gold-400/15 text-gold-700"
                    : "border-navy-200 text-navy-600 hover:bg-navy-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="mt-3 block text-xs font-medium text-navy-500">
            Or enter minutes ({rules.minExtensionMinutes}–
            {rules.maxExtensionMinutes})
            <input
              type="number"
              min={rules.minExtensionMinutes}
              max={rules.maxExtensionMinutes}
              value={minutes}
              onChange={(e) => setMinutes(Number(e.target.value))}
              className="mt-1 w-40 rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
            />
          </label>
          {!minutesValid && (
            <p className="mt-1 text-xs text-red-600">
              Choose between {rules.minExtensionMinutes} minutes and{" "}
              {rules.maxExtensionMinutes / 60} hours.
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={!minutesValid || busy === "extend"}
              onClick={() => onExtend(minutes)}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
            >
              {busy === "extend" ? (
                <Spinner />
              ) : (
                <CalendarClock className="h-4 w-4" />
              )}
              Confirm extension
            </button>
            <button
              type="button"
              onClick={() => setShowExtend(false)}
              className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {}
      {showSchedule && status.canStartVoting && (
        <Card className="mb-4 p-4">
          <p className="text-sm font-semibold text-navy-900">
            Set the voting window
          </p>
          <p className="mt-1 text-xs text-navy-500">
            Voting opens at the start time you pick — not immediately. Pick when
            voting opens and closes. Voting must stay open for at least{" "}
            {minVoting} minutes. Candidates who haven't responded can no longer
            accept once voting is scheduled.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-medium text-navy-500">
              Voting starts
              <input
                type="datetime-local"
                value={startInput}
                onChange={(e) => setStartInput(e.target.value)}
                className="mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
              />
            </label>
            <label className="block text-xs font-medium text-navy-500">
              Voting ends
              <input
                type="datetime-local"
                value={endInput}
                onChange={(e) => handleEndInputChange(e.target.value)}
                className="mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
              />
            </label>
          </div>

          {scheduleError && (
            <p className="mt-2 text-xs text-red-600">{scheduleError}</p>
          )}

          {}
          {!scheduleError && (
            <div className="mt-4 border-t border-navy-100 pt-4">
              <p className="text-sm font-semibold text-navy-900">Results</p>
              <p className="mt-1 text-xs text-navy-500">
                Choose how voters find out the outcome. A manual date can be
                pushed later at any time, including after voting closes.
              </p>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setResultsMode("live")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium ${
                    resultsMode === "live"
                      ? "border-emerald-400 bg-emerald-400/10 text-emerald-700"
                      : "border-navy-200 text-navy-600 hover:bg-navy-50"
                  }`}
                >
                  Live results
                  <span className="block text-xs font-normal text-navy-400">
                    Visible as votes come in
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setResultsMode("manual")}
                  className={`flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium ${
                    resultsMode === "manual"
                      ? "border-gold-400 bg-gold-400/15 text-gold-700"
                      : "border-navy-200 text-navy-600 hover:bg-navy-50"
                  }`}
                >
                  Manual release date
                  <span className="block text-xs font-normal text-navy-400">
                    Revealed at a chosen time
                  </span>
                </button>
              </div>

              {resultsMode === "manual" && (
                <label className="mt-3 block text-xs font-medium text-navy-500">
                  Release results at
                  <input
                    type="datetime-local"
                    value={releaseInput}
                    onChange={(e) => setReleaseInput(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                  />
                </label>
              )}

              {resultsError && (
                <p className="mt-2 text-xs text-red-600">{resultsError}</p>
              )}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={!!scheduleError || !!resultsError || busy === "start"}
              onClick={() =>
                onStartVoting({
                  startTime: startInput,
                  endTime: endInput,
                  resultsMode,
                  ...(resultsMode === "manual" && releaseDate
                    ? { resultsReleaseAt: releaseDate.toISOString() }
                    : {}),
                })
              }
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              {busy === "start" ? (
                <Spinner />
              ) : (
                <PlayCircle className="h-4 w-4" />
              )}
              Confirm voting window
            </button>
            <button
              type="button"
              onClick={() => setShowSchedule(false)}
              className="rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50"
            >
              Cancel
            </button>
          </div>
        </Card>
      )}

      {}
      <div className="flex flex-wrap gap-2">
        {status.canStartVoting && (
          <button
            type="button"
            onClick={openSchedule}
            disabled={busy === "start" || showSchedule}
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            {busy === "start" ? (
              <Spinner />
            ) : (
              <PlayCircle className="h-4 w-4" />
            )}
            Schedule voting
          </button>
        )}

        {status.canExtendAllowance && !showExtend && (
          <button
            type="button"
            onClick={() => setShowExtend(true)}
            className="flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-400/20"
          >
            <CalendarClock className="h-4 w-4" />
            Extend allowance period
          </button>
        )}

        {status.canCloseElection && (
          <button
            type="button"
            onClick={onClose}
            disabled={busy === "close"}
            className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-400/20 disabled:opacity-40"
          >
            {busy === "close" ? <Spinner /> : <Trash2 className="h-4 w-4" />}
            Close election
          </button>
        )}
      </div>

      {!status.canStartVoting && !status.allowanceEnded && (
        <p className="mt-2 text-xs text-navy-400">
          Voting can't be configured yet — it unlocks once the candidate
          allowance period ends.
        </p>
      )}
      {!status.canStartVoting &&
        status.allowanceEnded &&
        status.acceptedCount < rules.minAcceptedCandidates && (
          <p className="mt-2 text-xs text-navy-400">
            Voting can only begin once at least {rules.minAcceptedCandidates}{" "}
            candidates have accepted their nomination.
          </p>
        )}
      {!status.canStartVoting &&
        status.allowanceEnded &&
        status.acceptedCount >= rules.minAcceptedCandidates &&
        status.adminWindowEndsAt && (
          <p className="mt-2 text-xs text-navy-400">
            The 24-hour admin decision window closed at{" "}
            {new Date(status.adminWindowEndsAt).toLocaleString()}.
          </p>
        )}
      {status.case === "D" && (
        <p className="mt-1 text-xs text-navy-400">
          Extending isn't possible here: every remaining candidate has already
          rejected the nomination, so there is nobody left to wait for.
        </p>
      )}
    </div>
  );
}
