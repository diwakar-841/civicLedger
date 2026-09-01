import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart3, CalendarClock, Search, Settings2, Vote } from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { EmptyState } from "../../components/shared/EmptyState";
import { Spinner } from "../../components/shared/Spinner";
import { StatusBadge } from "../../components/shared/Badge";
import { useAdminElectionsForDashboard } from "../../hooks/useAdminElectionsForDashboard";
import { deriveStatus } from "../../hooks/useElections";
import { electionDisplayId } from "../../lib/idFormat";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function bucket(status) {
  if (status === "active") {return "open";}
  if (status === "draft") {return "draft";}
  return "closed";
}

export function AdminElectionsPage() {
  const { elections, loading, error } = useAdminElectionsForDashboard();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");

  const matchingQuery = useMemo(
    () => {return elections.filter((e) => {return `${e.title} ${e.description ?? ""}`.toLowerCase().includes(query.toLowerCase());});},
    [elections, query]
  );

  const counts = useMemo(() => {return {
      all: matchingQuery.length,
      open: matchingQuery.filter((e) => {return bucket(deriveStatus(e)) === "open";}).length,
      draft: matchingQuery.filter((e) => {return bucket(deriveStatus(e)) === "draft";}).length,
      closed: matchingQuery.filter((e) => {return bucket(deriveStatus(e)) === "closed";}).length
    };}, [matchingQuery]);

  const visible = useMemo(
    () => {return tab === "all" ? matchingQuery : matchingQuery.filter((e) => {return bucket(deriveStatus(e)) === tab;});},
    [matchingQuery, tab]
  );

  const TABS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "draft", label: "Draft" },
  { key: "closed", label: "Closed" }];

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "mb-6", children: [
        _jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Control center" }, void 0, false),
        _jsxDEV("h1", { className: "mt-1 text-3xl font-extrabold text-navy-900 dark:text-white", children: "Elections" }, void 0, false),
        _jsxDEV("p", { className: "mt-1 text-sm text-navy-500", children: "Search, monitor, and manage every election you create." }, void 0, false)] 
}, void 0, true
      ),

      !loading && !error && elections.length > 0 &&
      _jsxDEV("div", {
 className: "relative mb-5 max-w-md", children: [
        _jsxDEV(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" }, void 0, false),
        _jsxDEV("input", {
          value: query,
          onChange: (e) => {return setQuery(e.target.value);},
          placeholder: "Search elections",
          className: "focus-ring w-full rounded-xl border border-navy-200 bg-white py-3 pl-10 pr-4 text-sm shadow-sm" 
}, void 0, false
        )] 
}, void 0, true
      ),

      !loading && !error && elections.length > 0 &&
      _jsxDEV("div", {
 className: "mb-6 flex flex-wrap gap-2", children:
        TABS.map((t) => {return (
            _jsxDEV("button", {

              type: "button",
              onClick: () => {return setTab(t.key);},
              className: `focus-ring flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
              tab === t.key ?
              "border-indigo-600 bg-indigo-600 text-white shadow-sm shadow-indigo-600/20" :
              "border-navy-200 bg-white text-navy-600 hover:border-indigo-200 hover:text-indigo-700 dark:border-navy-700 dark:bg-navy-900 dark:text-navy-300"}`, children: [

              t.label,
              _jsxDEV("span", {
 className: `rounded-full px-1.5 py-0.5 text-xs ${tab === t.key ? "bg-white/20" : "bg-navy-100 text-navy-500 dark:bg-navy-800"}`, children:
                counts[t.key] 
}, void 0, false
              )] 
}, t.key, true
            ));
        }) 
}, void 0, false
      ),

      loading && _jsxDEV(Spinner, { label: "Loading elections" }, void 0, false),
      !loading && error && _jsxDEV(EmptyState, { title: "Something went wrong", description: error }, void 0, false),
      !loading && !error && elections.length === 0 &&
      _jsxDEV(EmptyState, { title: "No elections yet", description: "Create your first election to start collecting verified on-chain votes.", icon: _jsxDEV(Vote, { className: "h-6 w-6" }, void 0, false) }, void 0, false),

      !loading && !error && elections.length > 0 && visible.length === 0 &&
      _jsxDEV(EmptyState, { title: "No matching elections", description: "Try a different search term or filter.", icon: _jsxDEV(Search, { className: "h-6 w-6" }, void 0, false) }, void 0, false),

      !loading && !error && visible.length > 0 &&
      _jsxDEV("div", {
 className: "flex flex-col gap-3", children:
        visible.map((election) => {return (
            _jsxDEV(Card, {
 className: "border-l-4 border-l-indigo-500 p-5 dark:bg-navy-900", children:
              _jsxDEV("div", {
 className: "flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
                _jsxDEV("div", {
 children: [
                  _jsxDEV("div", {
 className: "mb-1 flex flex-wrap items-center gap-2", children: [
                    _jsxDEV("h2", { className: "font-bold text-navy-900 dark:text-white", children: election.title }, void 0, false),
                    _jsxDEV(StatusBadge, { status: deriveStatus(election) }, void 0, false),
                    _jsxDEV("span", { className: "font-mono text-[11px] text-navy-400", children: electionDisplayId(election.id) }, void 0, false)] 
}, void 0, true
                  ),
                  _jsxDEV("p", {
 className: "flex items-center gap-1.5 text-xs text-navy-400", children: [
                    _jsxDEV(CalendarClock, { className: "h-3.5 w-3.5" }, void 0, false),
                    election.startTime && election.endTime ?
                    `${new Date(election.startTime).toLocaleDateString()} – ${new Date(election.endTime).toLocaleDateString()}` :
                    "Not scheduled yet"] 
}, void 0, true
                  )] 
}, void 0, true
                ),
                _jsxDEV("div", {
 className: "flex flex-wrap gap-2", children: [
                  _jsxDEV(Link, {
 to: `/admin/elections/${election.id}/status`, children:
                    _jsxDEV(Button, { size: "sm", variant: "ghost", children: [_jsxDEV(Settings2, { className: "h-4 w-4" }, void 0, false), "Manage"] }, void 0, true) 
}, void 0, false
                  ),
                  _jsxDEV(Link, {
 to: `/admin/elections/${election.id}/analytics`, children:
                    _jsxDEV(Button, { size: "sm", variant: "ghost", children: [_jsxDEV(BarChart3, { className: "h-4 w-4" }, void 0, false), "Analytics"] }, void 0, true) 
}, void 0, false
                  )] 
}, void 0, true
                )] 
}, void 0, true
              ) 
}, election.id, false
            ));
        }) 
}, void 0, false
      )] 
}, void 0, true

    ));

}