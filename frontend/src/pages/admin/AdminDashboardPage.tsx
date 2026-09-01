import { Link } from "react-router-dom";
import { Vote, CalendarClock, BarChart3, ArrowRight, Activity, FileEdit, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { Spinner } from "../../components/shared/Spinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/Badge";
import { useAdminElectionsForDashboard } from "../../hooks/useAdminElectionsForDashboard";
import { deriveStatus } from "../../hooks/useElections";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

export function AdminDashboardPage() {
  const { elections, loading, error } = useAdminElectionsForDashboard();

  const counts = useMemo(() => {return {
      open: elections.filter((e) => {return deriveStatus(e) === "active";}).length,
      draft: elections.filter((e) => {return deriveStatus(e) === "draft";}).length,
      closed: elections.filter((e) => {return deriveStatus(e) === "closed" || deriveStatus(e) === "cancelled";}).length
    };}, [elections]);

  const attention = useMemo(
    () => {return [
      ...elections.filter((e) => {return deriveStatus(e) === "draft";}),
      ...elections.filter((e) => {return deriveStatus(e) === "active";})].
      slice(0, 5);},
    [elections]
  );

  const ElectionRow = ({ election }) => {
    const status = deriveStatus(election);

    const manageTo = status === "draft" ?
    `/admin/elections/${election.id}/candidates` :
    `/admin/elections/${election.id}/status`;
    return (
      _jsxDEV(Card, {
 className: "relative flex flex-col gap-4 border-l-4 border-l-indigo-500 p-5 transition hover:-translate-y-0.5 hover:shadow-xl sm:flex-row sm:items-center sm:justify-between dark:bg-navy-900 dark:border-navy-700", children: [
        _jsxDEV("div", {
 children: [
          _jsxDEV("div", {
 className: "mb-1 flex flex-wrap items-center gap-2", children: [
            _jsxDEV("h2", { className: "font-semibold text-navy-900 dark:text-navy-100", children: election.title }, void 0, false),
            _jsxDEV(StatusBadge, { status: status }, void 0, false)] 
}, void 0, true
          ),
          _jsxDEV("p", {
 className: "flex items-center gap-1.5 text-xs text-navy-400 dark:text-navy-500", children: [
            _jsxDEV(CalendarClock, { className: "h-3.5 w-3.5" }, void 0, false),
            election.startTime && election.endTime ?
            `${new Date(election.startTime).toLocaleString()} – ${new Date(election.endTime).toLocaleString()}` :
            "Not scheduled yet — add candidates to continue setup"] 
}, void 0, true
          )] 
}, void 0, true
        ),
        _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
          _jsxDEV(Link, { to: manageTo, children: _jsxDEV(Button, { size: "sm", variant: "ghost", children: "Manage" }, void 0, false) }, void 0, false),
          _jsxDEV(Link, { to: `/admin/elections/${election.id}/analytics`, children: _jsxDEV(Button, { size: "sm", variant: "ghost", children: [_jsxDEV(BarChart3, { className: "h-4 w-4" }, void 0, false), "Analytics"] }, void 0, true) }, void 0, false)] 
}, void 0, true
        )] 
}, void 0, true
      ));

  };

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between", children: [
        _jsxDEV("div", {
 children: [
          _jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Control center" }, void 0, false),
          _jsxDEV("h1", { className: "mt-1 text-3xl font-extrabold text-navy-900 dark:text-navy-50", children: "Admin dashboard" }, void 0, false),
          _jsxDEV("p", { className: "mt-1 text-navy-500 dark:text-navy-400", children: "Create elections, manage candidates, and monitor results." }, void 0, false)] 
}, void 0, true
        ),

        !loading && !error && elections.length > 0 &&
        _jsxDEV(Link, {
          to: "/admin/elections",
          className: "flex items-center divide-x divide-navy-100 self-start rounded-2xl border border-navy-100 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:divide-navy-800 dark:border-navy-800 dark:bg-navy-900", children: [

          _jsxDEV("span", {
 className: "flex items-center gap-2 px-4 py-3", children: [
            _jsxDEV(Activity, { className: "h-4 w-4 text-emerald-500" }, void 0, false),
            _jsxDEV("span", { className: "text-lg font-extrabold text-navy-900 dark:text-white", children: counts.open }, void 0, false),
            _jsxDEV("span", { className: "text-xs font-semibold text-navy-500", children: "Open" }, void 0, false)] 
}, void 0, true
          ),
          _jsxDEV("span", {
 className: "flex items-center gap-2 px-4 py-3", children: [
            _jsxDEV(FileEdit, { className: "h-4 w-4 text-gold-500" }, void 0, false),
            _jsxDEV("span", { className: "text-lg font-extrabold text-navy-900 dark:text-white", children: counts.draft }, void 0, false),
            _jsxDEV("span", { className: "text-xs font-semibold text-navy-500", children: "Draft" }, void 0, false)] 
}, void 0, true
          ),
          _jsxDEV("span", {
 className: "flex items-center gap-2 px-4 py-3", children: [
            _jsxDEV(CheckCircle2, { className: "h-4 w-4 text-navy-400" }, void 0, false),
            _jsxDEV("span", { className: "text-lg font-extrabold text-navy-900 dark:text-white", children: counts.closed }, void 0, false),
            _jsxDEV("span", { className: "text-xs font-semibold text-navy-500", children: "Closed" }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true
        )] 
}, void 0, true

      ),

      loading && _jsxDEV(Spinner, { label: "Loading elections" }, void 0, false),
      !loading && error && _jsxDEV(EmptyState, { title: "Something went wrong", description: error }, void 0, false),
      !loading && !error && elections.length === 0 &&
      _jsxDEV(EmptyState, {
        title: "No elections yet",
        description: "Create your first election to start collecting verified on-chain votes.",
        icon: _jsxDEV(Vote, { className: "h-6 w-6" }, void 0, false),
        action:
        _jsxDEV(Link, {
 to: "/admin/elections/new", children:
          _jsxDEV(Button, { size: "sm", variant: "secondary", children: "Create election" }, void 0, false) 
}, void 0, false
        ) 
}, void 0, false

      ),

      !loading && !error && elections.length > 0 &&
      _jsxDEV(_Fragment, {
 children: [
        _jsxDEV("div", {
 className: "mb-3 flex items-center justify-between", children: [
          _jsxDEV("h2", { className: "text-lg font-bold text-navy-900 dark:text-navy-50", children: "Needs your attention" }, void 0, false),
          _jsxDEV(Link, {
 to: "/admin/elections", className: "flex items-center gap-1 text-sm font-semibold text-gold-700 hover:underline", children: ["View all elections ",
            _jsxDEV(ArrowRight, { className: "h-3.5 w-3.5" }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true
        ),

        attention.length > 0 ?
        _jsxDEV("div", {
 className: "flex flex-col gap-3", children:
          attention.map((e) => {return _jsxDEV(ElectionRow, { election: e }, e.id, false);}) 
}, void 0, false
        ) :

        _jsxDEV(Card, { className: "p-5 text-sm text-navy-400", children: "Nothing needs attention right now — all elections are closed or up to date." }, void 0, false)] 
}, void 0, true

      )] 
}, void 0, true

    ));

}