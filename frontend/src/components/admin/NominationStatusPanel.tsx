import { useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Info,
  PlayCircle,
  Trash2 
} from
"lucide-react";
import { Card } from "../shared/Card";
import { Spinner } from "../shared/Spinner";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const DEFAULT_RESULTS_DELAY_MS = 24 * 60 * 60 * 1000;

function statusLabel(s) {
  if (s === "accepted") {return "Accepted";}
  if (s === "rejected") {return "Rejected";}
  return "No response";
}

function statusClass(s) {
  if (s === "accepted") {return "bg-emerald-100 text-emerald-700";}
  if (s === "rejected") {return "bg-red-100 text-red-700";}
  return "bg-gold-100 text-gold-800";
}

const PRESETS = [
{ minutes: 10, label: "10 minutes" },
{ minutes: 30, label: "30 minutes" },
{ minutes: 60, label: "1 hour" },
{ minutes: 180, label: "3 hours" },
{ minutes: 360, label: "6 hours" },
{ minutes: 720, label: "12 hours" },
{ minutes: 1440, label: "24 hours" }];

const MAX_VOTING_MINUTES = 7 * 24 * 60;

function toLocalInput(d) {
  const pad = (n) => {return String(n).padStart(2, "0");};
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function NominationStatusPanel({
  status,
  busy,
  onStartVoting,
  onExtend,
  onClose
}) {
  const [showExtend, setShowExtend] = useState(false);
  const [minutes, setMinutes] = useState(60);
  const [showSchedule, setShowSchedule] = useState(false);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [resultsMode, setResultsMode] = useState("live");
  const [releaseInput, setReleaseInput] = useState("");

  const { rules } = status;
  const minutesValid =
  Number.isFinite(minutes) &&
  minutes >= rules.minExtensionMinutes &&
  minutes <= rules.maxExtensionMinutes;

  const minVoting = rules.minVotingMinutes || 10;
  const startDate = startInput ? new Date(startInput) : null;
  const endDate = endInput ? new Date(endInput) : null;
  let scheduleError = null;
  if (!startDate || Number.isNaN(startDate.getTime()) || !endDate || Number.isNaN(endDate.getTime())) {
    scheduleError = "Choose both a voting start and a voting end time.";
  } else if (startDate.getTime() < Date.now() - 60_000) {
    scheduleError = "Voting cannot start in the past.";
  } else if (status.nominationDeadline && startDate.getTime() < new Date(status.nominationDeadline).getTime()) {
    scheduleError = "Voting cannot start before the candidate allowance period ends.";
  } else if (endDate.getTime() - startDate.getTime() < minVoting * 60_000) {
    scheduleError = `Voting must stay open for at least ${minVoting} minutes.`;
  } else if (endDate.getTime() - startDate.getTime() > MAX_VOTING_MINUTES * 60_000) {
    scheduleError = "Voting cannot stay open longer than 7 days.";
  }

  const releaseDate = releaseInput ? new Date(releaseInput) : null;
  let resultsError = null;
  if (!scheduleError && resultsMode === "manual") {
    if (!releaseDate || Number.isNaN(releaseDate.getTime())) {
      resultsError = "Choose a results release date, or switch to live results.";
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
    setReleaseInput(toLocalInput(new Date(end.getTime() + DEFAULT_RESULTS_DELAY_MS)));
    setShowSchedule(true);
  }

  function handleEndInputChange(value) {
    const prevEnd = endInput ? new Date(endInput) : null;
    const prevDefault =
    prevEnd && !Number.isNaN(prevEnd.getTime()) ?
    toLocalInput(new Date(prevEnd.getTime() + DEFAULT_RESULTS_DELAY_MS)) :
    null;
    setEndInput(value);
    const nextEnd = new Date(value);
    if (!Number.isNaN(nextEnd.getTime()) && (!releaseInput || releaseInput === prevDefault)) {
      setReleaseInput(toLocalInput(new Date(nextEnd.getTime() + DEFAULT_RESULTS_DELAY_MS)));
    }
  }

  const blocking = status.case === "C" || status.case === "D" || status.case === "E";

  return (
    _jsxDEV("div", {
 className: "mb-5", children: [

      _jsxDEV("div", {
        className: `mb-5 flex items-start gap-3 rounded-lg border p-4 ${
        status.canStartVoting ?
        "border-emerald-200 bg-emerald-50" :
        blocking ?
        "border-red-200 bg-red-50" :
        "border-blue-200 bg-blue-50"}`, children: [

        status.canStartVoting ?
        _jsxDEV(CheckCircle2, { className: "mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" }, void 0, false) :
        blocking ?
        _jsxDEV(AlertTriangle, { className: "mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" }, void 0, false) :

        _jsxDEV(Info, { className: "mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" }, void 0, false),

        _jsxDEV("div", {
 className: "flex-1", children: [
          _jsxDEV("p", {
            className: `text-sm font-semibold ${
            status.canStartVoting ?
            "text-emerald-800" :
            blocking ?
            "text-red-800" :
            "text-blue-900"}`, children:

            status.recommendationTitle 
}, void 0, false
          ),
          _jsxDEV("p", {
            className: `mt-0.5 text-sm ${
            status.canStartVoting ?
            "text-emerald-700" :
            blocking ?
            "text-red-700" :
            "text-blue-800"}`, children:

            status.recommendation 
}, void 0, false
          )] 
}, void 0, true
        )] 
}, void 0, true
      ),

      status.nominationDeadline &&
      _jsxDEV("div", {
 className: "mb-5 grid gap-2 sm:grid-cols-2", children: [
        _jsxDEV("div", {
 className: "flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-700", children: [
          _jsxDEV(Clock, { className: "h-4 w-4 flex-shrink-0 text-navy-400" }, void 0, false),
          _jsxDEV("span", {
 children: [
            status.allowanceEnded ? "Allowance ended" : "Allowance ends", ":", " ",
            new Date(status.nominationDeadline).toLocaleString()] 
}, void 0, true
          )] 
}, void 0, true
        ),
        status.startTime &&
        _jsxDEV("div", {
 className: "flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-700", children: [
          _jsxDEV(CalendarClock, { className: "h-4 w-4 flex-shrink-0 text-navy-400" }, void 0, false),
          _jsxDEV("span", { children: ["Voting opens: ", new Date(status.startTime).toLocaleString()] }, void 0, true)] 
}, void 0, true
        ),

        status.endTime &&
        _jsxDEV("div", {
 className: "flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-700", children: [
          _jsxDEV(CalendarClock, { className: "h-4 w-4 flex-shrink-0 text-navy-400" }, void 0, false),
          _jsxDEV("span", { children: ["Voting closes: ", new Date(status.endTime).toLocaleString()] }, void 0, true)] 
}, void 0, true
        ),

        status.allowanceEnded && status.adminWindowEndsAt &&
        _jsxDEV("div", {
 className: "flex items-center gap-2 rounded-lg border border-navy-200 bg-navy-50 px-4 py-3 text-sm text-navy-700", children: [
          _jsxDEV(Clock, { className: "h-4 w-4 flex-shrink-0 text-navy-400" }, void 0, false),
          _jsxDEV("span", {
 children: ["Admin decision window ends: ",
            new Date(status.adminWindowEndsAt).toLocaleString()] 
}, void 0, true
          )] 
}, void 0, true
        )] 
}, void 0, true

      ),

      _jsxDEV("div", {
 className: "mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4", children:
        [
        { label: "Invited", value: status.totalInvited, tone: "text-navy-900" },
        { label: "Accepted", value: status.acceptedCount, tone: "text-emerald-600" },
        { label: "Rejected", value: status.rejectedCount, tone: "text-red-600" },
        { label: "No response", value: status.noResponseCount, tone: "text-gold-700" }].
        map((s) => {return (
            _jsxDEV(Card, {
 className: "p-3 text-center", children: [
              _jsxDEV("p", { className: `text-2xl font-bold ${s.tone}`, children: s.value }, void 0, false),
              _jsxDEV("p", {
 className: "text-xs font-medium uppercase tracking-wide text-navy-400", children:
                s.label 
}, void 0, false
              )] 
}, s.label, true
            ));
        }) 
}, void 0, false
      ),

      _jsxDEV(Card, {
 className: "mb-4 overflow-hidden p-0", children: [
        _jsxDEV("div", {
 className: "border-b border-navy-100 px-4 py-3", children:
          _jsxDEV("p", { className: "text-xs font-semibold uppercase tracking-wide text-navy-400", children: "Candidate responses" }, void 0, false

          ) 
}, void 0, false
        ),
        _jsxDEV("div", {
 className: "divide-y divide-navy-100", children: [
          status.candidates.map((c) => {return (
              _jsxDEV("div", {
 className: "flex items-center justify-between gap-3 px-4 py-3", children: [
                _jsxDEV("div", {
 className: "flex min-w-0 items-center gap-3", children: [
                  _jsxDEV("div", {
 className: "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-navy-100 text-sm font-bold text-navy-600", children:
                    (c.name || "?").charAt(0).toUpperCase() 
}, void 0, false
                  ),
                  _jsxDEV("div", {
 className: "min-w-0", children: [
                    _jsxDEV("p", { className: "truncate text-sm font-medium text-navy-900", children: c.name }, void 0, false),
                    _jsxDEV("p", {
 className: "text-xs text-navy-500", children:
                      c.respondedAt ?
                      `Responded ${new Date(c.respondedAt).toLocaleString()}` :
                      "No response recorded" 
}, void 0, false
                    )] 
}, void 0, true
                  )] 
}, void 0, true
                ),
                _jsxDEV("span", {
                  className: `flex-shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(c.status)}`, children:

                  statusLabel(c.status) 
}, void 0, false
                )] 
}, c.requestId, true
              ));
          }),
          status.candidates.length === 0 &&
          _jsxDEV("p", { className: "px-4 py-6 text-center text-sm text-navy-400", children: "No candidates have been invited yet." }, void 0, false

          )] 
}, void 0, true

        )] 
}, void 0, true
      ),

      showExtend && status.canExtendAllowance &&
      _jsxDEV(Card, {
 className: "mb-4 p-4", children: [
        _jsxDEV("p", { className: "text-sm font-semibold text-navy-900", children: "Extend the allowance period" }, void 0, false),
        _jsxDEV("p", {
 className: "mt-1 text-xs text-navy-500", children: ["The extension applies only to the ",
          status.noResponseCount, " candidate",
          status.noResponseCount === 1 ? "" : "s", " who never responded. Candidates who rejected the nomination are not contacted again. Voting start and end times move automatically to keep at least ",

          rules.minGapMinutes, " minutes between the end of the allowance period and the start of voting."] 
}, void 0, true

        ),

        _jsxDEV("div", {
 className: "mt-3 flex flex-wrap gap-2", children:
          PRESETS.map((p) => {return (
              _jsxDEV("button", {

                type: "button",
                onClick: () => {return setMinutes(p.minutes);},
                className: `rounded-lg border px-3 py-1.5 text-sm font-medium ${
                minutes === p.minutes ?
                "border-gold-400 bg-gold-400/15 text-gold-700" :
                "border-navy-200 text-navy-600 hover:bg-navy-50"}`, children:

                p.label 
}, p.minutes, false
              ));
          }) 
}, void 0, false
        ),

        _jsxDEV("label", {
 className: "mt-3 block text-xs font-medium text-navy-500", children: ["Or enter minutes (",
          rules.minExtensionMinutes, "–", rules.maxExtensionMinutes, ")",
          _jsxDEV("input", {
            type: "number",
            min: rules.minExtensionMinutes,
            max: rules.maxExtensionMinutes,
            value: minutes,
            onChange: (e) => {return setMinutes(Number(e.target.value));},
            className: "mt-1 w-40 rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" 
}, void 0, false
          )] 
}, void 0, true
        ),
        !minutesValid &&
        _jsxDEV("p", {
 className: "mt-1 text-xs text-red-600", children: ["Choose between ",
          rules.minExtensionMinutes, " minutes and", " ",
          rules.maxExtensionMinutes / 60, " hours."] 
}, void 0, true
        ),

        _jsxDEV("div", {
 className: "mt-4 flex gap-2", children: [
          _jsxDEV("button", {
            type: "button",
            disabled: !minutesValid || busy === "extend",
            onClick: () => {return onExtend(minutes);},
            className: "flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-40", children: [

            busy === "extend" ? _jsxDEV(Spinner, {}, void 0, false) : _jsxDEV(CalendarClock, { className: "h-4 w-4" }, void 0, false), "Confirm extension"] 
}, void 0, true

          ),
          _jsxDEV("button", {
            type: "button",
            onClick: () => {return setShowExtend(false);},
            className: "rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50", children:
            "Cancel" 
}, void 0, false

          )] 
}, void 0, true
        )] 
}, void 0, true
      ),

      showSchedule && status.canStartVoting &&
      _jsxDEV(Card, {
 className: "mb-4 p-4", children: [
        _jsxDEV("p", { className: "text-sm font-semibold text-navy-900", children: "Set the voting window" }, void 0, false),
        _jsxDEV("p", {
 className: "mt-1 text-xs text-navy-500", children: ["Voting opens at the start time you pick — not immediately. Pick when voting opens and closes. Voting must stay open for at least ",
          minVoting, " ", "minutes. Candidates who haven't responded can no longer accept once voting is scheduled."] 
}, void 0, true

        ),

        _jsxDEV("div", {
 className: "mt-3 grid gap-3 sm:grid-cols-2", children: [
          _jsxDEV("label", {
 className: "block text-xs font-medium text-navy-500", children: ["Voting starts",

            _jsxDEV("input", {
              type: "datetime-local",
              value: startInput,
              onChange: (e) => {return setStartInput(e.target.value);},
              className: "mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" 
}, void 0, false
            )] 
}, void 0, true
          ),
          _jsxDEV("label", {
 className: "block text-xs font-medium text-navy-500", children: ["Voting ends",

            _jsxDEV("input", {
              type: "datetime-local",
              value: endInput,
              onChange: (e) => {return handleEndInputChange(e.target.value);},
              className: "mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" 
}, void 0, false
            )] 
}, void 0, true
          )] 
}, void 0, true
        ),

        scheduleError && _jsxDEV("p", { className: "mt-2 text-xs text-red-600", children: scheduleError }, void 0, false),

        !scheduleError &&
        _jsxDEV("div", {
 className: "mt-4 border-t border-navy-100 pt-4", children: [
          _jsxDEV("p", { className: "text-sm font-semibold text-navy-900", children: "Results" }, void 0, false),
          _jsxDEV("p", { className: "mt-1 text-xs text-navy-500", children: "Choose how voters find out the outcome. A manual date can be pushed later at any time, including after voting closes." }, void 0, false

          ),

          _jsxDEV("div", {
 className: "mt-3 flex gap-2", children: [
            _jsxDEV("button", {
              type: "button",
              onClick: () => {return setResultsMode("live");},
              className: `flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium ${
              resultsMode === "live" ?
              "border-emerald-400 bg-emerald-400/10 text-emerald-700" :
              "border-navy-200 text-navy-600 hover:bg-navy-50"}`, children: [

              "Live results",

              _jsxDEV("span", { className: "block text-xs font-normal text-navy-400", children: "Visible as votes come in" }, void 0, false

              )] 
}, void 0, true
            ),
            _jsxDEV("button", {
              type: "button",
              onClick: () => {return setResultsMode("manual");},
              className: `flex-1 rounded-lg border px-3 py-2 text-left text-sm font-medium ${
              resultsMode === "manual" ?
              "border-gold-400 bg-gold-400/15 text-gold-700" :
              "border-navy-200 text-navy-600 hover:bg-navy-50"}`, children: [

              "Manual release date",

              _jsxDEV("span", { className: "block text-xs font-normal text-navy-400", children: "Revealed at a chosen time" }, void 0, false

              )] 
}, void 0, true
            )] 
}, void 0, true
          ),

          resultsMode === "manual" &&
          _jsxDEV("label", {
 className: "mt-3 block text-xs font-medium text-navy-500", children: ["Release results at",

            _jsxDEV("input", {
              type: "datetime-local",
              value: releaseInput,
              onChange: (e) => {return setReleaseInput(e.target.value);},
              className: "mt-1 w-full rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-900 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" 
}, void 0, false
            )] 
}, void 0, true
          ),

          resultsError && _jsxDEV("p", { className: "mt-2 text-xs text-red-600", children: resultsError }, void 0, false)] 
}, void 0, true
        ),

        _jsxDEV("div", {
 className: "mt-4 flex gap-2", children: [
          _jsxDEV("button", {
            type: "button",
            disabled: !!scheduleError || !!resultsError || busy === "start",
            onClick: () =>
            {return onStartVoting({
                startTime: startInput,
                endTime: endInput,
                resultsMode,
                ...(resultsMode === "manual" && releaseDate ?
                { resultsReleaseAt: releaseDate.toISOString() } :
                {})
              });},

            className: "flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40", children: [

            busy === "start" ? _jsxDEV(Spinner, {}, void 0, false) : _jsxDEV(PlayCircle, { className: "h-4 w-4" }, void 0, false), "Confirm voting window"] 
}, void 0, true

          ),
          _jsxDEV("button", {
            type: "button",
            onClick: () => {return setShowSchedule(false);},
            className: "rounded-lg border border-navy-200 px-4 py-2 text-sm font-medium text-navy-600 hover:bg-navy-50", children:
            "Cancel" 
}, void 0, false

          )] 
}, void 0, true
        )] 
}, void 0, true
      ),

      _jsxDEV("div", {
 className: "flex flex-wrap gap-2", children: [
        status.canStartVoting &&
        _jsxDEV("button", {
          type: "button",
          onClick: openSchedule,
          disabled: busy === "start" || showSchedule,
          className: "flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40", children: [

          busy === "start" ? _jsxDEV(Spinner, {}, void 0, false) : _jsxDEV(PlayCircle, { className: "h-4 w-4" }, void 0, false), "Schedule voting"] 
}, void 0, true

        ),

        status.canExtendAllowance && !showExtend &&
        _jsxDEV("button", {
          type: "button",
          onClick: () => {return setShowExtend(true);},
          className: "flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-400/10 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-400/20", children: [

          _jsxDEV(CalendarClock, { className: "h-4 w-4" }, void 0, false), "Extend allowance period"] 
}, void 0, true

        ),

        status.canCloseElection &&
        _jsxDEV("button", {
          type: "button",
          onClick: onClose,
          disabled: busy === "close",
          className: "flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-400/20 disabled:opacity-40", children: [

          busy === "close" ? _jsxDEV(Spinner, {}, void 0, false) : _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false), "Close election"] 
}, void 0, true

        )] 
}, void 0, true

      ),

      !status.canStartVoting && !status.allowanceEnded &&
      _jsxDEV("p", { className: "mt-2 text-xs text-navy-400", children: "Voting can't be configured yet — it unlocks once the candidate allowance period ends." }, void 0, false

      ),

      !status.canStartVoting && status.allowanceEnded && status.acceptedCount < rules.minAcceptedCandidates &&
      _jsxDEV("p", {
 className: "mt-2 text-xs text-navy-400", children: ["Voting can only begin once at least ",
        rules.minAcceptedCandidates, " candidates have accepted their nomination."] 
}, void 0, true

      ),

      !status.canStartVoting &&
      status.allowanceEnded &&
      status.acceptedCount >= rules.minAcceptedCandidates &&
      status.adminWindowEndsAt &&
      _jsxDEV("p", {
 className: "mt-2 text-xs text-navy-400", children: ["The 24-hour admin decision window closed at",
        " ",
        new Date(status.adminWindowEndsAt).toLocaleString(), "."] 
}, void 0, true
      ),

      status.case === "D" &&
      _jsxDEV("p", { className: "mt-1 text-xs text-navy-400", children: "Extending isn't possible here: every remaining candidate has already rejected the nomination, so there is nobody left to wait for." }, void 0, false

      )] 
}, void 0, true

    ));

}