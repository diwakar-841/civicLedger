import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, ClipboardList, Vote } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { StatusBadge } from "../components/shared/Badge";
import { useAuthContext } from "../contexts/AuthContext";
import { useElections, deriveStatus } from "../hooks/useElections";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function MyElectionsPage() {
  const { user } = useAuthContext();
  const { elections, loading, error } = useElections();

  const myElections = elections.
  map((election) => {return { election, candidacy: election.candidates?.find((c) => {return c.voterUserId === user?.id;}) };}).
  filter((entry) => {return !!entry.candidacy;});

  return (
    _jsxDEV(Layout, {
 children:
      _jsxDEV("div", {
 className: "mx-auto max-w-4xl", children: [
        _jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Candidacy" }, void 0, false),
        _jsxDEV("h1", { className: "mb-2 mt-1 text-3xl font-extrabold text-navy-900 dark:text-white", children: "My elections" }, void 0, false),
        _jsxDEV("p", { className: "mb-7 text-sm text-navy-500", children: "Elections where you're running as a candidate, and how your candidacy appears to voters." }, void 0, false),

        loading && _jsxDEV(Spinner, { label: "Loading your elections" }, void 0, false),
        !loading && error && _jsxDEV(EmptyState, { title: "Something went wrong", description: error, icon: _jsxDEV(Vote, { className: "h-6 w-6" }, void 0, false) }, void 0, false),
        !loading && !error && myElections.length === 0 &&
        _jsxDEV(EmptyState, {
          title: "You're not a candidate yet",
          description: "Once you accept a nomination request, the election will show up here with your candidate details.",
          icon: _jsxDEV(ClipboardList, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
        ),

        !loading && !error && myElections.length > 0 &&
        _jsxDEV("div", {
 className: "grid gap-4 sm:grid-cols-2", children:
          myElections.map(({ election, candidacy }) => {
            const status = deriveStatus(election);
            return (
              _jsxDEV(Link, {
 to: `/elections/${election.id}`, className: "group", children:
                _jsxDEV(Card, {
 className: "flex h-full flex-col gap-4 p-6 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl", children: [
                  _jsxDEV("div", {
 className: "flex items-start justify-between gap-3", children: [
                    _jsxDEV("h2", { className: "text-lg font-bold text-navy-900 dark:text-white", children: election.title || "Untitled election" }, void 0, false),
                    _jsxDEV(StatusBadge, { status: status }, void 0, false)] 
}, void 0, true
                  ),

                  _jsxDEV("div", {
 className: "flex items-center gap-3 rounded-xl bg-indigo-50/60 p-3 dark:bg-navy-800/60", children: [
                    candidacy?.photoUrl ?
                    _jsxDEV("img", { src: candidacy.photoUrl, alt: candidacy.name, className: "h-10 w-10 flex-shrink-0 rounded-full object-cover" }, void 0, false) :

                    _jsxDEV("span", {
 className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white", children:
                      candidacy?.name?.slice(0, 1).toUpperCase() ?? "?" 
}, void 0, false
                    ),

                    _jsxDEV("div", {
 className: "min-w-0", children: [
                      _jsxDEV("p", { className: "truncate text-sm font-bold text-navy-900 dark:text-white", children: candidacy?.name }, void 0, false),
                      candidacy?.party && _jsxDEV("p", { className: "truncate text-xs text-navy-500", children: candidacy.party }, void 0, false)] 
}, void 0, true
                    )] 
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
 className: "flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-800", children: ["View election ",
                      _jsxDEV(ArrowRight, { className: "h-3.5 w-3.5" }, void 0, false)] 
}, void 0, true
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

      ) 
}, void 0, false
    ));

}