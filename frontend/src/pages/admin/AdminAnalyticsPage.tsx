import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { BarChart3, Download, RefreshCw, ArrowLeft, Users, Trophy, ListChecks, Radio, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend 
} from
"recharts";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { Spinner } from "../../components/shared/Spinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/Badge";
import { useResultsSummary } from "../../hooks/useResultsSummary";
import { useElection, deriveStatus } from "../../hooks/useElections";
import { ElectionDeleteMenu } from "../../components/admin/ElectionDeleteMenu";
import { canDeleteElection } from "../../lib/electionRules";
import { CandidateDetailsModal } from "../../components/voting/CandidateDetailModal";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

function initials(name) {
  return name.
  split(" ").
  filter(Boolean).
  slice(0, 2).
  map((w) => {return w[0].toUpperCase();}).
  join("");
}

const GOLD = "#dfab38";
const NAVY = "#3d5091";
const COLORS = [GOLD, NAVY, "#5c6fac", "#c9922a", "#2b3c74", "#eac25e"];

export function AdminAnalyticsPage() {
  const { id } = useParams();
  const { election } = useElection(id);
  const { summary, loading, error, refetch } = useResultsSummary(id);
  const [exporting, setExporting] = useState(false);

  const [detailsCandidate, setDetailsCandidate] = useState(null);

  function candidateProfile(candidateId) {
    return election?.candidates?.find((c) => {return c.id === candidateId;}) ?? null;
  }

  function handleExport() {
    setExporting(true);
    const base = import.meta.env.VITE_API_URL ?? "";
    const link = document.createElement("a");
    link.href = `${base}/results/${id}/export.csv`;
    link.download = `results-${id}.csv`;
    link.click();
    setTimeout(() => {return setExporting(false);}, 1500);
  }

  const barData = summary?.candidates.map((c) => {return {
      name: c.name,
      votes: c.votes,
      percent: c.percent
    };}) ?? [];

  const pieData = summary?.candidates.map((c) => {return {
      name: c.name,
      value: c.votes
    };}) ?? [];

  const sortedCandidates = summary ? [...summary.candidates].sort((a, b) => {return b.votes - a.votes;}) : [];
  const leader = sortedCandidates.length > 0 && sortedCandidates[0].votes > 0 ? sortedCandidates[0] : null;
  const isFinal = election ? deriveStatus(election) === "closed" : false;

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "mx-auto max-w-4xl", children: [
        _jsxDEV(Link, {
 to: "/admin", className: "mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 hover:text-navy-800 dark:text-navy-400 dark:hover:text-navy-200", children: [
          _jsxDEV(ArrowLeft, { className: "h-4 w-4" }, void 0, false), "Back to dashboard"] 
}, void 0, true

        ),

        _jsxDEV("div", {
 className: "relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-6 py-7 text-white shadow-xl shadow-indigo-600/20 sm:px-9 sm:py-8", children: [
          _jsxDEV("div", { className: "pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[24px] border-white/10" }, void 0, false),
          _jsxDEV("div", { className: "pointer-events-none absolute bottom-[-5rem] right-24 h-40 w-40 rounded-full bg-teal-300/20 blur-2xl" }, void 0, false),
          _jsxDEV("div", {
 className: "relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
            _jsxDEV("div", {
 children: [
              _jsxDEV("p", {
 className: "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-200", children: [
                _jsxDEV(BarChart3, { className: "h-3.5 w-3.5" }, void 0, false), "Analytics"] 
}, void 0, true

              ),
              _jsxDEV("h1", { className: "mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl", children: election?.title ?? "Election analytics" }, void 0, false),
              election && _jsxDEV("div", { className: "mt-2", children: _jsxDEV(StatusBadge, { status: deriveStatus(election) }, void 0, false) }, void 0, false)] 
}, void 0, true
            ),
            _jsxDEV("div", {
 className: "flex flex-wrap items-center gap-2", children: [
              _jsxDEV(Button, {
 size: "sm", variant: "ghost", onClick: refetch, className: "!bg-white/10 !text-white hover:!bg-white/20", children: [
                _jsxDEV(RefreshCw, { className: "h-4 w-4" }, void 0, false), "Refresh"] 
}, void 0, true

              ),
              _jsxDEV(Button, {
 size: "sm", variant: "secondary", onClick: handleExport, loading: exporting, children: [
                _jsxDEV(Download, { className: "h-4 w-4" }, void 0, false), "Export CSV"] 
}, void 0, true

              ),
              election && canDeleteElection(election) && _jsxDEV(ElectionDeleteMenu, { election: election }, void 0, false)] 
}, void 0, true
            )] 
}, void 0, true
          )] 
}, void 0, true
        ),

        loading && _jsxDEV(Spinner, { label: "Loading results" }, void 0, false),
        !loading && error && _jsxDEV(EmptyState, { title: "Results unavailable", description: error }, void 0, false),

        !loading && !error && summary &&
        _jsxDEV(_Fragment, {
 children: [

          _jsxDEV(motion.div, {
 ...fadeIn, className: "mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3", children: [
            _jsxDEV(Card, {
 className: "flex flex-col gap-1 p-5 dark:bg-navy-900 dark:border-navy-700", children: [
              _jsxDEV("span", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-600 dark:bg-navy-800 dark:text-gold-400", children: _jsxDEV(Users, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
              _jsxDEV("p", { className: "mt-1 text-2xl font-extrabold text-navy-900 dark:text-navy-50", children: summary.totalVotesCast }, void 0, false),
              _jsxDEV("p", { className: "text-xs font-semibold text-navy-500", children: "Total votes cast" }, void 0, false)] 
}, void 0, true
            ),
            _jsxDEV(Card, {
 className: "flex flex-col gap-1 p-5 dark:bg-navy-900 dark:border-navy-700", children: [
              _jsxDEV("span", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-navy-800 dark:text-indigo-400", children: _jsxDEV(ListChecks, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
              _jsxDEV("p", { className: "mt-1 text-2xl font-extrabold text-navy-900 dark:text-navy-50", children: summary.candidates.length }, void 0, false),
              _jsxDEV("p", { className: "text-xs font-semibold text-navy-500", children: "Candidates" }, void 0, false)] 
}, void 0, true
            ),
            _jsxDEV(Card, {
 className: "col-span-2 flex flex-col gap-1 p-5 dark:bg-navy-900 dark:border-navy-700 sm:col-span-1", children: [
              _jsxDEV("span", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-navy-800 dark:text-emerald-400", children: _jsxDEV(Trophy, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
              _jsxDEV("p", { className: "mt-1 truncate text-lg font-extrabold text-navy-900 dark:text-navy-50", children: leader ? leader.name : "—" }, void 0, false),
              _jsxDEV("p", { className: "text-xs font-semibold text-navy-500", children: leader ? isFinal ? `Winner · ${leader.percent}%` : `Leading with ${leader.percent}%` : "No votes yet" }, void 0, false)] 
}, void 0, true
            )] 
}, void 0, true
          ),

          summary.candidates.length === 0 ?
          _jsxDEV(EmptyState, { title: "No votes yet", description: "Results will appear once votes are cast." }, void 0, false) :

          _jsxDEV(_Fragment, {
 children: [

            _jsxDEV(motion.div, {
 ...fadeIn, transition: { ...fadeIn.transition, delay: 0.05 }, children:
              _jsxDEV(Card, {
 className: "mb-6 p-6 dark:bg-navy-900 dark:border-navy-700", children: [
                _jsxDEV("div", {
 className: "mb-4 flex items-center justify-between", children: [
                  _jsxDEV("h2", { className: "text-sm font-semibold uppercase tracking-wide text-navy-400 dark:text-navy-500", children: "Vote breakdown" }, void 0, false),
                  deriveStatus(election ?? { startTime: null, endTime: null }) === "active" &&
                  _jsxDEV("span", {
 className: "flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", children: [
                    _jsxDEV(Radio, { className: "h-3 w-3 animate-pulse" }, void 0, false), " Live"] 
}, void 0, true
                  )] 
}, void 0, true

                ),
                _jsxDEV(ResponsiveContainer, {
 width: "100%", height: 260, children:
                  _jsxDEV(BarChart, {
 data: barData, margin: { top: 4, right: 4, left: -20, bottom: 0 }, children: [
                    _jsxDEV(XAxis, { dataKey: "name", tick: { fontSize: 12, fill: "#5c6fac" }, axisLine: { stroke: "#e2e8f0" }, tickLine: false }, void 0, false),
                    _jsxDEV(YAxis, { allowDecimals: false, tick: { fontSize: 11, fill: "#5c6fac" }, axisLine: false, tickLine: false }, void 0, false),
                    _jsxDEV(Tooltip, {
                      cursor: { fill: "rgba(91, 95, 239, 0.06)" },
                      formatter: (value, _name, props) => {return [
                        `${value} votes (${props.payload?.percent ?? 0}%)`,
                        "Votes"];
                      },
                      contentStyle: { borderRadius: 12, border: "1px solid #b0bfdf", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(12,20,40,.25)" } 
}, void 0, false
                    ),
                    _jsxDEV(Bar, {
 dataKey: "votes", radius: [6, 6, 0, 0], maxBarSize: 56, children:
                      barData.map((_entry, index) => {return (
                          _jsxDEV(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`, false));
                      }) 
}, void 0, false
                    )] 
}, void 0, true
                  ) 
}, void 0, false
                )] 
}, void 0, true
              ) 
}, void 0, false
            ),

            _jsxDEV(motion.div, {
 ...fadeIn, transition: { ...fadeIn.transition, delay: 0.1 }, children:
              _jsxDEV("div", {
 className: "grid gap-6 sm:grid-cols-2", children: [
                _jsxDEV(Card, {
 className: "p-6 dark:bg-navy-900 dark:border-navy-700", children: [
                  _jsxDEV("h2", { className: "mb-4 text-sm font-semibold uppercase tracking-wide text-navy-400 dark:text-navy-500", children: "Share of votes" }, void 0, false),
                  _jsxDEV(ResponsiveContainer, {
 width: "100%", height: 220, children:
                    _jsxDEV(PieChart, {
 children: [
                      _jsxDEV(Pie, {
                        data: pieData,
                        cx: "50%",
                        cy: "50%",
                        innerRadius: 54,
                        outerRadius: 84,
                        paddingAngle: 3,
                        dataKey: "value",
                        stroke: "none", children:

                        pieData.map((_entry, index) => {return (
                            _jsxDEV(Cell, { fill: COLORS[index % COLORS.length] }, `pie-${index}`, false));
                        }) 
}, void 0, false
                      ),
                      _jsxDEV(Legend, { iconType: "circle", iconSize: 8, wrapperStyle: { fontSize: 11 } }, void 0, false),
                      _jsxDEV(Tooltip, {
                        formatter: (value) => {return [`${value} votes`, "Votes"];},
                        contentStyle: { borderRadius: 12, border: "1px solid #b0bfdf", fontSize: 12, boxShadow: "0 8px 24px -12px rgba(12,20,40,.25)" } 
}, void 0, false
                      )] 
}, void 0, true
                    ) 
}, void 0, false
                  )] 
}, void 0, true
                ),

                _jsxDEV(Card, {
 className: "p-6 dark:bg-navy-900 dark:border-navy-700", children: [
                  _jsxDEV("h2", { className: "mb-1 text-sm font-semibold uppercase tracking-wide text-navy-400 dark:text-navy-500", children: "Candidate details" }, void 0, false),
                  _jsxDEV("p", { className: "mb-4 text-[11px] text-navy-400 dark:text-navy-500", children: "Tap a candidate to view their full profile." }, void 0, false),
                  _jsxDEV("div", {
 className: "flex flex-col gap-4", children:
                    sortedCandidates.map((c, i) => {
                      const isLeader = i === 0 && c.votes > 0;
                      const profile = candidateProfile(c.id);
                      return (
                        _jsxDEV("button", {

                          type: "button",
                          onClick: () =>
                          {return setDetailsCandidate(
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
                                supports: null
                              }
                            );},

                          className: "focus-ring group w-full rounded-xl p-1 text-left transition-colors hover:bg-navy-50 dark:hover:bg-navy-800", children: [

                          _jsxDEV("div", {
 className: "mb-1.5 flex items-center gap-2.5", children: [

                            profile?.photoUrl ?
                            _jsxDEV("img", {
                              src: profile.photoUrl,
                              alt: c.name,
                              className: "h-8 w-8 flex-shrink-0 rounded-full border border-navy-100 object-cover dark:border-navy-700" 
}, void 0, false
                            ) :

                            _jsxDEV("span", {
                              className: "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white",
                              style: { backgroundColor: COLORS[i % COLORS.length] }, children:

                              initials(c.name) 
}, void 0, false
                            ),

                            _jsxDEV("span", {
 className: "min-w-0 flex-1", children:
                              _jsxDEV("span", {
 className: "flex flex-wrap items-center gap-1.5", children: [
                                _jsxDEV("span", { className: "truncate text-sm font-semibold text-navy-900 dark:text-navy-100", children: c.name }, void 0, false),
                                profile?.voterId &&
                                _jsxDEV("span", {
 className: "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", children: [
                                  _jsxDEV(BadgeCheck, { className: "h-2.5 w-2.5" }, void 0, false),
                                  profile.voterId] 
}, void 0, true
                                )] 
}, void 0, true

                              ) 
}, void 0, false
                            ),
                            isLeader &&
                            _jsxDEV("span", {
 className: "flex-shrink-0 rounded-full bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700 dark:bg-gold-900/30 dark:text-gold-400", children:
                              isFinal ? "Winner" : "Leading" 
}, void 0, false
                            ),

                            _jsxDEV("span", { className: "flex-shrink-0 text-xs font-semibold text-navy-500 dark:text-navy-400", children: [c.percent, "%"] }, void 0, true)] 
}, void 0, true
                          ),
                          _jsxDEV("div", {
 className: "h-2 w-full overflow-hidden rounded-full bg-navy-100 dark:bg-navy-700", children:
                            _jsxDEV("div", {
                              className: "h-full rounded-full transition-all duration-700",
                              style: { width: `${c.percent}%`, background: COLORS[i % COLORS.length] } 
}, void 0, false
                            ) 
}, void 0, false
                          ),
                          _jsxDEV("p", { className: "mt-1 text-[11px] text-navy-400", children: [c.votes, " vote", c.votes === 1 ? "" : "s"] }, void 0, true)] 
}, c.id, true
                        ));

                    }) 
}, void 0, false
                  )] 
}, void 0, true
                )] 
}, void 0, true
              ) 
}, void 0, false
            )] 
}, void 0, true
          )] 
}, void 0, true

        )] 
}, void 0, true

      ),

      detailsCandidate &&
      _jsxDEV(CandidateDetailsModal, {
        candidate: detailsCandidate,
        onClose: () => {return setDetailsCandidate(null);},
        readOnly: true 
}, void 0, false
      )] 
}, void 0, true

    ));

}