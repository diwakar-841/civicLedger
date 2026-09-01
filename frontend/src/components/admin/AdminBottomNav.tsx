import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Home, Plus, ShieldCheck, Users, Vote, X } from "lucide-react";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const items = [
{ label: "Home", to: "/admin", icon: Home, end: true },
{ label: "Groups", to: "/admin/groups", icon: Users },
{ label: "Elections", to: "/admin/elections", icon: Vote },
{ label: "Profile", to: "/profile", icon: ShieldCheck }];

export function AdminBottomNav() {
  const [createOpen, setCreateOpen] = useState(false);
  const location = useLocation();

  if (location.pathname.startsWith("/admin/") && (
  location.pathname.includes("/new") ||
  location.pathname.includes("/candidates") ||
  location.pathname.includes("/analytics") ||
  location.pathname.includes("/status")))
  {return null;}

  return (
    _jsxDEV(_Fragment, {
 children: [
      createOpen &&
      _jsxDEV("div", {
 className: "fixed inset-0 z-40 bg-navy-950/20 backdrop-blur-[2px]", onClick: () => {return setCreateOpen(false);}, children:
        _jsxDEV("div", {
 className: "absolute bottom-24 left-1/2 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-3xl border border-navy-100 bg-white p-3 shadow-elevated dark:border-navy-700 dark:bg-navy-900", onClick: (e) => {return e.stopPropagation();}, children: [
          _jsxDEV("div", {
 className: "flex items-center justify-between px-3 pb-2 pt-1", children: [
            _jsxDEV("div", { children: [_jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Quick create" }, void 0, false), _jsxDEV("p", { className: "font-bold text-navy-900 dark:text-white", children: "Start something new" }, void 0, false)] }, void 0, true),
            _jsxDEV("button", { className: "rounded-xl p-2 text-navy-400 hover:bg-navy-50", onClick: () => {return setCreateOpen(false);}, "aria-label": "Close create menu", children: _jsxDEV(X, { className: "h-5 w-5" }, void 0, false) }, void 0, false)] 
}, void 0, true
          ),
          _jsxDEV(NavLink, {
 to: "/admin/groups/new", onClick: () => {return setCreateOpen(false);}, className: "flex items-center gap-3 rounded-2xl p-3 text-left hover:bg-teal-50", children: [
            _jsxDEV("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700", children: _jsxDEV(Users, { className: "h-5 w-5" }, void 0, false) }, void 0, false),
            _jsxDEV("span", { children: [_jsxDEV("span", { className: "block font-bold text-navy-900 dark:text-white", children: "Create group" }, void 0, false), _jsxDEV("span", { className: "text-xs text-navy-500", children: "Bring voters together" }, void 0, false)] }, void 0, true)] 
}, void 0, true
          ),
          _jsxDEV(NavLink, {
 to: "/admin/elections/new", onClick: () => {return setCreateOpen(false);}, className: "flex items-center gap-3 rounded-2xl p-3 text-left hover:bg-indigo-50", children: [
            _jsxDEV("span", { className: "flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700", children: _jsxDEV(Vote, { className: "h-5 w-5" }, void 0, false) }, void 0, false),
            _jsxDEV("span", { children: [_jsxDEV("span", { className: "block font-bold text-navy-900 dark:text-white", children: "Create election" }, void 0, false), _jsxDEV("span", { className: "text-xs text-navy-500", children: "Set up a new ballot" }, void 0, false)] }, void 0, true)] 
}, void 0, true
          )] 
}, void 0, true
        ) 
}, void 0, false
      ),

      _jsxDEV("nav", {
 "aria-label": "Admin navigation", className: "fixed inset-x-0 bottom-0 z-50 border-t border-navy-100/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(12,20,40,.4)] backdrop-blur-xl dark:border-navy-800 dark:bg-navy-950/95", children:
        _jsxDEV("div", {
 className: "mx-auto flex h-[4.65rem] max-w-lg items-center justify-around px-2", children: [
          _jsxDEV(NavLink, { to: items[0].to, end: true, className: ({ isActive }) => {return `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`;}, children: [_jsxDEV(Home, { className: "h-5 w-5" }, void 0, false), _jsxDEV("span", { children: "Home" }, void 0, false)] }, void 0, true),
          _jsxDEV(NavLink, { to: items[1].to, className: ({ isActive }) => {return `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`;}, children: [_jsxDEV(Users, { className: "h-5 w-5" }, void 0, false), _jsxDEV("span", { children: "Groups" }, void 0, false)] }, void 0, true),
          _jsxDEV("button", { onClick: () => {return setCreateOpen(!createOpen);}, "aria-label": "Create", className: `bottom-nav-create ${createOpen ? "rotate-45 bg-navy-900" : ""}`, children: _jsxDEV(Plus, { className: "h-6 w-6" }, void 0, false) }, void 0, false),
          _jsxDEV(NavLink, { to: items[2].to, className: ({ isActive }) => {return `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`;}, children: [_jsxDEV(Vote, { className: "h-5 w-5" }, void 0, false), _jsxDEV("span", { children: "Elections" }, void 0, false)] }, void 0, true),
          _jsxDEV(NavLink, { to: items[3].to, className: ({ isActive }) => {return `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`;}, children: [_jsxDEV(ShieldCheck, { className: "h-5 w-5" }, void 0, false), _jsxDEV("span", { children: "Profile" }, void 0, false)] }, void 0, true)] 
}, void 0, true
        ) 
}, void 0, false
      )] 
}, void 0, true
    ));

}