import { useState } from "react";
import { Bell, CheckCircle2, Trash2, AlertCircle, ExternalLink, Info, Calendar, X, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { EmptyState } from "../components/shared/EmptyState";
import { Spinner } from "../components/shared/Spinner";
import { useNotifications } from "../hooks/useNotifications";
import { apiClient } from "../lib/apiClient";
import { formatError } from "../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function InsufficientCandidatesActions({
  electionId,
  electionTitle,
  onActionDone
}) {
  const [extending, setExtending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [extendHours, setExtendHours] = useState(12);
  const [showExtendForm, setShowExtendForm] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  async function handleExtend() {
    setExtending(true);
    setLocalError(null);
    try {
      await apiClient.post(`/admin/elections/${electionId}/extend-deadline`, { hours: extendHours });
      setShowExtendForm(false);
      onActionDone?.();
    } catch (err) {
      setLocalError(formatError(err, "Failed to extend deadline"));
    } finally {
      setExtending(false);
    }
  }

  async function handleClose() {
    setClosing(true);
    setLocalError(null);
    try {
      await apiClient.post(`/admin/elections/${electionId}/cancel`);
      onActionDone?.();
    } catch (err) {
      setLocalError(formatError(err, "Failed to close election"));
    } finally {
      setClosing(false);
      setConfirmClose(false);
    }
  }

  return (
    _jsxDEV("div", {
 className: "mt-3 flex flex-col gap-3", children: [
      localError &&
      _jsxDEV("p", {
 className: "rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400", children:
        localError 
}, void 0, false
      ),

      !showExtendForm ?
      _jsxDEV("button", {
        type: "button",
        onClick: () => {return setShowExtendForm(true);},
        className: "flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400", children: [

        _jsxDEV(Calendar, { className: "h-4 w-4" }, void 0, false), "Extend deadline"] 
}, void 0, true

      ) :

      _jsxDEV("div", {
 className: "rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30", children: [
        _jsxDEV("p", { className: "mb-2 text-xs font-semibold text-blue-800 dark:text-blue-300", children: "Extend by (10–24h, once, non-responders only)" }, void 0, false

        ),
        _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
          _jsxDEV("input", {
            type: "number",
            min: 10,
            max: 24,
            value: extendHours,
            onChange: (e) => {return setExtendHours(Math.min(24, Math.max(10, parseInt(e.target.value) || 12)));},
            className: "w-24 rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-blue-400 focus:outline-none dark:bg-navy-800 dark:text-navy-50" 
}, void 0, false
          ),
          _jsxDEV("span", { className: "text-xs text-blue-700 dark:text-blue-400", children: "hours" }, void 0, false),
          _jsxDEV(Button, {
            size: "sm",
            loading: extending,
            onClick: handleExtend,
            className: "ml-auto", children:
            "Extend" 
}, void 0, false

          ),
          _jsxDEV("button", {
            type: "button",
            onClick: () => {return setShowExtendForm(false);},
            className: "text-navy-400 hover:text-navy-700",
            "aria-label": "Cancel", children:

            _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
          )] 
}, void 0, true
        )] 
}, void 0, true
      ),

      !confirmClose ?
      _jsxDEV("button", {
        type: "button",
        onClick: () => {return setConfirmClose(true);},
        className: "flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400", children: [

        _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false), "Close election"] 
}, void 0, true

      ) :

      _jsxDEV("div", {
 className: "rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30", children: [
        _jsxDEV("p", {
 className: "mb-2 text-xs font-semibold text-red-700 dark:text-red-400", children: ["Close \"",
          electionTitle ?? "this election", "\" permanently?"] 
}, void 0, true
        ),
        _jsxDEV("div", {
 className: "flex gap-2", children: [
          _jsxDEV(Button, {
            size: "sm",
            loading: closing,
            onClick: handleClose,
            className: "bg-red-600 text-white hover:bg-red-700", children:
            "Close" 
}, void 0, false

          ),
          _jsxDEV(Button, {
            size: "sm",
            variant: "secondary",
            onClick: () => {return setConfirmClose(false);}, children:
            "Cancel" 
}, void 0, false

          )] 
}, void 0, true
        )] 
}, void 0, true
      )] 
}, void 0, true

    ));

}

function iconFor(type) {
  if (type === "resultsAnnounced") {return _jsxDEV(CheckCircle2, { className: "h-5 w-5 text-emerald-600" }, void 0, false);}
  if (type === "insufficientCandidates" || type === "notEnoughCandidates") {
    return _jsxDEV(AlertTriangle, { className: "h-5 w-5 text-red-500" }, void 0, false);
  }
  if (type.includes("Nomination") || type.includes("candidate")) {
    return _jsxDEV(AlertCircle, { className: "h-5 w-5 text-gold-600" }, void 0, false);
  }
  return _jsxDEV(Info, { className: "h-5 w-5 text-navy-500" }, void 0, false);
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onActionDone

}) {
  const resultLink =
  notification.type === "resultsAnnounced" && notification.relatedId ?
  `/elections/${notification.relatedId}/results` :
  null;
  const requestLink =
  notification.relatedId && (
  notification.type === "candidateNomination" ||
  notification.type === "nominationAccepted" ||
  notification.type === "nominationRejected" ||
  notification.type === "nominationExpired" ||
  notification.type === "groupInvitation") ?
  `/requests` :
  null;

  const isInsufficientCandidates =
  notification.type === "insufficientCandidates" ||
  notification.type === "notEnoughCandidates";

  return (
    _jsxDEV("div", {
      className: `relative flex gap-3 rounded-2xl border border-navy-100 px-4 py-5 shadow-sm sm:gap-4 sm:px-6 dark:border-navy-800 ${
      !notification.isRead ? "bg-indigo-50/60 dark:bg-indigo-950/20" : "bg-white dark:bg-navy-900"}`, children: [

      !notification.isRead && _jsxDEV("span", { className: "absolute left-0 top-0 h-full w-1 bg-indigo-500" }, void 0, false),
      _jsxDEV("div", {
 className: "mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-navy-800", children:
        iconFor(notification.type) 
}, void 0, false
      ),

      _jsxDEV("div", {
 className: "min-w-0 flex-1", children: [
        _jsxDEV("div", {
 className: "flex flex-wrap items-start justify-between gap-2", children: [
          _jsxDEV("h2", { className: "font-semibold text-navy-900 dark:text-white", children: notification.title }, void 0, false),
          !notification.isRead &&
          _jsxDEV("span", { className: "rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white", children: "New" }, void 0, false

          )] 
}, void 0, true

        ),

        _jsxDEV("p", {
 className: "mt-1 text-sm leading-6 text-navy-600 dark:text-navy-300", children:
          notification.message 
}, void 0, false
        ),

        isInsufficientCandidates && notification.relatedId &&
        _jsxDEV(InsufficientCandidatesActions, {
          electionId: notification.relatedId,
          electionTitle: notification.title,
          onActionDone: () => {
            onMarkAsRead(notification.id);
            onActionDone();
          } 
}, void 0, false
        ),

        _jsxDEV("div", {
 className: "mt-3 flex flex-wrap items-center gap-3 text-xs text-navy-400", children: [
          _jsxDEV("span", { children: new Date(notification.createdAt).toLocaleString() }, void 0, false),
          resultLink &&
          _jsxDEV(Link, {
            to: resultLink,
            className: "inline-flex items-center gap-1 font-semibold text-navy-700 hover:text-gold-600 dark:text-gold-400", children: [
            "View results ",
            _jsxDEV(ExternalLink, { className: "h-3 w-3" }, void 0, false)] 
}, void 0, true
          ),

          requestLink &&
          _jsxDEV(Link, {
            to: requestLink,
            onClick: () => {return onMarkAsRead(notification.id);},
            className: "inline-flex items-center gap-1 rounded-xl bg-teal-100 px-3 py-2 font-bold text-teal-800 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-200", children: [

            notification.type === "groupInvitation" ? "View invitation" : notification.type === "candidateNomination" ? "Respond" : "View request",
            _jsxDEV(ExternalLink, { className: "h-3 w-3" }, void 0, false)] 
}, void 0, true
          ),

          !notification.isRead &&
          _jsxDEV("button", {
            type: "button",
            onClick: () => {return onMarkAsRead(notification.id);},
            className: "font-semibold text-navy-700 hover:text-gold-600 dark:text-navy-200", children:
            "Mark as read" 
}, void 0, false

          ),

          _jsxDEV("button", {
            type: "button",
            onClick: () => {return onDelete(notification.id);},
            className: "inline-flex items-center gap-1 rounded-lg px-1 font-semibold text-navy-400 hover:bg-rose-50 hover:text-red-600", children: [

            _jsxDEV(Trash2, { className: "h-3 w-3" }, void 0, false), " Delete"] 
}, void 0, true
          )] 
}, void 0, true
        )] 
}, void 0, true
      )] 
}, void 0, true
    ));

}

export function NotificationsPage() {
  const { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification, refetch } =
  useNotifications();
  const unreadCount = notifications.filter((n) => {return !n.isRead;}).length;

  return (
    _jsxDEV(Layout, {
 children:
      _jsxDEV("div", {
 className: "mx-auto max-w-4xl", children: [
        _jsxDEV("div", {
 className: "mb-6 flex flex-col gap-4 rounded-2xl border border-navy-100 bg-white/70 p-5 shadow-sm sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:p-6 dark:border-navy-800 dark:bg-navy-900/60", children: [
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", {
 className: "flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold-600", children: [
              _jsxDEV(Bell, { className: "h-4 w-4" }, void 0, false), " Updates"] 
}, void 0, true
            ),
            _jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Stay informed" }, void 0, false),
            _jsxDEV("h1", { className: "mt-2 text-3xl font-extrabold text-navy-900 dark:text-white", children: "Notifications" }, void 0, false

            ),
            _jsxDEV("p", { className: "mt-1 text-sm text-navy-500 dark:text-navy-300", children: "Election, nomination, and results activity." }, void 0, false

            )] 
}, void 0, true
          ),
          unreadCount > 0 &&
          _jsxDEV("button", {
            type: "button",
            onClick: markAllAsRead,
            className: "self-start rounded-lg border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-900", children:
            "Mark all as read" 
}, void 0, false

          )] 
}, void 0, true

        ),

        loading && _jsxDEV(Spinner, { label: "Loading notifications" }, void 0, false),
        !loading && error &&
        _jsxDEV(EmptyState, { title: "Notifications unavailable", description: error }, void 0, false),

        !loading && !error && notifications.length === 0 &&
        _jsxDEV(EmptyState, {
          title: "No notifications yet",
          description: "Election updates appear here.",
          icon: _jsxDEV(Bell, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
        ),

        !loading && !error && notifications.length > 0 &&
        _jsxDEV("div", {
 className: "space-y-3", children:
          notifications.map((notification) => {return (
              _jsxDEV(NotificationItem, {

                notification: notification,
                onMarkAsRead: markAsRead,
                onDelete: deleteNotification,
                onActionDone: refetch ?? (() => {}) 
}, notification.id, false
              ));
          }) 
}, void 0, false
        )] 
}, void 0, true

      ) 
}, void 0, false
    ));

}