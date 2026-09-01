import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Users, UserRound } from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { EmptyState } from "../../components/shared/EmptyState";
import { Spinner } from "../../components/shared/Spinner";
import { apiClient } from "../../lib/apiClient";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function AdminGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiClient.get("/groups").then(({ data }) => {return setGroups(Array.isArray(data) ? data : []);}).catch(() => {return setGroups([]);}).finally(() => {return setLoading(false);});
  }, []);

  return _jsxDEV(Layout, {
 children: [
    _jsxDEV("div", {
 className: "mb-7 flex items-end justify-between gap-4", children: [
      _jsxDEV("div", { children: [_jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Workspace" }, void 0, false), _jsxDEV("h1", { className: "mt-1 text-3xl font-extrabold text-navy-900 dark:text-white", children: "Groups" }, void 0, false), _jsxDEV("p", { className: "mt-1 text-sm text-navy-500", children: "Manage your voter communities and election spaces." }, void 0, false)] }, void 0, true),
      _jsxDEV(Link, { to: "/admin/groups/new", children: _jsxDEV(Button, { size: "sm", className: "hidden sm:flex", children: [_jsxDEV(Plus, { className: "h-4 w-4" }, void 0, false), "New group"] }, void 0, true) }, void 0, false)] 
}, void 0, true
    ),
    loading && _jsxDEV(Spinner, { label: "Loading groups" }, void 0, false),
    !loading && groups.length === 0 && _jsxDEV(EmptyState, { title: "No groups yet", description: "Create a group to organize voters around an election.", icon: _jsxDEV(Users, { className: "h-6 w-6" }, void 0, false), action: _jsxDEV(Link, { to: "/admin/groups/new", children: _jsxDEV(Button, { size: "sm", children: "Create group" }, void 0, false) }, void 0, false) }, void 0, false),
    !loading && groups.length > 0 && _jsxDEV("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3", children: groups.map((group) => {return _jsxDEV(Link, { to: `/admin/groups/${group.id}`, className: "group", children: _jsxDEV(Card, { className: "h-full p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl", children: [_jsxDEV("div", { className: "mb-5 flex items-start justify-between", children: [_jsxDEV("span", { className: "flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600", children: _jsxDEV(Users, { className: "h-5 w-5" }, void 0, false) }, void 0, false), _jsxDEV(ArrowRight, { className: "h-4 w-4 text-navy-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" }, void 0, false)] }, void 0, true), _jsxDEV("h2", { className: "font-bold text-navy-900 dark:text-white", children: group.name }, void 0, false), _jsxDEV("p", { className: "mt-1 line-clamp-2 min-h-10 text-sm text-navy-500", children: group.description || "No description added yet." }, void 0, false), _jsxDEV("div", { className: "mt-5 flex items-center gap-1.5 border-t border-navy-100 pt-4 text-xs font-bold uppercase tracking-wide text-navy-400", children: [_jsxDEV(UserRound, { className: "h-3.5 w-3.5" }, void 0, false), group.member_count ?? 0, " members"] }, void 0, true)] }, void 0, true) }, group.id, false);}) }, void 0, false)] 
}, void 0, true
  );
}