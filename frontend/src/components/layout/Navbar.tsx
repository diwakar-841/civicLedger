import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, ClipboardList, LayoutDashboard, LogOut, Menu, Moon, Search, Settings, ShieldCheck, Sun, User, Vote, X } from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useCandidateRequests } from "../../hooks/useCandidateRequests";
import { useNotifications } from "../../hooks/useNotifications";
import { Button } from "../shared/Button";
import { GlobalSearchBar } from "./GlobalSearchBar";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

function UserAvatar({ photoUrl, name }) {
  const [error, setError] = useState(false);
  if (photoUrl && !error) {return _jsxDEV("img", { src: photoUrl, alt: name ?? "User avatar", onError: () => {return setError(true);}, className: "h-9 w-9 rounded-full object-cover ring-2 ring-indigo-100" }, void 0, false);}
  return _jsxDEV("span", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white", children: _jsxDEV(User, { className: "h-4 w-4" }, void 0, false) }, void 0, false);
}

export function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuthContext();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const { requests } = useCandidateRequests();
  const { notifications } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pending = requests.filter((r) => {return r.status === "pending";}).length;
  const unread = notifications.filter((n) => {return !n.isRead;}).length;

  async function signOut() {setMenuOpen(false);await logout();navigate("/login");}
  const navClass = "flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-navy-500 transition hover:bg-indigo-50 hover:text-indigo-700";
  const close = () => {return setMenuOpen(false);};

  return (
    _jsxDEV("header", {
 className: "sticky top-0 z-40 border-b border-navy-100/80 bg-white/90 shadow-sm backdrop-blur-xl dark:border-navy-800 dark:bg-navy-950/90", children: [
      _jsxDEV("div", {
 className: "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10", children: [
        _jsxDEV(Link, {
 to: isAuthenticated ? "/profile" : "/elections", onClick: close, className: "flex items-center gap-3", children: [
          _jsxDEV("span", { className: "flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20", children: _jsxDEV(Vote, { className: "h-5 w-5" }, void 0, false) }, void 0, false),
          _jsxDEV("div", { className: "leading-tight", children: [_jsxDEV("p", { className: "font-extrabold tracking-tight text-navy-900 dark:text-white", children: "Civic Ledger" }, void 0, false), _jsxDEV("p", { className: "hidden text-[10px] font-bold uppercase tracking-[.14em] text-navy-400 xs:block", children: "Trusted voting" }, void 0, false)] }, void 0, true)] 
}, void 0, true
        ),
        isAuthenticated && _jsxDEV(_Fragment, {
 children: [
          _jsxDEV("nav", {
 className: "hidden items-center gap-1 lg:flex", children: [
            isAdmin ? _jsxDEV(_Fragment, { children: [_jsxDEV(Link, { to: "/admin", className: navClass, children: [_jsxDEV(LayoutDashboard, { className: "h-4 w-4" }, void 0, false), "Dashboard"] }, void 0, true), _jsxDEV(Link, { to: "/admin/elections", className: navClass, children: [_jsxDEV(ClipboardList, { className: "h-4 w-4" }, void 0, false), "Elections"] }, void 0, true)] }, void 0, true) : _jsxDEV(Link, { to: "/elections", className: navClass, children: [_jsxDEV(Vote, { className: "h-4 w-4" }, void 0, false), "Elections"] }, void 0, true),
            _jsxDEV(Link, { to: "/requests", className: navClass, children: [_jsxDEV(ClipboardList, { className: "h-4 w-4" }, void 0, false), "Requests", pending > 0 && _jsxDEV("span", { className: "rounded-full bg-rose-100 px-1.5 text-[10px] text-rose-600", children: pending }, void 0, false)] }, void 0, true)] 
}, void 0, true
          ),
          _jsxDEV("div", {
 className: "flex items-center gap-1", children: [
            _jsxDEV("button", { onClick: () => {return setSearchOpen(!searchOpen);}, className: "flex h-10 w-10 items-center justify-center rounded-xl text-navy-500 hover:bg-indigo-50 hover:text-indigo-700", "aria-label": "Search", children: searchOpen ? _jsxDEV(X, { className: "h-5 w-5" }, void 0, false) : _jsxDEV(Search, { className: "h-5 w-5" }, void 0, false) }, void 0, false),
            _jsxDEV(Link, { to: "/notifications", className: "relative flex h-10 w-10 items-center justify-center rounded-xl text-navy-500 hover:bg-indigo-50 hover:text-indigo-700", children: [_jsxDEV(Bell, { className: "h-5 w-5" }, void 0, false), unread > 0 && _jsxDEV("span", { className: "absolute right-1 top-1 h-4 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold leading-4 text-white", children: unread > 9 ? "9+" : unread }, void 0, false)] }, void 0, true),
            _jsxDEV("div", { className: "ml-2 hidden items-center gap-2 border-l border-navy-100 pl-3 sm:flex", children: [_jsxDEV(UserAvatar, { photoUrl: user?.profilePhotoUrl, name: user?.fullName }, void 0, false), _jsxDEV("span", { className: "max-w-[120px] truncate text-xs font-bold text-navy-600", children: user?.fullName }, void 0, false)] }, void 0, true),
            _jsxDEV("button", { onClick: () => {toggle();}, className: "hidden h-10 w-10 items-center justify-center rounded-xl text-navy-500 hover:bg-indigo-50 hover:text-indigo-700 sm:flex", "aria-label": "Toggle theme", children: theme === "dark" ? _jsxDEV(Sun, { className: "h-4 w-4" }, void 0, false) : _jsxDEV(Moon, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
            _jsxDEV("button", { onClick: () => {return setMenuOpen(!menuOpen);}, className: "flex h-10 w-10 items-center justify-center rounded-xl text-navy-500 hover:bg-indigo-50 lg:hidden", "aria-label": "Menu", children: menuOpen ? _jsxDEV(X, {}, void 0, false) : _jsxDEV(Menu, {}, void 0, false) }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true
        )] 
}, void 0, true
      ),
      isAuthenticated && searchOpen && _jsxDEV("div", { className: "border-t border-navy-100 bg-white px-4 py-3 dark:border-navy-800 dark:bg-navy-950", children: _jsxDEV("div", { className: "mx-auto max-w-7xl sm:max-w-md", children: _jsxDEV(GlobalSearchBar, { autoFocus: true, onClose: () => {return setSearchOpen(false);} }, void 0, false) }, void 0, false) }, void 0, false),
      isAuthenticated && menuOpen && _jsxDEV("div", {
 className: "border-t border-navy-100 bg-white px-4 pb-4 pt-3 shadow-lg lg:hidden dark:border-navy-800 dark:bg-navy-950", children: [
        _jsxDEV("div", { className: "mb-2 flex items-center gap-2 rounded-xl bg-indigo-50 p-3 text-sm font-bold text-navy-700", children: [_jsxDEV(ShieldCheck, { className: "h-4 w-4 text-indigo-600" }, void 0, false), user?.fullName] }, void 0, true),
        _jsxDEV(Link, { to: isAdmin ? "/admin" : "/elections", onClick: close, className: navClass, children: [isAdmin ? _jsxDEV(LayoutDashboard, { className: "h-4 w-4" }, void 0, false) : _jsxDEV(Vote, { className: "h-4 w-4" }, void 0, false), isAdmin ? "Dashboard" : "Elections"] }, void 0, true),
        isAdmin && _jsxDEV(_Fragment, { children: [_jsxDEV(Link, { to: "/admin/elections", onClick: close, className: navClass, children: [_jsxDEV(ClipboardList, { className: "h-4 w-4" }, void 0, false), "Elections"] }, void 0, true), _jsxDEV(Link, { to: "/admin/audit-log", onClick: close, className: navClass, children: [_jsxDEV(ClipboardList, { className: "h-4 w-4" }, void 0, false), "Audit log"] }, void 0, true)] }, void 0, true),
        _jsxDEV(Link, { to: "/requests", onClick: close, className: navClass, children: [_jsxDEV(ClipboardList, { className: "h-4 w-4" }, void 0, false), "Requests", pending > 0 && _jsxDEV("span", { className: "ml-auto rounded-full bg-rose-100 px-1.5 text-[10px] text-rose-600", children: pending }, void 0, false)] }, void 0, true),
        _jsxDEV(Link, { to: "/notifications", onClick: close, className: navClass, children: [_jsxDEV(Bell, { className: "h-4 w-4" }, void 0, false), "Notifications", unread > 0 && _jsxDEV("span", { className: "ml-auto rounded-full bg-rose-100 px-1.5 text-[10px] text-rose-600", children: unread }, void 0, false)] }, void 0, true),
        _jsxDEV(Link, { to: "/profile", onClick: close, className: navClass, children: [_jsxDEV(User, { className: "h-4 w-4" }, void 0, false), "Profile"] }, void 0, true), _jsxDEV(Link, { to: "/settings/security", onClick: close, className: navClass, children: [_jsxDEV(Settings, { className: "h-4 w-4" }, void 0, false), "Security"] }, void 0, true),
        _jsxDEV("button", { onClick: () => {toggle();close();}, className: navClass, children: [theme === "dark" ? _jsxDEV(Sun, { className: "h-4 w-4" }, void 0, false) : _jsxDEV(Moon, { className: "h-4 w-4" }, void 0, false), theme === "dark" ? "Light mode" : "Dark mode"] }, void 0, true),
        _jsxDEV(Button, { variant: "ghost", size: "sm", onClick: signOut, className: "mt-1 w-full justify-start", children: [_jsxDEV(LogOut, { className: "h-4 w-4" }, void 0, false), "Sign out"] }, void 0, true)] 
}, void 0, true
      )] 
}, void 0, true
    ));

}