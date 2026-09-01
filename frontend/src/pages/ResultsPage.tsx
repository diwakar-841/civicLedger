import { useState } from "react";
import { useParams } from "react-router-dom";
import { BadgeCheck, BarChart3, Radio, Trophy, Users, Vote } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { StatusBadge } from "../components/shared/Badge";
import { CandidateDetailsModal } from "../components/voting/CandidateDetailModal";
import { useResults } from "../hooks/useResults";
import { useElection, deriveStatus } from "../hooks/useElections";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const GOLD = "#dfab38";
const NAVY = "#3d5091";
const COLORS = [GOLD, NAVY, "#5c6fac", "#c9922a", "#2b3c74", "#eac25e"];

function initials(name) {
  return name.
  split(" ").
  filter(Boolean).
  slice(0, 2).
  map((w) => {return w[0].toUpperCase();}).
  join("");
}

export function ResultsPage() {
  const { id } = useParams();
  const { election } = useElection(id);
  const { results, resultsAvailable, unavailableMessage, loading, error } = useResults(id);

  const [detailsCandidate, setDetailsCandidate] = useState(null);

  function candidateProfile(candidateId) {
    return election?.candidates?.find((c) => {return c.id === candidateId;}) ?? null;
  }

  const totalVotes = results.reduce((sum, r) => {return sum + r.votes;}, 0);
  const sortedResults = [...results].sort((a, b) => {return b.votes - a.votes;});
  const leader = sortedResults.length > 0 && sortedResults[0].votes > 0 ? sortedResults[0] : null;
  const status = election ? deriveStatus(election) : undefined;
  const isFinal = status === "closed";

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "mx-auto max-w-2xl", children: [

        _jsxDEV("div", {
 className: "relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-6 py-7 text-white shadow-xl shadow-indigo-600/20 sm:px-9 sm:py-8", children: [
          _jsxDEV("div", { className: "pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[24px] border-white/10" }, void 0, false),
          _jsxDEV("div", { className: "pointer-events-none absolute bottom-[-5rem] right-24 h-40 w-40 rounded-full bg-teal-300/20 blur-2xl" }, void 0, false),
          _jsxDEV("div", {
 className: "relative", children: [
            _jsxDEV("p", {
 className: "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-200", children: [
              _jsxDEV(BarChart3, { className: "h-3.5 w-3.5" }, void 0, false), "Election insights"] 
}, void 0, true

            ),
            _jsxDEV("h1", { className: "mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl", children: election?.title ?? "Results" }, void 0, false),
            _jsxDEV("p", { className: "mt-2 text-sm text-indigo-100", children: "Tallied directly from verified on-chain votes." }, void 0, false),
            status && _jsxDEV("div", { className: "mt-3", children: _jsxDEV(StatusBadge, { status: status }, void 0, false) }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true
        ),

        loading && _jsxDEV(Spinner, { label: "Loading results" }, void 0, false),
        !loading && error && _jsxDEV(EmptyState, { title: "Results unavailable", description: error }, void 0, false),
        !loading && !error && !resultsAvailable &&
        _jsxDEV(EmptyState, {
          title: "Results not published yet",
          description: unavailableMessage ?? "Results are not available yet." 
}, void 0, false
        ),

        !loading && !error && resultsAvailable && results.length === 0 &&
        _jsxDEV(EmptyState, { title: "No votes yet", description: "Results will appear here once votes are cast." }, void 0, false),

        !loading && !error && resultsAvailable && results.length > 0 &&
        _jsxDEV(_Fragment, {
 children: [

          _jsxDEV("div", {
 className: "mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3", children: [
            _jsxDEV(Card, {
 className: "flex flex-col gap-1 p-5", children: [
              _jsxDEV("span", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-600 dark:bg-navy-800 dark:text-gold-400", children: _jsxDEV(Vote, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
              _jsxDEV("p", { className: "mt-1 text-2xl font-extrabold text-navy-900 dark:text-navy-50", children: totalVotes }, void 0, false),
              _jsxDEV("p", { className: "text-xs font-semibold text-navy-500", children: "Total votes cast" }, void 0, false)] 
}, void 0, true
            ),
            _jsxDEV(Card, {
 className: "flex flex-col gap-1 p-5", children: [
              _jsxDEV("span", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-navy-800 dark:text-indigo-400", children: _jsxDEV(Users, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
              _jsxDEV("p", { className: "mt-1 text-2xl font-extrabold text-navy-900 dark:text-navy-50", children: results.length }, void 0, false),
              _jsxDEV("p", { className: "text-xs font-semibold text-navy-500", children: "Candidates" }, void 0, false)] 
}, void 0, true
            ),
            _jsxDEV(Card, {
 className: "col-span-2 flex flex-col gap-1 p-5 sm:col-span-1", children: [
              _jsxDEV("span", { className: "flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-navy-800 dark:text-emerald-400", children: _jsxDEV(Trophy, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
              _jsxDEV("p", { className: "mt-1 truncate text-lg font-extrabold text-navy-900 dark:text-navy-50", children: leader ? leader.name : "—" }, void 0, false),
              _jsxDEV("p", {
 className: "text-xs font-semibold text-navy-500", children:
                leader ?
                isFinal ?
                `Winner · ${totalVotes > 0 ? Math.round(leader.votes / totalVotes * 100) : 0}%` :
                `Leading with ${totalVotes > 0 ? Math.round(leader.votes / totalVotes * 100) : 0}%` :
                "No votes yet" 
}, void 0, false
              )] 
}, void 0, true
            )] 
}, void 0, true
          ),

          _jsxDEV(Card, {
 className: "p-6", children: [
            _jsxDEV("div", {
 className: "mb-1 flex items-center justify-between", children: [
              _jsxDEV("h2", { className: "text-sm font-semibold uppercase tracking-wide text-navy-400 dark:text-navy-500", children: "Candidate breakdown" }, void 0, false),
              status === "active" &&
              _jsxDEV("span", {
 className: "flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", children: [
                _jsxDEV(Radio, { className: "h-3 w-3 animate-pulse" }, void 0, false), " Live"] 
}, void 0, true
              )] 
}, void 0, true

            ),
            _jsxDEV("p", { className: "mb-4 text-[11px] text-navy-400 dark:text-navy-500", children: "Tap a candidate to view their full profile." }, void 0, false),

            _jsxDEV("div", {
 className: "flex flex-col gap-4", children:
              sortedResults.map((r, i) => {
                const pct = totalVotes > 0 ? Math.round(r.votes / totalVotes * 100) : 0;
                const isLeader = i === 0 && r.votes > 0;
                const profile = candidateProfile(r.candidateId);
                return (
                  _jsxDEV("button", {

                    type: "button",
                    onClick: () =>
                    {return setDetailsCandidate(
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
                          supports: null
                        }
                      );},

                    className: "focus-ring group w-full rounded-xl p-2 text-left transition-colors hover:bg-navy-50 dark:hover:bg-navy-800", children: [

                    _jsxDEV("div", {
 className: "mb-1.5 flex items-center gap-3", children: [

                      profile?.photoUrl ?
                      _jsxDEV("img", {
                        src: profile.photoUrl,
                        alt: r.name,
                        className: "h-10 w-10 flex-shrink-0 rounded-full border border-navy-100 object-cover dark:border-navy-700" 
}, void 0, false
                      ) :

                      _jsxDEV("span", {
                        className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-xs font-extrabold text-white",
                        style: { backgroundColor: COLORS[i % COLORS.length] }, children:

                        initials(r.name) 
}, void 0, false
                      ),

                      _jsxDEV("span", {
 className: "min-w-0 flex-1", children: [
                        _jsxDEV("span", {
 className: "flex flex-wrap items-center gap-1.5", children: [
                          _jsxDEV("span", { className: "truncate text-sm font-bold text-navy-900 dark:text-navy-100", children: r.name }, void 0, false),
                          profile?.voterId &&
                          _jsxDEV("span", {
 className: "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400", children: [
                            _jsxDEV(BadgeCheck, { className: "h-2.5 w-2.5" }, void 0, false),
                            profile.voterId] 
}, void 0, true
                          )] 
}, void 0, true

                        ),
                        r.party && _jsxDEV("span", { className: "text-xs text-navy-400 dark:text-navy-500", children: r.party }, void 0, false)] 
}, void 0, true
                      ),
                      isLeader &&
                      _jsxDEV("span", {
 className: "flex-shrink-0 rounded-full bg-gold-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gold-700 dark:bg-gold-900/30 dark:text-gold-400", children:
                        isFinal ? "Winner" : "Leading" 
}, void 0, false
                      ),

                      _jsxDEV("span", {
 className: "flex-shrink-0 text-sm font-semibold text-navy-500 dark:text-navy-400", children: [
                        r.votes, " vote", r.votes === 1 ? "" : "s", " · ", pct, "%"] 
}, void 0, true
                      )] 
}, void 0, true
                    ),
                    _jsxDEV("div", {
 className: "h-2.5 w-full overflow-hidden rounded-full bg-navy-100 dark:bg-navy-700", children:
                      _jsxDEV("div", {
                        className: `h-full rounded-full transition-all duration-700 ${isLeader ? "shadow-[0_0_12px_rgba(45,212,191,.45)]" : "opacity-80"}`,
                        style: { width: `${pct}%`, background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}dd)` } 
}, void 0, false
                      ) 
}, void 0, false
                    )] 
}, r.candidateId, true
                  ));

              }) 
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