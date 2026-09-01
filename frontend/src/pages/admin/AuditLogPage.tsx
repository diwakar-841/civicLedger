import { useState, useEffect, useCallback } from "react";
import { ClipboardList, ShieldCheck, AlertTriangle, Download, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { TextField } from "../../components/shared/Input";
import { Spinner } from "../../components/shared/Spinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { apiClient } from "../../lib/apiClient";
import { formatError } from "../../lib/formatError";
import { useToast } from "../../contexts/ToastContext";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

const PAGE_SIZE = 20;

export function AuditLogPage() {
  const { show } = useToast();
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [actorFilter, setActorFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [pendingActor, setPendingActor] = useState("");
  const [pendingAction, setPendingAction] = useState("");

  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState(null);
  const [exporting, setExporting] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async (pg, actor, action) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(pg),
        pageSize: String(PAGE_SIZE),
        ...(actor ? { actor } : {}),
        ...(action ? { action } : {})
      });
      const { data } = await apiClient.get(`/admin/audit-log?${params}`);
      setEntries(data.entries);
      setTotal(data.total);
    } catch (err) {
      show(formatError(err, "Could not load audit log"), "error");
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    load(page, actorFilter, actionFilter);
  }, [page, actorFilter, actionFilter, load]);

  function handleSearch() {
    setPage(1);
    setActorFilter(pendingActor);
    setActionFilter(pendingAction);
  }

  async function handleVerify() {
    setVerifying(true);
    setVerifyResult(null);
    try {
      const { data } = await apiClient.get("/admin/audit-log/verify");
      setVerifyResult(data);
    } catch (err) {
      show(formatError(err, "Could not verify chain"), "error");
    } finally {
      setVerifying(false);
    }
  }

  function handleExport() {
    setExporting(true);
    const base = import.meta.env.VITE_API_URL ?? "";
    const link = document.createElement("a");
    link.href = `${base}/admin/audit-log/export.csv`;
    link.download = "audit-log.csv";
    link.click();
    setTimeout(() => {return setExporting(false);}, 1500);
  }

  const fadeIn = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
  };

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", children: [
        _jsxDEV("div", {
 children: [
          _jsxDEV("div", {
 className: "flex items-center gap-2 mb-1", children: [
            _jsxDEV(ClipboardList, { className: "h-5 w-5 text-gold-500" }, void 0, false),
            _jsxDEV("h1", { className: "text-2xl font-bold text-navy-900 dark:text-navy-50", children: "Audit Log" }, void 0, false)] 
}, void 0, true
          ),
          _jsxDEV("p", { className: "text-navy-500 dark:text-navy-400", children: "Tamper-evident chain of all system actions." }, void 0, false)] 
}, void 0, true
        ),
        _jsxDEV("div", {
 className: "flex gap-2", children: [
          _jsxDEV(Button, {
 size: "sm", variant: "secondary", onClick: handleVerify, loading: verifying, children: [
            _jsxDEV(ShieldCheck, { className: "h-4 w-4" }, void 0, false), "Verify chain"] 
}, void 0, true

          ),
          _jsxDEV(Button, {
 size: "sm", variant: "ghost", onClick: handleExport, loading: exporting, children: [
            _jsxDEV(Download, { className: "h-4 w-4" }, void 0, false), "Export CSV"] 
}, void 0, true

          )] 
}, void 0, true
        )] 
}, void 0, true
      ),

      verifyResult &&
      _jsxDEV(motion.div, {
 ...fadeIn, className: "mb-6", children:
        verifyResult.valid ?
        _jsxDEV("div", {
 className: "flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800 px-5 py-4", children: [
          _jsxDEV("span", {
 className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600", children:
            _jsxDEV(ShieldCheck, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
          ),
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", { className: "font-semibold text-emerald-900 dark:text-emerald-300", children: "Chain verified" }, void 0, false),
            _jsxDEV("p", { className: "text-sm text-emerald-700 dark:text-emerald-400", children: [total, " entries checked. No tampering detected. The audit chain is intact."] }, void 0, true)] 
}, void 0, true
          )] 
}, void 0, true
        ) :

        _jsxDEV("div", {
 className: "flex items-center gap-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-950/30 dark:border-red-800 px-5 py-4", children: [
          _jsxDEV("span", {
 className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900 text-red-600", children:
            _jsxDEV(AlertTriangle, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
          ),
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", { className: "font-semibold text-red-900 dark:text-red-300", children: "Chain integrity violation detected" }, void 0, false),
            _jsxDEV("p", {
 className: "text-sm text-red-700 dark:text-red-400", children: ["The audit chain has been broken at entry ID: ",
              _jsxDEV("code", { className: "font-mono font-bold", children: verifyResult.brokenAtId }, void 0, false), ". This may indicate tampering."] 
}, void 0, true
            )] 
}, void 0, true
          )] 
}, void 0, true
        ) 
}, void 0, false

      ),

      _jsxDEV(Card, {
 className: "mb-6 p-4 dark:bg-navy-900 dark:border-navy-700", children:
        _jsxDEV("div", {
 className: "flex flex-col gap-3 sm:flex-row sm:items-end", children: [
          _jsxDEV("div", {
 className: "flex-1", children:
            _jsxDEV(TextField, {
              label: "Filter by actor",
              placeholder: "email or user ID",
              value: pendingActor,
              onChange: (e) => {return setPendingActor(e.target.value);} 
}, void 0, false
            ) 
}, void 0, false
          ),
          _jsxDEV("div", {
 className: "flex-1", children:
            _jsxDEV(TextField, {
              label: "Filter by action",
              placeholder: "e.g. VOTE_CAST",
              value: pendingAction,
              onChange: (e) => {return setPendingAction(e.target.value);} 
}, void 0, false
            ) 
}, void 0, false
          ),
          _jsxDEV(Button, {
 onClick: handleSearch, className: "flex-shrink-0", children: [
            _jsxDEV(RefreshCw, { className: "h-4 w-4" }, void 0, false), "Apply"] 
}, void 0, true

          )] 
}, void 0, true
        ) 
}, void 0, false
      ),

      loading && _jsxDEV(Spinner, { label: "Loading audit log" }, void 0, false),

      !loading && entries.length === 0 &&
      _jsxDEV(EmptyState, {
        title: "No entries found",
        description: "No audit log entries match your filters.",
        icon: _jsxDEV(ClipboardList, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
      ),

      !loading && entries.length > 0 &&
      _jsxDEV(_Fragment, {
 children: [
        _jsxDEV("div", {
 className: "overflow-x-auto rounded-xl border border-navy-200 dark:border-navy-700", children:
          _jsxDEV("table", {
 className: "w-full text-sm", children: [
            _jsxDEV("thead", {
 children:
              _jsxDEV("tr", {
 className: "border-b border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-900", children: [
                _jsxDEV("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400", children: "Time" }, void 0, false),
                _jsxDEV("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400", children: "Actor" }, void 0, false),
                _jsxDEV("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400", children: "Action" }, void 0, false),
                _jsxDEV("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400", children: "IP" }, void 0, false),
                _jsxDEV("th", { className: "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400", children: "Tx Hash" }, void 0, false)] 
}, void 0, true
              ) 
}, void 0, false
            ),
            _jsxDEV("tbody", {
 children:
              entries.map((entry, i) => {return (
                  _jsxDEV("tr", {

                    className: `border-b border-navy-100 dark:border-navy-800 last:border-0 ${i % 2 === 0 ? "bg-white dark:bg-navy-900/50" : "bg-navy-50/60 dark:bg-navy-800/30"}`, children: [

                    _jsxDEV("td", {
 className: "whitespace-nowrap px-4 py-3 text-xs text-navy-500 dark:text-navy-400", children:
                      new Date(entry.createdAt).toLocaleString() 
}, void 0, false
                    ),
                    _jsxDEV("td", {
 className: "px-4 py-3 text-xs font-medium text-navy-800 dark:text-navy-200 max-w-[140px] truncate", children:
                      entry.actor 
}, void 0, false
                    ),
                    _jsxDEV("td", {
 className: "px-4 py-3", children:
                      _jsxDEV("span", {
 className: "inline-flex rounded-full bg-navy-100 dark:bg-navy-700 px-2 py-0.5 text-xs font-semibold text-navy-700 dark:text-navy-300", children:
                        entry.action 
}, void 0, false
                      ) 
}, void 0, false
                    ),
                    _jsxDEV("td", {
 className: "whitespace-nowrap px-4 py-3 text-xs text-navy-500 dark:text-navy-400", children:
                      entry.ipAddress ?? "-" 
}, void 0, false
                    ),
                    _jsxDEV("td", {
 className: "px-4 py-3", children:
                      entry.txHash ?
                      _jsxDEV("code", {
 className: "text-xs font-mono text-navy-600 dark:text-navy-300", children: [
                        entry.txHash.slice(0, 10), "..."] 
}, void 0, true
                      ) :

                      _jsxDEV("span", { className: "text-xs text-navy-300 dark:text-navy-600", children: "-" }, void 0, false) 
}, void 0, false

                    )] 
}, entry.id, true
                  ));
              }) 
}, void 0, false
            )] 
}, void 0, true
          ) 
}, void 0, false
        ),

        totalPages > 1 &&
        _jsxDEV("div", {
 className: "mt-4 flex items-center justify-between text-sm text-navy-500 dark:text-navy-400", children: [
          _jsxDEV("span", { children: ["Page ", page, " of ", totalPages, " (", total, " entries)"] }, void 0, true),
          _jsxDEV("div", {
 className: "flex gap-2", children: [
            _jsxDEV(Button, { size: "sm", variant: "ghost", disabled: page <= 1, onClick: () => {return setPage((p) => {return p - 1;});}, children: "Previous" }, void 0, false

            ),
            _jsxDEV(Button, { size: "sm", variant: "ghost", disabled: page >= totalPages, onClick: () => {return setPage((p) => {return p + 1;});}, children: "Next" }, void 0, false

            )] 
}, void 0, true
          )] 
}, void 0, true
        )] 
}, void 0, true

      )] 
}, void 0, true

    ));

}