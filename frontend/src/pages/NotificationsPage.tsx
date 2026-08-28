import { useState } from "react";
import { Bell, CheckCircle2, Trash2, AlertCircle, ExternalLink, Info, Calendar, X, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { EmptyState } from "../components/shared/EmptyState";
import { Spinner } from "../components/shared/Spinner";
import { useNotifications, type Notification } from "../hooks/useNotifications";
import { apiClient } from "../lib/apiClient";

// ── Insufficient-candidates action panel ──────────────────────────────────────

interface InsufficientCandidatesActionsProps {
  electionId: string;
  electionTitle?: string;
  onActionDone?: () => void;
}

function InsufficientCandidatesActions({
  electionId,
  electionTitle,
  onActionDone,
}: InsufficientCandidatesActionsProps) {
  const [extending, setExtending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [extendHours, setExtendHours] = useState(12);
  const [showExtendForm, setShowExtendForm] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  async function handleExtend() {
    setExtending(true);
    setLocalError(null);
    try {
      await apiClient.post(`/admin/elections/${electionId}/extend-deadline`, {
        hours: extendHours,
      });
      setShowExtendForm(false);
      onActionDone?.();
    } catch (err: any) {
      setLocalError(err?.response?.data?.error || "Failed to extend deadline");
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
    } catch (err: any) {
      setLocalError(err?.response?.data?.error || "Failed to close election");
    } finally {
      setClosing(false);
      setConfirmClose(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      {localError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950/30 dark:text-red-400">
          {localError}
        </p>
      )}

      {/* Extend deadline */}
      {!showExtendForm ? (
        <button
          type="button"
          onClick={() => setShowExtendForm(true)}
          className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400"
        >
          <Calendar className="h-4 w-4" />
          Extend deadline
        </button>
      ) : (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/30">
          <p className="mb-2 text-xs font-semibold text-blue-800 dark:text-blue-300">
            Extend by (10–24h, once, non-responders only)
          </p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={10}
              max={24}
              value={extendHours}
              onChange={(e) => setExtendHours(Math.min(24, Math.max(10, parseInt(e.target.value) || 12)))}
              className="w-24 rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-sm text-navy-900 focus:border-blue-400 focus:outline-none dark:bg-navy-800 dark:text-navy-50"
            />
            <span className="text-xs text-blue-700 dark:text-blue-400">hours</span>
            <Button
              size="sm"
              loading={extending}
              onClick={handleExtend}
              className="ml-auto"
            >
              Extend
            </Button>
            <button
              type="button"
              onClick={() => setShowExtendForm(false)}
              className="text-navy-400 hover:text-navy-700"
              aria-label="Cancel"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Close election */}
      {!confirmClose ? (
        <button
          type="button"
          onClick={() => setConfirmClose(true)}
          className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-100 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
          Close election
        </button>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30">
          <p className="mb-2 text-xs font-semibold text-red-700 dark:text-red-400">
            Close &quot;{electionTitle ?? "this election"}&quot; permanently?
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              loading={closing}
              onClick={handleClose}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Close
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setConfirmClose(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Icon helper ───────────────────────────────────────────────────────────────

function iconFor(type: string) {
  if (type === "resultsAnnounced") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (type === "insufficientCandidates" || type === "notEnoughCandidates") {
    return <AlertTriangle className="h-5 w-5 text-red-500" />;
  }
  if (type.includes("Nomination") || type.includes("candidate")) {
    return <AlertCircle className="h-5 w-5 text-gold-600" />;
  }
  return <Info className="h-5 w-5 text-navy-500" />;
}

// ── Single notification row ───────────────────────────────────────────────────

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onActionDone,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onActionDone: () => void;
}) {
  const resultLink =
    notification.type === "resultsAnnounced" && notification.relatedId
      ? `/elections/${notification.relatedId}/results`
      : null;
  const requestLink =
    notification.relatedId &&
    (notification.type === "candidateNomination" ||
      notification.type === "nominationAccepted" ||
      notification.type === "nominationRejected" ||
       notification.type === "nominationExpired" ||
       notification.type === "groupInvitation")
      ? `/requests`
      : null;

  // "Not enough candidates" type — show action buttons
  const isInsufficientCandidates =
    notification.type === "insufficientCandidates" ||
    notification.type === "notEnoughCandidates";

  return (
    <div
      className={`relative flex gap-3 rounded-2xl border border-navy-100 px-4 py-5 shadow-sm sm:gap-4 sm:px-6 dark:border-navy-800 ${
        !notification.isRead ? "bg-indigo-50/60 dark:bg-indigo-950/20" : "bg-white dark:bg-navy-900"
      }`}
    >
      {!notification.isRead && <span className="absolute left-0 top-0 h-full w-1 bg-indigo-500" />}
      <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-navy-800">
        {iconFor(notification.type)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h2 className="font-semibold text-navy-900 dark:text-white">{notification.title}</h2>
          {!notification.isRead && (
            <span className="rounded-full bg-indigo-600 px-2 py-1 text-[10px] font-extrabold uppercase tracking-wide text-white">
              New
            </span>
          )}
        </div>

        <p className="mt-1 text-sm leading-6 text-navy-600 dark:text-navy-300">
          {notification.message}
        </p>

        {/* Action panel for insufficient candidates */}
        {isInsufficientCandidates && notification.relatedId && (
          <InsufficientCandidatesActions
            electionId={notification.relatedId}
            electionTitle={notification.title}
            onActionDone={() => {
              onMarkAsRead(notification.id);
              onActionDone();
            }}
          />
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-navy-400">
          <span>{new Date(notification.createdAt).toLocaleString()}</span>
          {resultLink && (
            <Link
              to={resultLink}
              className="inline-flex items-center gap-1 font-semibold text-navy-700 hover:text-gold-600 dark:text-gold-400"
            >
              View results <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          {requestLink && (
            <Link
              to={requestLink}
              onClick={() => onMarkAsRead(notification.id)}
              className="inline-flex items-center gap-1 rounded-xl bg-teal-100 px-3 py-2 font-bold text-teal-800 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-200"
            >
              {notification.type === "groupInvitation" ? "View invitation" : notification.type === "candidateNomination" ? "Respond" : "View request"}
              <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          {!notification.isRead && (
            <button
              type="button"
              onClick={() => onMarkAsRead(notification.id)}
              className="font-semibold text-navy-700 hover:text-gold-600 dark:text-navy-200"
            >
              Mark as read
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(notification.id)}
            className="inline-flex items-center gap-1 rounded-lg px-1 font-semibold text-navy-400 hover:bg-rose-50 hover:text-red-600"
          >
            <Trash2 className="h-3 w-3" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function NotificationsPage() {
  const { notifications, loading, error, markAsRead, markAllAsRead, deleteNotification, refetch } =
    useNotifications();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-navy-100 bg-white/70 p-5 shadow-sm sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:p-6 dark:border-navy-800 dark:bg-navy-900/60">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gold-600">
              <Bell className="h-4 w-4" /> Updates
            </p>
            <p className="eyebrow text-indigo-600">Stay informed</p>
            <h1 className="mt-2 text-3xl font-extrabold text-navy-900 dark:text-white">
              Notifications
            </h1>
            <p className="mt-1 text-sm text-navy-500 dark:text-navy-300">
              Election, nomination, and results activity.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="self-start rounded-lg border border-navy-200 px-4 py-2.5 text-sm font-semibold text-navy-700 hover:bg-navy-50 dark:border-navy-700 dark:text-navy-200 dark:hover:bg-navy-900"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading && <Spinner label="Loading notifications" />}
        {!loading && error && (
          <EmptyState title="Notifications unavailable" description={error} />
        )}
        {!loading && !error && notifications.length === 0 && (
          <EmptyState
            title="No notifications yet"
            description="Election updates appear here."
            icon={<Bell className="h-6 w-6" />}
          />
        )}
        {!loading && !error && notifications.length > 0 && (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onActionDone={refetch ?? (() => {})}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
