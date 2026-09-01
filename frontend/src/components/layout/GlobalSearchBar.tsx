import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X, Vote, User, ShieldCheck, Loader2, Users } from "lucide-react";
import { useAuthContext } from "../../contexts/AuthContext";
import { useGlobalSearch } from "../../hooks/useGlobalSearch";
import { deriveStatus } from "../../hooks/useElections";
import { StatusBadge } from "../shared/Badge";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const TYPE_TABS = [
{ value: "all", label: "All" },
{ value: "election", label: "Elections" },
{ value: "user", label: "Voters" },
{ value: "admin", label: "Admins" },
{ value: "group", label: "Groups" }];

export function GlobalSearchBar({ autoFocus, onClose }: { autoFocus?: boolean; onClose?: () => void } = {}) {
  const { isAdmin } = useAuthContext();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const { results, loading, error } = useGlobalSearch(query, type);
  const hasQuery = query.trim().length >= 2;
  const hasResults = results.elections.length + results.users.length + results.admins.length + results.groups.length > 0;

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") {
        setOpen(false);
        onClose?.();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  function goToElection(id) {
    setOpen(false);
    setQuery("");
    onClose?.();

    navigate(isAdmin ? `/admin/elections/${id}/status` : `/elections/${id}`);
  }

  return (
    _jsxDEV("div", {
 ref: containerRef, className: "relative w-full sm:w-64 md:w-80", children: [
      _jsxDEV("div", {
 className: "relative", children: [
        _jsxDEV(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" }, void 0, false),
        _jsxDEV("input", {
          type: "text",
          value: query,
          onChange: (e) => {
            setQuery(e.target.value);
            setOpen(true);
          },
          onFocus: () => {return setOpen(true);},
          autoFocus: autoFocus,
          placeholder: "Search elections, voters, admins, groups...",
          "aria-label": "Search elections, voters, admins, and groups",
          className: "focus-ring w-full rounded-xl border border-navy-200 bg-slate-50 py-3 pl-10 pr-9 text-sm text-navy-900 shadow-inner placeholder:text-navy-400" 
}, void 0, false
        ),
        query &&
        _jsxDEV("button", {
          type: "button",
          onClick: () => {return setQuery("");},
          "aria-label": "Clear search",
          className: "absolute right-2.5 top-1/2 -translate-y-1/2 text-navy-400 hover:text-white", children:

          _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
        )] 
}, void 0, true

      ),

      open && hasQuery &&
      _jsxDEV("div", {
 className: "absolute z-30 mt-2 w-full min-w-[20rem] rounded-xl border border-navy-100 bg-white p-3 text-left shadow-elevated dark:border-navy-700 dark:bg-navy-900", children: [

        _jsxDEV("div", {
 className: "mb-3 flex gap-1.5", children:
          TYPE_TABS.map((tab) => {return (
              _jsxDEV("button", {

                type: "button",
                onClick: () => {return setType(tab.value);},
                className: `rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                type === tab.value ?
                "bg-navy-900 text-white dark:bg-gold-400 dark:text-navy-950" :
                "bg-navy-100 text-navy-500 hover:bg-navy-200 dark:bg-navy-800 dark:text-navy-400 dark:hover:bg-navy-700"}`, children:

                tab.label 
}, tab.value, false
              ));
          }) 
}, void 0, false
        ),

        loading &&
        _jsxDEV("div", {
 className: "flex items-center gap-2 px-1 py-3 text-sm text-navy-400", children: [
          _jsxDEV(Loader2, { className: "h-4 w-4 animate-spin" }, void 0, false), "Searching..."] 
}, void 0, true

        ),

        !loading && error && _jsxDEV("p", { className: "px-1 py-3 text-sm text-red-600 dark:text-red-400", children: error }, void 0, false),

        !loading && !error && !hasResults &&
        _jsxDEV("p", { className: "px-1 py-3 text-sm text-navy-400", children: ["No matches for \"", query, "\"."] }, void 0, true),

        !loading && !error && hasResults &&
        _jsxDEV("div", {
 className: "flex max-h-80 flex-col gap-3 overflow-y-auto", children: [
          results.elections.length > 0 &&
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", { className: "mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400", children: "Elections" }, void 0, false),
            _jsxDEV("div", {
 className: "flex flex-col gap-0.5", children:
              results.elections.map((e) => {return (
                  _jsxDEV("button", {

                    type: "button",
                    onClick: () => {return goToElection(e.id);},
                    className: "focus-ring flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-navy-50 dark:hover:bg-navy-800", children: [

                    _jsxDEV(Vote, { className: "h-4 w-4 flex-shrink-0 text-gold-500" }, void 0, false),
                    _jsxDEV("span", {
 className: "min-w-0 flex-1", children: [
                      _jsxDEV("span", { className: "block truncate text-sm font-medium text-navy-900 dark:text-navy-100", children: e.title }, void 0, false),
                      _jsxDEV("span", { className: "font-mono text-[11px] text-navy-400", children: e.displayId }, void 0, false)] 
}, void 0, true
                    ),
                    _jsxDEV(StatusBadge, { status: deriveStatus({ startTime: e.startTime, endTime: e.endTime }) }, void 0, false)] 
}, e.id, true
                  ));
              }) 
}, void 0, false
            )] 
}, void 0, true
          ),

          results.users.length > 0 &&
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", { className: "mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400", children: "Voters" }, void 0, false),
            _jsxDEV("div", {
 className: "flex flex-col gap-0.5", children:
              results.users.map((u) => {return (
                  _jsxDEV("div", {
 className: "flex items-center gap-2 rounded-lg px-2 py-2", children: [
                    _jsxDEV(User, { className: "h-4 w-4 flex-shrink-0 text-navy-400" }, void 0, false),
                    _jsxDEV("span", {
 className: "min-w-0 flex-1", children: [
                      _jsxDEV("span", { className: "block truncate text-sm font-medium text-navy-900 dark:text-navy-100", children: u.fullName }, void 0, false),
                      _jsxDEV("span", { className: "font-mono text-[11px] text-navy-400", children: u.displayId }, void 0, false)] 
}, void 0, true
                    ),
                    u.isVerified &&
                    _jsxDEV("span", {
 title: "Verified", children:
                      _jsxDEV(ShieldCheck, { className: "h-3.5 w-3.5 flex-shrink-0 text-emerald-500" }, void 0, false) 
}, void 0, false
                    )] 
}, u.id, true

                  ));
              }) 
}, void 0, false
            )] 
}, void 0, true
          ),

          results.admins.length > 0 &&
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", { className: "mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400", children: "Admins" }, void 0, false),
            _jsxDEV("div", {
 className: "flex flex-col gap-0.5", children:
              results.admins.map((a) => {return (
                  _jsxDEV("div", {
 className: "flex items-center gap-2 rounded-lg px-2 py-2", children: [
                    _jsxDEV(ShieldCheck, { className: "h-4 w-4 flex-shrink-0 text-gold-500" }, void 0, false),
                    _jsxDEV("span", {
 className: "min-w-0 flex-1", children: [
                      _jsxDEV("span", { className: "block truncate text-sm font-medium text-navy-900 dark:text-navy-100", children: a.fullName }, void 0, false),
                      _jsxDEV("span", { className: "font-mono text-[11px] text-navy-400", children: a.displayId }, void 0, false)] 
}, void 0, true
                    )] 
}, a.id, true
                  ));
              }) 
}, void 0, false
            )] 
}, void 0, true
          ),

          results.groups.length > 0 &&
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", { className: "mb-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400", children: "Groups" }, void 0, false),
            results.groups.map((g) => {return _jsxDEV("div", {
 className: "flex items-center gap-2 rounded-lg px-2 py-2", children: [
                _jsxDEV(Users, { className: "h-4 w-4 text-gold-500" }, void 0, false),
                _jsxDEV("span", { children: [_jsxDEV("span", { className: "block text-sm font-medium text-navy-900 dark:text-navy-100", children: g.name }, void 0, false), _jsxDEV("span", { className: "font-mono text-[11px] text-navy-400", children: g.displayId }, void 0, false)] }, void 0, true)] 
}, g.id, true
              );})] 
}, void 0, true
          )] 
}, void 0, true

        )] 
}, void 0, true

      )] 
}, void 0, true

    ));

}