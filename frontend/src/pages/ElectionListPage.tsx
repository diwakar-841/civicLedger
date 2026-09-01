import { Link } from "react-router-dom";
import { Vote, ArrowRight, CalendarClock, ShieldCheck, Search, BarChart3 } from "lucide-react";
import { useMemo, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { StatusBadge } from "../components/shared/Badge";
import { useAuthContext } from "../contexts/AuthContext";
import { useElections, deriveStatus } from "../hooks/useElections";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function ElectionListPage() {
  const { elections, loading, error } = useElections();
  const { user } = useAuthContext();
  const [query, setQuery] = useState("");
  const activeCount = elections.filter((e) => {return deriveStatus(e) === "active";}).length;
  const visibleElections = useMemo(() => {return elections.filter((e) => {
      const matchesQuery = !query || `${e.title} ${e.description ?? ""}`.toLowerCase().includes(query.toLowerCase());
      return matchesQuery;
    });}, [elections, query]);

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-5 py-7 text-white shadow-xl shadow-indigo-600/20 sm:mb-8 sm:px-9 sm:py-10", children: [
        _jsxDEV("div", { className: "pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[24px] border-white/10" }, void 0, false),
        _jsxDEV("div", { className: "pointer-events-none absolute bottom-[-5rem] right-24 h-48 w-48 rounded-full bg-teal-300/20 blur-2xl" }, void 0, false),
        _jsxDEV("div", {
 className: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", {
 className: "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-200", children: [
              _jsxDEV(ShieldCheck, { className: "h-3.5 w-3.5" }, void 0, false), "Welcome",
              user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""] 
}, void 0, true
            ),
            _jsxDEV("h1", { className: "mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl", children: "Your elections" }, void 0, false),
            _jsxDEV("p", { className: "mt-1 max-w-md text-sm text-indigo-100", children: "Every ballot cast here is signed by your own wallet and verified on-chain." }, void 0, false

            )] 
}, void 0, true
          ),
          !loading && !error && elections.length > 0 &&
          _jsxDEV("div", {
 className: "flex-shrink-0 self-start rounded-xl bg-white/5 px-4 py-3 sm:self-auto sm:text-right", children: [
            _jsxDEV("p", { className: "text-3xl font-extrabold text-teal-300", children: activeCount }, void 0, false),
            _jsxDEV("p", { className: "text-xs text-indigo-100", children: "open for voting" }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true

        )] 
}, void 0, true
      ),

      !loading && !error && elections.length > 0 &&
      _jsxDEV("div", {
 className: "mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between", children:
        _jsxDEV("div", {
 className: "relative w-full sm:max-w-xs", children: [
          _jsxDEV(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" }, void 0, false),
          _jsxDEV("input", { value: query, onChange: (e) => {return setQuery(e.target.value);}, placeholder: "Search elections", className: "focus-ring w-full rounded-xl border border-navy-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm" }, void 0, false)] 
}, void 0, true
        ) 
}, void 0, false
      ),

      loading && _jsxDEV(Spinner, { label: "Loading elections" }, void 0, false),
      !loading && error && _jsxDEV(EmptyState, { title: "Something went wrong", description: error }, void 0, false),
      !loading && !error && elections.length === 0 &&
      _jsxDEV(EmptyState, { title: "No elections yet", description: "Check back once an administrator schedules a new election.", icon: _jsxDEV(Vote, { className: "h-6 w-6" }, void 0, false) }, void 0, false),

      !loading && !error && elections.length > 0 && visibleElections.length === 0 && _jsxDEV(EmptyState, { title: "No matching elections", description: "Try a different search or filter.", icon: _jsxDEV(Search, { className: "h-6 w-6" }, void 0, false) }, void 0, false),
      !loading && !error && visibleElections.length > 0 &&
      _jsxDEV("div", {
 className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children:
        visibleElections.map((election, i) => {
          const status = deriveStatus(election);
          return (
            _jsxDEV("div", {
 className: "flex h-full flex-col gap-2 animate-slide-up", style: { animationDelay: `${i * 60}ms` }, children: [
              _jsxDEV(Link, {
 to: `/elections/${election.id}`, className: "group flex-1", children:
                _jsxDEV(Card, {
 className: "flex h-full flex-col gap-4 p-6 transition-all duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-900/10", children: [
                  _jsxDEV("div", {
 className: "flex items-start justify-between gap-3", children: [
                    _jsxDEV("h2", { className: "text-lg font-bold text-navy-900", children: election.title || "Untitled election" }, void 0, false),
                    _jsxDEV(StatusBadge, { status: status }, void 0, false)] 
}, void 0, true
                  ),
                  election.description && _jsxDEV("p", { className: "line-clamp-2 flex-1 text-sm text-navy-500", children: election.description }, void 0, false),
                  _jsxDEV("div", {
 className: "flex flex-col gap-2 border-t border-navy-100 pt-4 text-xs text-navy-400 sm:flex-row sm:items-center sm:justify-between", children: [
                    _jsxDEV("span", {
 className: "flex items-center gap-1.5", children: [
                      _jsxDEV(CalendarClock, { className: "h-3.5 w-3.5 flex-shrink-0" }, void 0, false),
                      election.startTime && election.endTime ?
                      `${new Date(election.startTime).toLocaleDateString()} – ${new Date(election.endTime).toLocaleDateString()}` :
                      "Not scheduled yet"] 
}, void 0, true
                    ),
                    _jsxDEV("span", {
 className: "flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-800", children: ["View ",
                      _jsxDEV(ArrowRight, { className: "h-3.5 w-3.5" }, void 0, false)] 
}, void 0, true
                    )] 
}, void 0, true
                  )] 
}, void 0, true
                ) 
}, void 0, false
              ),
              _jsxDEV(Link, {
                to: `/elections/${election.id}/results`,
                className: "focus-ring flex items-center justify-center gap-1.5 rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-xs font-semibold text-navy-600 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700", children: [

                _jsxDEV(BarChart3, { className: "h-3.5 w-3.5" }, void 0, false), "View results"] 
}, void 0, true

              )] 
}, election.id, true
            ));

        }) 
}, void 0, false
      )] 
}, void 0, true

    ));

}