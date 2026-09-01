import { NavLink } from "react-router-dom";
import { Home, ShieldCheck, Users, Vote } from "lucide-react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function UserBottomNav() {
  return (
    _jsxDEV("nav", {
 "aria-label": "Main navigation", className: "fixed inset-x-0 bottom-0 z-50 border-t border-navy-100/90 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_24px_-18px_rgba(12,20,40,.4)] backdrop-blur-xl dark:border-navy-800 dark:bg-navy-950/95", children:
      _jsxDEV("div", {
 className: "mx-auto flex h-[4.65rem] max-w-lg items-center justify-around px-2", children: [
        _jsxDEV(NavLink, {
 to: "/home", end: true, className: ({ isActive }) => {return `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`;}, children: [
          _jsxDEV(Home, { className: "h-5 w-5" }, void 0, false),
          _jsxDEV("span", { children: "Home" }, void 0, false)] 
}, void 0, true
        ),
        _jsxDEV(NavLink, {
 to: "/groups", className: ({ isActive }) => {return `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`;}, children: [
          _jsxDEV(Users, { className: "h-5 w-5" }, void 0, false),
          _jsxDEV("span", { children: "Groups" }, void 0, false)] 
}, void 0, true
        ),
        _jsxDEV(NavLink, {
 to: "/my-elections", className: ({ isActive }) => {return `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`;}, children: [
          _jsxDEV(Vote, { className: "h-5 w-5" }, void 0, false),
          _jsxDEV("span", { children: "My Elections" }, void 0, false)] 
}, void 0, true
        ),
        _jsxDEV(NavLink, {
 to: "/profile", className: ({ isActive }) => {return `bottom-nav-item ${isActive ? "bottom-nav-active" : ""}`;}, children: [
          _jsxDEV(ShieldCheck, { className: "h-5 w-5" }, void 0, false),
          _jsxDEV("span", { children: "Profile" }, void 0, false)] 
}, void 0, true
        )] 
}, void 0, true
      ) 
}, void 0, false
    ));

}