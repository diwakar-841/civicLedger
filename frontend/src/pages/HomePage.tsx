import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, ClipboardList, ShieldCheck, Users, Vote } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { apiClient } from "../lib/apiClient";
import { useAuthContext } from "../contexts/AuthContext";
import { useElections, deriveStatus } from "../hooks/useElections";
import { useNotifications } from "../hooks/useNotifications";
import { useCandidateRequests } from "../hooks/useCandidateRequests";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) {return "just now";}
  if (mins < 60) {return `${mins}m ago`;}
  const hours = Math.round(mins / 60);
  if (hours < 24) {return `${hours}h ago`;}
  return `${Math.round(hours / 24)}d ago`;
}

export function HomePage() {
  const { user } = useAuthContext();
  const { elections, loading: electionsLoading } = useElections();
  const { notifications, loading: notificationsLoading } = useNotifications();
  const { requests, loading: requestsLoading } = useCandidateRequests();
  const [groupsCount, setGroupsCount] = useState(null);

  useEffect(() => {
    apiClient.
    get("/groups/mine").
    then(({ data }) => {return setGroupsCount(Array.isArray(data) ? data.length : 0);}).
    catch(() => {return setGroupsCount(0);});
  }, []);

  const activeCount = elections.filter((e) => {return deriveStatus(e) === "active";}).length;
  const myCandidacies = elections.filter((e) => {return e.candidates?.some((c) => {return c.voterUserId === user?.id;});}).length;
  const pendingRequests = requests.filter((r) => {return r.status === "pending";}).length;
  const unreadNotifications = notifications.filter((n) => {return !n.isRead;});
  const updatesLoading = notificationsLoading || requestsLoading;

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-5 py-7 text-white shadow-xl shadow-indigo-600/20 sm:mb-8 sm:px-9 sm:py-10", children: [
        _jsxDEV("div", { className: "pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[24px] border-white/10" }, void 0, false),
        _jsxDEV("div", { className: "pointer-events-none absolute bottom-[-5rem] right-24 h-48 w-48 rounded-full bg-teal-300/20 blur-2xl" }, void 0, false),
        _jsxDEV("p", {
 className: "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-200", children: [
          _jsxDEV(ShieldCheck, { className: "h-3.5 w-3.5" }, void 0, false), "Welcome",
          user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""] 
}, void 0, true
        ),
        _jsxDEV("h1", { className: "mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl", children: "Your dashboard" }, void 0, false),
        _jsxDEV("p", { className: "mt-1 max-w-md text-sm text-indigo-100", children: "Every ballot cast here is signed by your own wallet and verified on-chain." }, void 0, false

        )] 
}, void 0, true
      ),

      _jsxDEV("div", {
 className: "mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4", children: [
        _jsxDEV(Link, {
 to: "/elections", children:
          _jsxDEV(Card, {
 className: "flex flex-col gap-1 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg", children: [
            _jsxDEV("span", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600", children: _jsxDEV(Vote, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
            _jsxDEV("p", { className: "mt-1 text-2xl font-extrabold text-navy-900 dark:text-white", children: activeCount }, void 0, false),
            _jsxDEV("p", { className: "text-xs font-semibold text-navy-500", children: "Open for voting" }, void 0, false)] 
}, void 0, true
          ) 
}, void 0, false
        ),
        _jsxDEV(Link, {
 to: "/my-elections", children:
          _jsxDEV(Card, {
 className: "flex flex-col gap-1 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg", children: [
            _jsxDEV("span", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600", children: _jsxDEV(ClipboardList, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
            _jsxDEV("p", { className: "mt-1 text-2xl font-extrabold text-navy-900 dark:text-white", children: myCandidacies }, void 0, false),
            _jsxDEV("p", { className: "text-xs font-semibold text-navy-500", children: "Active candidacies" }, void 0, false)] 
}, void 0, true
          ) 
}, void 0, false
        ),
        _jsxDEV(Link, {
 to: "/groups", children:
          _jsxDEV(Card, {
 className: "flex flex-col gap-1 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg", children: [
            _jsxDEV("span", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600", children: _jsxDEV(Users, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
            _jsxDEV("p", { className: "mt-1 text-2xl font-extrabold text-navy-900 dark:text-white", children: groupsCount ?? "—" }, void 0, false),
            _jsxDEV("p", { className: "text-xs font-semibold text-navy-500", children: "Your groups" }, void 0, false)] 
}, void 0, true
          ) 
}, void 0, false
        ),
        _jsxDEV(Link, {
 to: "/requests", children:
          _jsxDEV(Card, {
 className: "flex flex-col gap-1 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg", children: [
            _jsxDEV("span", { className: "flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600", children: _jsxDEV(Bell, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
            _jsxDEV("p", { className: "mt-1 text-2xl font-extrabold text-navy-900 dark:text-white", children: pendingRequests }, void 0, false),
            _jsxDEV("p", { className: "text-xs font-semibold text-navy-500", children: "Pending requests" }, void 0, false)] 
}, void 0, true
          ) 
}, void 0, false
        )] 
}, void 0, true
      ),

      _jsxDEV("div", {
 className: "mb-4 flex items-center justify-between", children: [
        _jsxDEV("h2", { className: "text-lg font-bold text-navy-900 dark:text-white", children: "Important updates" }, void 0, false),
        _jsxDEV(Link, {
 to: "/notifications", className: "flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800", children: ["See all ",
          _jsxDEV(ArrowRight, { className: "h-3.5 w-3.5" }, void 0, false)] 
}, void 0, true
        )] 
}, void 0, true
      ),

      (updatesLoading || electionsLoading) && _jsxDEV(Spinner, { label: "Loading updates" }, void 0, false),

      !updatesLoading && unreadNotifications.length === 0 &&
      _jsxDEV(EmptyState, { title: "You're all caught up", description: "No new updates right now — check back later.", icon: _jsxDEV(Bell, { className: "h-6 w-6" }, void 0, false) }, void 0, false),

      !updatesLoading && unreadNotifications.length > 0 &&
      _jsxDEV("div", {
 className: "flex flex-col gap-3", children:
        unreadNotifications.slice(0, 5).map((n) => {return (
            _jsxDEV(Card, {
 className: "flex items-start gap-3 p-4", children: [
              _jsxDEV("span", { className: "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600", children: _jsxDEV(Bell, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
              _jsxDEV("div", {
 className: "min-w-0 flex-1", children: [
                _jsxDEV("p", { className: "text-sm font-bold text-navy-900 dark:text-white", children: n.title }, void 0, false),
                _jsxDEV("p", { className: "mt-0.5 line-clamp-2 text-xs text-navy-500", children: n.message }, void 0, false),
                _jsxDEV("p", { className: "mt-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400", children: timeAgo(n.createdAt) }, void 0, false)] 
}, void 0, true
              )] 
}, n.id, true
            ));
        }) 
}, void 0, false
      )] 
}, void 0, true

    ));

}