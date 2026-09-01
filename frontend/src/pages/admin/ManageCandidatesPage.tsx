import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, UserPlus, Search, BadgeCheck, X, Plus,
  CalendarClock, Info, CheckCircle2, AlertTriangle, Lock, Users,
  Building2, Clock, Send, Trash2, RefreshCw 
} from
"lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { TextField } from "../../components/shared/Input";
import { Spinner } from "../../components/shared/Spinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { AdminAuthModal } from "../../components/auth/AdminAuthModal";
import { useElection, deriveStatus } from "../../hooks/useElections";

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
  useCloseDraftElection 
} from

"../../hooks/useAdminElections";
import { NominationStatusPanel } from "../../components/admin/NominationStatusPanel";
import { ResultsSettingsCard } from "../../components/admin/ResultsSettingsCard";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";
import { apiClient } from "../../lib/apiClient";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const MIN_ALLOWANCE_MINUTES = 10;
const MAX_ALLOWANCE_MINUTES = 7 * 24 * 60;
const MIN_VOTING_MINUTES = 10;
const MAX_VOTING_MINUTES = 7 * 24 * 60;

function parseLocal(value) {
  return new Date(value.trim().replace(" ", "T"));
}

function toLocalInput(d) {
  const pad = (n) => {return String(n).padStart(2, "0");};
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusClass(status) {
  if (status === "accepted") {return "bg-emerald-100 text-emerald-700";}
  if (status === "rejected") {return "bg-red-100 text-red-700";}
  if (status === "expired") {return "bg-navy-100 text-navy-600";}
  return "bg-gold-100 text-gold-800";
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
    refetch: refetchStatus
  } = useNominationStatus(id);
  const { startVoting } = useStartVoting();
  const { extendAllowance } = useExtendAllowance();
  const { closeDraft } = useCloseDraftElection();
  const { show } = useToast();

  const [step, setStep] = useState(1);
  const [selectedVoters, setSelectedVoters] = useState([]);
  const [voterQuery, setVoterQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [schedule, setSchedule] = useState({ nominationDeadline: "" });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [viewingCandidate, setViewingCandidate] = useState(null);
  const [viewingVoter, setViewingVoter] = useState(null);

  const [actionLoading, setActionLoading] = useState(null);

  const searchRef = useRef(null);

  const hasStarted = Boolean(election) && deriveStatus(election) !== "draft";

  const hasExistingRequests = !requestsLoading && requests.length > 0;

  const pendingCount = requests.filter((r) => {return r.status === "pending";}).length;
  const acceptedCount = requests.filter((r) => {return r.status === "accepted";}).length;

  const profileDoneCount = nominationStatus?.profileCompletedCount ?? election?.candidates?.length ?? 0;
  const allResolved = pendingCount === 0 && requests.length > 0;
  const canEarlyClose = allResolved && profileDoneCount < 2;

  const nominationDate = schedule.nominationDeadline ?
  new Date(schedule.nominationDeadline) :
  null;

  const allowanceMinutes = nominationDate ?
  (nominationDate.getTime() - Date.now()) / 60_000 :
  null;
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

  useEffect(() => {
    function onOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => {return document.removeEventListener("mousedown", onOutside);};
  }, []);

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
    return () => {return clearTimeout(timer);};
  }, [voterQuery, search, clear]);

  function addVoter(voter) {
    if (selectedVoters.some((v) => {return v.id === voter.id;})) {return;}
    setSelectedVoters((prev) => {return [...prev, voter];});
    setVoterQuery("");
    clear();
    setShowDropdown(false);
  }

  function removeVoter(voterId) {
    setSelectedVoters((prev) => {return prev.filter((v) => {return v.id !== voterId;});});
  }

  async function handleExtendAllowance(minutes) {
    if (!id) {return;}
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

  async function handleStartVoting(input)

  {
    if (!id || !nominationStatus) {return;}

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

    if (typeof input?.startTime !== "string" || typeof input?.endTime !== "string") {
      const start = window.prompt(
        "Voting start (YYYY-MM-DD HH:MM, local time):",
        toLocalInput(new Date(Date.now() + 10 * 60_000))
      );
      if (!start) {return;}
      const end = window.prompt(
        `Voting end (YYYY-MM-DD HH:MM, at least ${MIN_VOTING_MINUTES} minutes after the start):`,
        toLocalInput(new Date(Date.now() + 70 * 60_000))
      );
      if (!end) {return;}
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
    ))

    {return;}

    setActionLoading("start");
    try {
      await startVoting(id, {
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        resultsMode: input.resultsMode,
        resultsReleaseAt: input.resultsReleaseAt
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

  async function handleSendReminders() {
    if (!id) {return;}
    setActionLoading("resend");
    try {
      const { data } = await apiClient.post(
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
    if (!id || !election) {return;}
    if (
    !window.confirm(
      `Cancel "${election.title}"? Voting will not take place, and the election will be kept as cancelled for the audit trail.`
    ))

    {return;}
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

  async function handleConfirmedSubmit() {
    if (!id || !scheduleValid || selectedVoters.length < 2) {return;}
    setSubmitting(true);
    try {
      await setNominationDeadline(id, new Date(schedule.nominationDeadline).toISOString());

      const results = await Promise.allSettled(selectedVoters.map((v) => {return createRequest(id, v.id);}));
      const failed = results.filter((r) => {return r.status === "rejected";}).length;
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

  if (!loading && election && hasStarted) {
    const candidateCount = election.candidates?.length ?? 0;
    return (
      _jsxDEV(Layout, {
 children: [
        _jsxDEV("div", {
 className: "mx-auto max-w-2xl", children: [
          _jsxDEV(Link, {
            to: "/admin",
            className: "mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800", children: [

            _jsxDEV(ArrowLeft, { className: "h-4 w-4" }, void 0, false), "Back to dashboard"] 
}, void 0, true

          ),
          _jsxDEV("h1", { className: "mb-2 text-2xl font-bold text-navy-900", children: election.title }, void 0, false),
          _jsxDEV("div", {
 className: "flex items-start gap-2 rounded-lg border border-navy-200 bg-navy-50 p-3 text-sm text-navy-700", children: [
            _jsxDEV(Lock, { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-navy-400" }, void 0, false),
            _jsxDEV("span", {
 children: ["Voting has started — the ballot is locked. ",
              candidateCount, " candidate",
              candidateCount === 1 ? "" : "s", " have completed profiles."] 
}, void 0, true
            )] 
}, void 0, true
          ),

          _jsxDEV(ResultsSettingsCard, {
            electionId: election.id,
            liveResultsEnabled: election.liveResultsEnabled,
            resultsReleaseAt: election.resultsReleaseAt,
            resultsPublishedAt: election.resultsPublishedAt,
            onUpdated: refetch 
}, void 0, false
          ),

          candidateCount > 0 &&
          _jsxDEV("div", {
 className: "mt-6 grid gap-3 sm:grid-cols-2", children:
            (election.candidates ?? []).map((c) => {return (
                _jsxDEV(Card, {

                  className: "flex cursor-pointer items-center gap-3 p-4 transition-colors hover:bg-navy-50",
                  onClick: () => {return setViewingCandidate(c);}, children: [

                  c.photoUrl ?
                  _jsxDEV("img", { src: c.photoUrl, alt: c.name, className: "h-12 w-12 flex-shrink-0 rounded-lg object-cover" }, void 0, false) :

                  _jsxDEV("div", {
 className: "flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-navy-200 text-lg font-bold text-navy-600", children:
                    c.name[0] 
}, void 0, false
                  ),

                  _jsxDEV("div", {
 className: "min-w-0", children: [
                    _jsxDEV("p", { className: "truncate font-semibold text-navy-900", children: c.name }, void 0, false),
                    c.party &&
                    _jsxDEV("p", {
 className: "flex items-center gap-1 text-xs text-navy-500", children: [
                      _jsxDEV(Building2, { className: "h-3 w-3" }, void 0, false),
                      c.party] 
}, void 0, true
                    ),

                    _jsxDEV("span", { className: "mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700", children: "Profile complete" }, void 0, false

                    )] 
}, void 0, true
                  )] 
}, c.id, true
                ));
            }) 
}, void 0, false
          )] 
}, void 0, true

        ),
        viewingCandidate &&
        _jsxDEV(CandidateDetailsModal, { candidate: viewingCandidate, readOnly: true, onClose: () => {return setViewingCandidate(null);} }, void 0, false)] 
}, void 0, true

      ));

  }

  if (!loading && !requestsLoading && hasExistingRequests) {
    return (

      _jsxDEV(Layout, {
 children: [
        _jsxDEV("div", {
 className: "mx-auto max-w-2xl", children: [
          _jsxDEV(Link, {
            to: "/admin",
            className: "mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800", children: [

            _jsxDEV(ArrowLeft, { className: "h-4 w-4" }, void 0, false), "Back to dashboard"] 
}, void 0, true

          ),

          _jsxDEV("div", {
 className: "mb-1 flex items-center justify-between gap-2", children: [
            _jsxDEV("h1", { className: "text-2xl font-bold text-navy-900", children: election?.title ?? "Election" }, void 0, false),
            _jsxDEV("button", {
              type: "button",
              onClick: async () => {await refetch();await refetchRequests();},
              className: "flex items-center gap-1.5 rounded-lg border border-navy-200 px-3 py-1.5 text-sm text-navy-500 hover:bg-navy-50", children: [

              _jsxDEV(RefreshCw, { className: "h-3.5 w-3.5" }, void 0, false), "Refresh"] 
}, void 0, true

            )] 
}, void 0, true
          ),

          _jsxDEV("p", { className: "mb-5 text-sm text-navy-500", children: "Requests sent. The invited list is final." }, void 0, false

          ),

          nominationStatus ?
          _jsxDEV(NominationStatusPanel, {
            status: nominationStatus,
            busy: actionLoading,
            onStartVoting: handleStartVoting,
            onExtend: handleExtendAllowance,
            onClose: handleCloseDraft 
}, void 0, false
          ) :

          statusLoading && _jsxDEV(Spinner, { label: "Loading election status…" }, void 0, false),

          nominationStatus && (nominationStatus.canSendReminders || nominationStatus.remindersAlreadySent) &&
          _jsxDEV("div", {
 className: "flex flex-col gap-2", children: [
            _jsxDEV("button", {
              type: "button",
              onClick: handleSendReminders,
              disabled: actionLoading === "resend" || !nominationStatus.canSendReminders,
              className: "flex items-center gap-2 self-start rounded-lg border border-gold-400/30 bg-gold-400/10 px-3 py-2 text-sm font-medium text-gold-600 hover:bg-gold-400/20 disabled:opacity-40", children: [

              actionLoading === "resend" ? _jsxDEV(Spinner, {}, void 0, false) : _jsxDEV(Send, { className: "h-4 w-4" }, void 0, false),
              nominationStatus.canSendReminders ? "Send reminder" : "Reminder already sent"] 
}, void 0, true
            ),
            _jsxDEV("p", {
 className: "text-xs text-navy-400", children:
              nominationStatus.canSendReminders ?
              `Sends a single reminder to the ${nominationStatus.remindableCount} nominee${nominationStatus.remindableCount === 1 ? "" : "s"} who never responded. Each nominee is reminded only once.` :
              "Every nominee awaiting a response has already received their one reminder." 
}, void 0, false
            )] 
}, void 0, true
          )] 
}, void 0, true

        ),

        viewingCandidate &&
        _jsxDEV(CandidateDetailsModal, { candidate: viewingCandidate, readOnly: true, onClose: () => {return setViewingCandidate(null);} }, void 0, false)] 
}, void 0, true

      ));

  }

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "mx-auto max-w-2xl", children: [
        _jsxDEV(Link, {
          to: "/admin",
          className: "mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800", children: [

          _jsxDEV(ArrowLeft, { className: "h-4 w-4" }, void 0, false), "Back to dashboard"] 
}, void 0, true

        ),

        loading && _jsxDEV(Spinner, { label: "Loading election…" }, void 0, false),
        !loading && !election &&
        _jsxDEV(EmptyState, {
          title: "Election unavailable",
          description: error ?? "Could not load this election. It may have been removed." 
}, void 0, false
        ),

        !loading && election &&
        _jsxDEV(_Fragment, {
 children: [
          _jsxDEV("h1", { className: "mb-1 text-2xl font-bold text-navy-900", children: election.title }, void 0, false),
          _jsxDEV("p", { className: "mb-6 text-sm text-navy-500", children: "Select at least 2 candidates, then set the response deadline." }, void 0, false

          ),

          _jsxDEV("div", {
 className: "mb-6 flex items-center gap-3", children:
            [1, 2].map((s) => {return (
                _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                  _jsxDEV("button", {
                    type: "button",
                    onClick: () => {return step > s && setStep(s);},
                    className: `flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    s === step ?
                    "bg-gold-400 text-navy-950" :
                    s < step ?
                    "cursor-pointer bg-emerald-500 text-white" :
                    "bg-navy-100 text-navy-400"}`,

                    disabled: s > step,
                    "aria-label": `Step ${s}`, children:

                    s < step ? _jsxDEV(CheckCircle2, { className: "h-4 w-4" }, void 0, false) : s 
}, void 0, false
                  ),
                  _jsxDEV("span", {
                    className: `hidden text-sm font-medium sm:block ${
                    s === step ? "text-navy-900" : "text-navy-400"}`, children:

                    s === 1 ? "Select candidates" : "Set timing" 
}, void 0, false
                  ),
                  s < 2 && _jsxDEV(ArrowRight, { className: "h-4 w-4 text-navy-300" }, void 0, false)] 
}, s, true
                ));
            }) 
}, void 0, false
          ),

          step === 1 &&
          _jsxDEV(Card, {
 className: "p-6", children: [
            _jsxDEV("div", {
 className: "mb-4 flex items-start gap-3", children: [
              _jsxDEV("span", {
 className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-100", children:
                _jsxDEV(Users, { className: "h-5 w-5 text-gold-700" }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("div", {
 children: [
                _jsxDEV("h2", { className: "text-base font-semibold text-navy-900", children: "Select candidates" }, void 0, false

                ),
                _jsxDEV("p", { className: "mt-1 text-sm text-navy-500", children: "Search verified voters. Minimum 2. Requests are sent in the next step." }, void 0, false

                )] 
}, void 0, true
              )] 
}, void 0, true
            ),

            _jsxDEV("div", {
 ref: searchRef, className: "relative mb-4", children: [
              _jsxDEV("label", { className: "mb-1.5 block text-sm font-medium text-navy-700", children: "Search voters" }, void 0, false

              ),
              _jsxDEV("div", {
 className: "relative flex items-center", children: [
                _jsxDEV(Search, { className: "pointer-events-none absolute left-3 h-4 w-4 text-navy-400" }, void 0, false),
                _jsxDEV("input", {
                  type: "text",
                  value: voterQuery,
                  onChange: (e) => {return setVoterQuery(e.target.value);},
                  placeholder: "Search by name or voter ID…",
                  className: "w-full rounded-lg border border-navy-200 bg-white py-2.5 pl-9 pr-4 text-sm text-navy-900 placeholder:text-navy-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" 
}, void 0, false
                )] 
}, void 0, true
              ),

              showDropdown &&
              _jsxDEV("div", {
 className: "absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-navy-200 bg-white shadow-lg", children: [
                searching &&
                _jsxDEV("div", { className: "px-4 py-3 text-sm text-navy-400", children: "Searching…" }, void 0, false),

                !searching && voterResults.length === 0 &&
                _jsxDEV("div", { className: "px-4 py-3 text-sm text-navy-400", children: "No verified voters found" }, void 0, false

                ),

                !searching &&
                voterResults.map((v) => {
                  const alreadyAdded = selectedVoters.some((s) => {return s.id === v.id;});
                  return (
                    _jsxDEV("div", {

                      className: `flex w-full items-center gap-3 border-b border-navy-100 px-4 py-3 last:border-0 ${
                      alreadyAdded ? "opacity-40" : "hover:bg-navy-50"}`, children: [

                      _jsxDEV("button", {
                        type: "button",
                        onClick: () => {return setViewingVoter(v);},
                        className: "flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-100 text-sm font-bold text-navy-600 ring-offset-2 transition hover:ring-2 hover:ring-gold-400",
                        "aria-label": `View details for ${v.fullName}`,
                        title: "View details", children:

                        v.photoUrl ?
                        _jsxDEV("img", {
                          src: v.photoUrl,
                          alt: v.fullName,
                          className: "h-full w-full object-cover" 
}, void 0, false
                        ) :

                        v.fullName.
                        split(" ").
                        map((n) => {return n[0];}).
                        join("").
                        slice(0, 2) 
}, void 0, false

                      ),

                      _jsxDEV("button", {
                        type: "button",
                        onClick: () => {return setViewingVoter(v);},
                        className: "min-w-0 flex-1 text-left", children: [

                        _jsxDEV("p", {
 className: "text-sm font-medium text-navy-900 truncate", children:
                          v.fullName 
}, void 0, false
                        ),
                        _jsxDEV("p", { className: "font-mono text-xs text-navy-500", children: v.voterId }, void 0, false)] 
}, void 0, true
                      ),

                      _jsxDEV("div", {
 className: "flex flex-shrink-0 items-center gap-1.5", children: [
                        v.walletLinked &&
                        _jsxDEV(BadgeCheck, { className: "h-4 w-4 text-emerald-500" }, void 0, false),

                        alreadyAdded ?
                        _jsxDEV("span", { className: "text-[10px] font-semibold text-emerald-600", children: "Added" }, void 0, false

                        ) :

                        _jsxDEV("button", {
                          type: "button",
                          onClick: () => {return addVoter(v);},
                          className: "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-gold-100 text-gold-700 hover:bg-gold-200",
                          "aria-label": `Add ${v.fullName} as candidate`,
                          title: "Add candidate", children:

                          _jsxDEV(Plus, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
                        )] 
}, void 0, true

                      )] 
}, v.id, true
                    ));

                })] 
}, void 0, true
              )] 
}, void 0, true

            ),

            selectedVoters.length > 0 ?
            _jsxDEV("div", {
 className: "mb-5 flex flex-col gap-2", children: [
              _jsxDEV("p", {
 className: "text-xs font-semibold uppercase tracking-wide text-navy-400", children: ["Selected (",
                selectedVoters.length, ")"] 
}, void 0, true
              ),
              selectedVoters.map((v) => {return (
                  _jsxDEV("div", {

                    className: "flex items-center gap-3 rounded-xl border border-navy-200 bg-white px-3 py-2.5", children: [

                    _jsxDEV("button", {
                      type: "button",
                      onClick: () => {return setViewingVoter(v);},
                      className: "flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gold-100 text-sm font-bold text-gold-700 transition hover:ring-2 hover:ring-gold-400",
                      "aria-label": `View details for ${v.fullName}`,
                      title: "View details", children:

                      v.photoUrl ?
                      _jsxDEV("img", {
                        src: v.photoUrl,
                        alt: v.fullName,
                        className: "h-full w-full object-cover" 
}, void 0, false
                      ) :

                      v.fullName.
                      split(" ").
                      map((n) => {return n[0];}).
                      join("").
                      slice(0, 2) 
}, void 0, false

                    ),
                    _jsxDEV("div", {
 className: "flex-1 min-w-0", children: [
                      _jsxDEV("p", {
 className: "truncate text-sm font-semibold text-navy-900", children:
                        v.fullName 
}, void 0, false
                      ),
                      _jsxDEV("p", { className: "font-mono text-xs text-navy-500", children: v.voterId }, void 0, false)] 
}, void 0, true
                    ),
                    v.walletLinked &&
                    _jsxDEV(BadgeCheck, { className: "h-4 w-4 flex-shrink-0 text-emerald-500", "aria-label": "Wallet linked" }, void 0, false),

                    _jsxDEV("button", {
                      type: "button",
                      onClick: () => {return removeVoter(v.id);},
                      className: "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-red-50 hover:text-red-600",
                      "aria-label": `Remove ${v.fullName}`, children:

                      _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
                    )] 
}, v.id, true
                  ));
              })] 
}, void 0, true
            ) :

            _jsxDEV("div", {
 className: "mb-5 flex items-center gap-2 rounded-xl border border-dashed border-navy-200 px-4 py-5 text-sm text-navy-400", children: [
              _jsxDEV(UserPlus, { className: "h-5 w-5 flex-shrink-0" }, void 0, false),
              _jsxDEV("span", { children: "No candidates selected." }, void 0, false)] 
}, void 0, true
            ),

            selectedVoters.length < 2 && selectedVoters.length > 0 &&
            _jsxDEV("p", {
 className: "mb-4 flex items-center gap-1.5 text-xs text-amber-700", children: [
              _jsxDEV(AlertTriangle, { className: "h-3.5 w-3.5 flex-shrink-0" }, void 0, false), "At least 2 candidates required. Add ",
              2 - selectedVoters.length, " more."] 
}, void 0, true
            ),

            _jsxDEV(Button, {
              fullWidth: true,
              disabled: selectedVoters.length < 2,
              onClick: () => {return setStep(2);}, children: [

              _jsxDEV(ArrowRight, { className: "h-4 w-4" }, void 0, false), "Next — Set timing (",
              selectedVoters.length, " selected)"] 
}, void 0, true
            )] 
}, void 0, true
          ),

          step === 2 &&
          _jsxDEV(Card, {
 className: "p-6", children: [
            _jsxDEV("div", {
 className: "mb-4 flex items-start gap-3", children: [
              _jsxDEV("span", {
 className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gold-100", children:
                _jsxDEV(CalendarClock, { className: "h-5 w-5 text-gold-700" }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("div", {
 children: [
                _jsxDEV("h2", { className: "text-base font-semibold text-navy-900", children: "Set the allowance period" }, void 0, false),
                _jsxDEV("p", { className: "mt-1 text-sm text-navy-500", children: "How long candidates have to respond. Voting times are set later, from the election status page." }, void 0, false

                )] 
}, void 0, true
              )] 
}, void 0, true
            ),

            _jsxDEV("div", {
 className: "mb-5 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800", children: [
              _jsxDEV(Info, { className: "mt-0.5 h-4 w-4 flex-shrink-0" }, void 0, false),
              _jsxDEV("span", { children: "With fewer than 2 acceptances, you can extend the deadline or close the election." }, void 0, false

              )] 
}, void 0, true
            ),

            _jsxDEV("div", {
 className: "flex flex-col gap-4", children: [

              _jsxDEV("div", {
 children: [
                _jsxDEV(TextField, {
                  label: "Allowance deadline (candidates must accept by this time)",
                  type: "datetime-local",
                  required: true,
                  value: schedule.nominationDeadline,
                  onChange: (e) =>
                  {return setSchedule((p) => {return { ...p, nominationDeadline: e.target.value };});},

                  hint: `Between ${MIN_ALLOWANCE_MINUTES} minutes and 7 days from now. Pending requests expire at this time.` 
}, void 0, false
                ),
                schedule.nominationDeadline && !nominationInFuture &&
                _jsxDEV("p", { className: "mt-1 text-xs text-red-500", children: "Allowance deadline must be in the future." }, void 0, false

                ),

                schedule.nominationDeadline && nominationInFuture && !allowanceValid &&
                _jsxDEV("p", {
 className: "mt-1 text-xs text-red-500", children: ["The candidate allowance period must last at least",
                  " ",
                  MIN_ALLOWANCE_MINUTES, " minutes."] 
}, void 0, true
                ),

                schedule.nominationDeadline && nominationInFuture && allowanceValid && !allowanceWithinMax &&
                _jsxDEV("p", { className: "mt-1 text-xs text-red-500", children: "The candidate allowance period can't be longer than 7 days." }, void 0, false

                )] 
}, void 0, true

              ),

              _jsxDEV("div", {
 className: "rounded-xl border border-navy-100 bg-navy-50 px-4 py-3", children: [
                _jsxDEV("p", {
 className: "mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400", children: ["Sending requests to (",
                  selectedVoters.length, ")"] 
}, void 0, true
                ),
                _jsxDEV("div", {
 className: "flex flex-wrap gap-2", children:
                  selectedVoters.map((v) => {return (
                      _jsxDEV("span", {

                        className: "inline-flex items-center gap-1.5 rounded-full border border-navy-200 bg-white px-2.5 py-1 text-xs font-medium text-navy-700", children: [

                        v.fullName,
                        _jsxDEV("button", {
                          type: "button",
                          onClick: () => {return removeVoter(v.id);},
                          className: "text-navy-400 hover:text-red-600",
                          "aria-label": `Remove ${v.fullName}`, children:

                          _jsxDEV(X, { className: "h-3 w-3" }, void 0, false) 
}, void 0, false
                        )] 
}, v.id, true
                      ));
                  }) 
}, void 0, false
                ),
                selectedVoters.length < 2 &&
                _jsxDEV("p", { className: "mt-2 text-xs text-red-500", children: "At least 2 candidates required. Go back to add more." }, void 0, false

                )] 
}, void 0, true

              ),

              _jsxDEV("div", {
 className: "flex gap-3 pt-1", children: [
                _jsxDEV(Button, {
                  variant: "secondary",
                  onClick: () => {return setStep(1);},
                  className: "flex-shrink-0", children: [

                  _jsxDEV(ArrowLeft, { className: "h-4 w-4" }, void 0, false), "Back"] 
}, void 0, true

                ),
                _jsxDEV(Button, {
                  fullWidth: true,
                  disabled: !scheduleValid || selectedVoters.length < 2,
                  onClick: () => {return setShowAuthModal(true);}, children: [

                  _jsxDEV(CheckCircle2, { className: "h-4 w-4" }, void 0, false), "Create election"] 
}, void 0, true

                )] 
}, void 0, true
              )] 
}, void 0, true
            )] 
}, void 0, true
          )] 
}, void 0, true

        )] 
}, void 0, true

      ),

      viewingCandidate &&
      _jsxDEV(CandidateDetailsModal, {
        candidate: viewingCandidate,
        readOnly: true,
        onClose: () => {return setViewingCandidate(null);} 
}, void 0, false
      ),

      viewingVoter &&
      _jsxDEV(VoterDetailModal, {
        voter: viewingVoter,
        alreadyAdded: selectedVoters.some((s) => {return s.id === viewingVoter.id;}),
        onAdd: () => {
          addVoter(viewingVoter);
          setViewingVoter(null);
        },
        onClose: () => {return setViewingVoter(null);} 
}, void 0, false
      ),

      _jsxDEV(AdminAuthModal, {
        open: showAuthModal,
        title: "Confirm election creation",
        description: `Send nomination requests to ${selectedVoters.length} candidate${selectedVoters.length === 1 ? "" : "s"} and schedule the election.`,
        onConfirm: handleConfirmedSubmit,
        onClose: () => {return setShowAuthModal(false);} 
}, void 0, false
      )] 
}, void 0, true
    ));

}