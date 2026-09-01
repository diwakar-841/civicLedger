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
import { formatError } from "../../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const MIN_EXTEND_HOURS = 10;
const MAX_EXTEND_HOURS = 24;
const DEFAULT_EXTEND_HOURS = 12;

function countdownTo(iso) {
  if (!iso) {return null;}
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) {return null;}
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor(totalMinutes % 1440 / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) {return `${days}d ${hours}h`;}
  if (hours > 0) {return `${hours}h ${minutes}m`;}
  return `${minutes}m`;
}

function statusPillClasses(status) {
  switch (status) {
    case "Accepted":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "Rejected":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-navy-100 text-navy-600 dark:bg-navy-800 dark:text-navy-300";
  }
}

function statusIcon(status) {
  if (status === "Accepted") {return _jsxDEV(CheckCircle2, { className: "h-3.5 w-3.5" }, void 0, false);}
  if (status === "Rejected") {return _jsxDEV(XCircle, { className: "h-3.5 w-3.5" }, void 0, false);}
  return _jsxDEV(Clock3, { className: "h-3.5 w-3.5" }, void 0, false);
}

export function ElectionStatusPage() {
  const { id } = useParams();
  const { show } = useToast();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [extendOpen, setExtendOpen] = useState(false);
  const navigate = useNavigate();
  const [extendHours, setExtendHours] = useState(DEFAULT_EXTEND_HOURS);

  const [, setTick] = useState(0);

  const fetchSummary = useCallback(async () => {
    if (!id) {return;}
    try {
      setLoading(true);
      const { data } = await apiClient.get(`/admin/elections/${id}/status`);
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

  useEffect(() => {
    const tick = setInterval(() => {return setTick((t) => {return t + 1;});}, 30_000);
    const refresh = setInterval(() => {return fetchSummary();}, 60_000);
    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, [fetchSummary]);

  function handleStartVoting() {
    if (!id) {return;}
    navigate(`/admin/elections/${id}/candidates`);
  }

  async function handleExtend() {
    if (!id) {return;}
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
    if (!id || !summary) {return;}
    if (!window.confirm("Cancel this election permanently?")) {return;}
    setActionLoading("close");
    try {
      await apiClient.post(`/admin/elections/${id}/cancel`);
      show("Election cancelled", "success");

      navigate("/admin/elections");
    } catch (err) {
      show(formatError(err, "Failed to close draft"), "error");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {return _jsxDEV(Layout, { children: _jsxDEV(Spinner, { label: "Loading election status" }, void 0, false) }, void 0, false);}
  if (error || !summary) {return _jsxDEV(Layout, { children: _jsxDEV(EmptyState, { title: "Error", description: error ?? "Election not found" }, void 0, false) }, void 0, false);}

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV(Link, {
        to: "/admin/elections",
        className: "mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-700 dark:text-navy-400 dark:hover:text-navy-200", children: [

        _jsxDEV(ArrowLeft, { className: "h-4 w-4" }, void 0, false), "Back to elections"] 
}, void 0, true

      ),

      _jsxDEV("div", {
 className: "mb-6", children: [
        _jsxDEV("h1", { className: "text-2xl font-bold text-navy-900 dark:text-navy-50", children: "Election Status" }, void 0, false),
        _jsxDEV("p", { className: "mt-1 text-sm text-navy-500 dark:text-navy-400", children: "Candidate allowance breakdown and recommended next step." }, void 0, false

        )] 
}, void 0, true
      ),

      _jsxDEV("div", {
 className: "mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4", children: [
        _jsxDEV(SummaryStat, { label: "Total invited", value: summary.totalInvited }, void 0, false),
        _jsxDEV(SummaryStat, { label: "Accepted", value: summary.accepted, highlight: summary.accepted >= 2 }, void 0, false),
        _jsxDEV(SummaryStat, { label: "Rejected", value: summary.rejected }, void 0, false),
        _jsxDEV(SummaryStat, { label: "No response", value: summary.noResponse }, void 0, false)] 
}, void 0, true
      ),

      summary.allowanceEnded && summary.decisionWindowOpen &&
      _jsxDEV(Card, {
 className: "mb-4 border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20", children: [
        _jsxDEV("p", {
 className: "text-sm font-semibold text-amber-800 dark:text-amber-300", children: [
          summary.decisionPhase === "final" ?
          "Final 24-hour admin decision period" :
          "First 24-hour admin decision period",
          countdownTo(summary.adminWindowEndsAt) &&
          _jsxDEV("span", {
 className: "ml-2 font-normal", children: ["— ",
            countdownTo(summary.adminWindowEndsAt), " left"] 
}, void 0, true
          )] 
}, void 0, true

        ),
        _jsxDEV("p", {
 className: "mt-1 text-xs text-amber-700 dark:text-amber-400", children: [
          summary.decisionPhase === "final" ?
          "Already extended once. Start voting (2+ accepted) or cancel." :
          "Start voting (2+ accepted), extend once for non-responders, or cancel.", " ", "If this period expires without a decision, the election is cancelled automatically."] 
}, void 0, true

        )] 
}, void 0, true
      ),

      _jsxDEV(Card, {
        className: `mb-6 p-4 dark:bg-navy-900 ${
        summary.mustClose ?
        "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/20" :
        summary.canStartVoting ?
        "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20" :
        ""}`, children: [

        _jsxDEV("p", {
          className: `text-sm font-medium ${
          summary.mustClose ?
          "text-red-700 dark:text-red-400" :
          summary.canStartVoting ?
          "text-emerald-700 dark:text-emerald-400" :
          "text-navy-700 dark:text-navy-200"}`, children:

          summary.recommendation 
}, void 0, false
        ),

        _jsxDEV("div", {
 className: "mt-4 flex flex-wrap gap-2", children: [
          summary.canStartVoting &&
          _jsxDEV("button", {
            onClick: handleStartVoting,
            disabled: actionLoading === "start",
            className: "flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-40 dark:text-emerald-400",
            type: "button", children: [

            actionLoading === "start" ? _jsxDEV(Spinner, {}, void 0, false) : _jsxDEV(PlayCircle, { className: "h-4 w-4" }, void 0, false), "Schedule voting"] 
}, void 0, true

          ),

          summary.canExtend && !extendOpen &&
          _jsxDEV("button", {
            onClick: () => {return setExtendOpen(true);},
            className: "flex items-center gap-2 rounded-lg border border-blue-400/30 bg-blue-400/10 px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-400/20 dark:text-blue-400",
            type: "button", children: [

            _jsxDEV(Calendar, { className: "h-4 w-4" }, void 0, false), "Extend Allowance"] 
}, void 0, true

          ),

          summary.allowanceEnded && !summary.canExtend && summary.extensionUsed &&
          _jsxDEV("span", {
 className: "flex items-center gap-2 rounded-lg border border-navy-200 px-3 py-2 text-sm text-navy-500 dark:border-navy-700 dark:text-navy-400", children: [
            _jsxDEV(Calendar, { className: "h-4 w-4" }, void 0, false), "Extension already used"] 
}, void 0, true

          ),

          summary.canCancel &&
          _jsxDEV("button", {
            onClick: handleClose,
            disabled: actionLoading === "close",
            className: "flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-400/20 disabled:opacity-40 dark:text-red-400",
            type: "button", children: [

            actionLoading === "close" ? _jsxDEV(Spinner, {}, void 0, false) : _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false), "Cancel Election"] 
}, void 0, true

          )] 
}, void 0, true

        ),

        extendOpen &&
        _jsxDEV("div", {
 className: "mt-4 flex flex-wrap items-end gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30", children: [
          _jsxDEV("div", {
 children: [
            _jsxDEV("label", { className: "mb-1 block text-[10px] font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400", children: "Extend by (hours)" }, void 0, false

            ),
            _jsxDEV("input", {
              type: "number",
              min: MIN_EXTEND_HOURS,
              max: MAX_EXTEND_HOURS,
              value: extendHours,
              onChange: (e) => {return setExtendHours(Number(e.target.value));},
              className: "w-28 rounded-lg border border-navy-200 px-2 py-1.5 text-sm dark:border-navy-700 dark:bg-navy-900" 
}, void 0, false
            )] 
}, void 0, true
          ),
          _jsxDEV("p", {
 className: "pb-2 text-xs text-navy-500 dark:text-navy-400", children: [
            MIN_EXTEND_HOURS, "h – ", MAX_EXTEND_HOURS, "h. Applies only to candidates with no response, and can be used only once — afterwards you get a final 24-hour decision period."] 
}, void 0, true

          ),
          _jsxDEV("div", {
 className: "ml-auto flex gap-2", children: [
            _jsxDEV("button", {
              onClick: handleExtend,
              disabled: actionLoading === "extend",
              className: "flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40",
              type: "button", children:

              actionLoading === "extend" ? _jsxDEV(Spinner, {}, void 0, false) : "Confirm" 
}, void 0, false
            ),
            _jsxDEV("button", {
              onClick: () => {return setExtendOpen(false);},
              className: "rounded-lg border border-navy-200 px-3 py-1.5 text-sm text-navy-600 dark:border-navy-700 dark:text-navy-300",
              type: "button", children:
              "Cancel" 
}, void 0, false

            )] 
}, void 0, true
          )] 
}, void 0, true
        )] 
}, void 0, true

      ),

      _jsxDEV(Card, {
 className: "overflow-hidden dark:bg-navy-900 dark:border-navy-700", children:
        _jsxDEV("table", {
 className: "w-full text-left text-sm", children: [
          _jsxDEV("thead", {
 className: "bg-navy-50 text-[10px] font-semibold uppercase tracking-wide text-navy-400 dark:bg-navy-800", children:
            _jsxDEV("tr", {
 children: [
              _jsxDEV("th", { className: "px-4 py-3", children: "Name" }, void 0, false),
              _jsxDEV("th", { className: "px-4 py-3", children: "Status" }, void 0, false),
              _jsxDEV("th", { className: "px-4 py-3", children: "Profile" }, void 0, false),
              _jsxDEV("th", { className: "px-4 py-3", children: "Response time" }, void 0, false)] 
}, void 0, true
            ) 
}, void 0, false
          ),
          _jsxDEV("tbody", {
 className: "divide-y divide-navy-100 dark:divide-navy-800", children: [
            summary.candidates.map((c) => {return (
                _jsxDEV("tr", {
 children: [
                  _jsxDEV("td", { className: "px-4 py-3 font-medium text-navy-800 dark:text-navy-100", children: c.name }, void 0, false),
                  _jsxDEV("td", {
 className: "px-4 py-3", children:
                    _jsxDEV("span", {
 className: `inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClasses(c.displayStatus)}`, children: [
                      statusIcon(c.displayStatus),
                      c.displayStatus] 
}, void 0, true
                    ) 
}, void 0, false
                  ),
                  _jsxDEV("td", {
 className: "px-4 py-3 text-navy-500 dark:text-navy-400", children:
                    c.status === "accepted" ? c.profileCompleted ? "Complete" : "Pending" : "—" 
}, void 0, false
                  ),
                  _jsxDEV("td", {
 className: "px-4 py-3 text-navy-500 dark:text-navy-400", children:
                    c.respondedAt ? new Date(c.respondedAt).toLocaleString() : "—" 
}, void 0, false
                  )] 
}, c.requestId, true
                ));
            }),
            summary.candidates.length === 0 &&
            _jsxDEV("tr", {
 children:
              _jsxDEV("td", { colSpan: 4, className: "px-4 py-6 text-center text-navy-400", children: "No candidates have been invited yet." }, void 0, false

              ) 
}, void 0, false
            )] 
}, void 0, true

          )] 
}, void 0, true
        ) 
}, void 0, false
      ),

      _jsxDEV("div", {
 className: "mt-4", children:
        summary.status === "draft" ?
        _jsxDEV(Link, {
 to: `/admin/elections/${id}/candidates`, children:
          _jsxDEV(Button, { size: "sm", variant: "secondary", children: "Manage candidates" }, void 0, false) 
}, void 0, false
        ) :

        _jsxDEV(Link, {
 to: `/admin/elections/${id}/analytics`, children:
          _jsxDEV(Button, { size: "sm", variant: "secondary", children: "View results" }, void 0, false) 
}, void 0, false
        ) 
}, void 0, false

      )] 
}, void 0, true
    ));

}

function SummaryStat({ label, value, highlight = false }) {
  return (
    _jsxDEV("div", {
 className: "rounded-lg bg-navy-50 p-3 dark:bg-navy-800", children: [
      _jsxDEV("p", { className: "text-[10px] font-semibold uppercase tracking-wide text-navy-400", children: label }, void 0, false),
      _jsxDEV("p", {
 className: `mt-1 text-xl font-bold ${highlight ? "text-emerald-600 dark:text-emerald-400" : "text-navy-900 dark:text-navy-100"}`, children:
        value 
}, void 0, false
      )] 
}, void 0, true
    ));

}