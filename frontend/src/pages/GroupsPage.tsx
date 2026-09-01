import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { apiClient } from "../lib/apiClient";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiClient.
    get("/groups/mine").
    then(({ data }) => {return setGroups(Array.isArray(data) ? data : []);}).
    catch(() => {return setError("Could not load your groups. Please refresh and try again.");}).
    finally(() => {return setLoading(false);});
  }, []);

  return (
    _jsxDEV(Layout, {
 children:
      _jsxDEV("div", {
 className: "mx-auto max-w-4xl", children: [
        _jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Workspace" }, void 0, false),
        _jsxDEV("h1", { className: "mb-2 mt-1 text-3xl font-extrabold text-navy-900 dark:text-white", children: "Your groups" }, void 0, false),
        _jsxDEV("p", { className: "mb-7 text-sm text-navy-500", children: "Private communities and election spaces you belong to." }, void 0, false),

        loading && _jsxDEV(Spinner, { label: "Loading your groups" }, void 0, false),
        !loading && error && _jsxDEV(EmptyState, { title: "Something went wrong", description: error, icon: _jsxDEV(Users, { className: "h-6 w-6" }, void 0, false) }, void 0, false),
        !loading && !error && groups.length === 0 &&
        _jsxDEV(EmptyState, {
          title: "No groups yet",
          description: "You'll see a group here once you accept an invitation from an administrator.",
          icon: _jsxDEV(Users, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
        ),

        !loading && !error && groups.length > 0 &&
        _jsxDEV("div", {
 className: "grid gap-4 sm:grid-cols-2", children:
          groups.map((g) => {return (
              _jsxDEV(Link, {
 to: `/groups/${g.id}`, className: "group", children:
                _jsxDEV(Card, {
 className: "flex h-full flex-col p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl", children: [
                  g.photo_url ?
                  _jsxDEV("img", { src: g.photo_url, alt: g.name, className: "mb-4 h-10 w-10 rounded-xl object-cover" }, void 0, false) :

                  _jsxDEV("div", { className: "mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600", children: _jsxDEV(Users, { className: "h-5 w-5" }, void 0, false) }, void 0, false),

                  _jsxDEV("h2", { className: "font-bold text-navy-900 dark:text-white", children: g.name }, void 0, false),
                  _jsxDEV("p", { className: "mt-1 line-clamp-2 flex-1 text-sm text-navy-500", children: g.description }, void 0, false),
                  _jsxDEV("div", {
 className: "mt-4 flex items-center justify-between border-t border-navy-100 pt-3 text-xs text-navy-400", children: [
                    _jsxDEV("span", { className: "font-bold uppercase tracking-wide", children: [g.member_count, " members"] }, void 0, true),
                    _jsxDEV("span", {
 className: "flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-800", children: ["View ",
                      _jsxDEV(ArrowRight, { className: "h-3.5 w-3.5" }, void 0, false)] 
}, void 0, true
                    )] 
}, void 0, true
                  )] 
}, void 0, true
                ) 
}, g.id, false
              ));
          }) 
}, void 0, false
        )] 
}, void 0, true

      ) 
}, void 0, false
    ));

}