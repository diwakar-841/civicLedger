import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Bell, ClipboardList, ShieldCheck, Users, Vote } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { apiClient } from "../lib/apiClient";
import { useAuthContext } from "../contexts/AuthContext";
import { useElections, deriveStatus } from "../hooks/useElections";
import { useNotifications } from "../hooks/useNotifications";
import { useCandidateRequests } from "../hooks/useCandidateRequests";

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function HomePage() {
  const { user } = useAuthContext();
  const { elections, loading: electionsLoading } = useElections();
  const { notifications, loading: notificationsLoading } = useNotifications();
  const { requests, loading: requestsLoading } = useCandidateRequests();
  const [groupsCount, setGroupsCount] = useState<number | null>(null);

  useEffect(() => {
    apiClient
      .get<unknown[]>("/groups/mine")
      .then(({ data }) => setGroupsCount(Array.isArray(data) ? data.length : 0))
      .catch(() => setGroupsCount(0));
  }, []);

  const activeCount = elections.filter((e) => deriveStatus(e) === "active").length;
  const myCandidacies = elections.filter((e) => e.candidates?.some((c) => c.voterUserId === user?.id)).length;
  const pendingRequests = requests.filter((r) => r.status === "pending").length;
  const unreadNotifications = notifications.filter((n) => !n.isRead);
  const updatesLoading = notificationsLoading || requestsLoading;

  return (
    <Layout>
      <div className="relative mb-6 overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-700 via-indigo-600 to-violet-600 px-5 py-7 text-white shadow-xl shadow-indigo-600/20 sm:mb-8 sm:px-9 sm:py-10">
        <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border-[24px] border-white/10" />
        <div className="pointer-events-none absolute bottom-[-5rem] right-24 h-48 w-48 rounded-full bg-teal-300/20 blur-2xl" />
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-200">
          <ShieldCheck className="h-3.5 w-3.5" />
          Welcome{user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}
        </p>
        <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight sm:text-3xl">Your dashboard</h1>
        <p className="mt-1 max-w-md text-sm text-indigo-100">
          Every ballot cast here is signed by your own wallet and verified on-chain.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:grid-cols-4">
        <Link to="/elections">
          <Card className="flex flex-col gap-1 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Vote className="h-4 w-4" /></span>
            <p className="mt-1 text-2xl font-extrabold text-navy-900 dark:text-white">{activeCount}</p>
            <p className="text-xs font-semibold text-navy-500">Open for voting</p>
          </Card>
        </Link>
        <Link to="/my-elections">
          <Card className="flex flex-col gap-1 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><ClipboardList className="h-4 w-4" /></span>
            <p className="mt-1 text-2xl font-extrabold text-navy-900 dark:text-white">{myCandidacies}</p>
            <p className="text-xs font-semibold text-navy-500">Active candidacies</p>
          </Card>
        </Link>
        <Link to="/groups">
          <Card className="flex flex-col gap-1 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600"><Users className="h-4 w-4" /></span>
            <p className="mt-1 text-2xl font-extrabold text-navy-900 dark:text-white">{groupsCount ?? "—"}</p>
            <p className="text-xs font-semibold text-navy-500">Your groups</p>
          </Card>
        </Link>
        <Link to="/requests">
          <Card className="flex flex-col gap-1 p-4 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Bell className="h-4 w-4" /></span>
            <p className="mt-1 text-2xl font-extrabold text-navy-900 dark:text-white">{pendingRequests}</p>
            <p className="text-xs font-semibold text-navy-500">Pending requests</p>
          </Card>
        </Link>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-navy-900 dark:text-white">Important updates</h2>
        <Link to="/notifications" className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
          See all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {(updatesLoading || electionsLoading) && <Spinner label="Loading updates" />}

      {!updatesLoading && unreadNotifications.length === 0 && (
        <EmptyState title="You're all caught up" description="No new updates right now — check back later." icon={<Bell className="h-6 w-6" />} />
      )}

      {!updatesLoading && unreadNotifications.length > 0 && (
        <div className="flex flex-col gap-3">
          {unreadNotifications.slice(0, 5).map((n) => (
            <Card key={n.id} className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600"><Bell className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-navy-900 dark:text-white">{n.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-navy-500">{n.message}</p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-navy-400">{timeAgo(n.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Layout>
  );
}
