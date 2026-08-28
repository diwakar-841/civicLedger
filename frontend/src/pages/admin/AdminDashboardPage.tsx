import { Link } from "react-router-dom";
import { Vote, CalendarClock, BarChart3, ArrowRight, Activity, FileEdit, CheckCircle2 } from "lucide-react";
import { useMemo } from "react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { Spinner } from "../../components/shared/Spinner";
import { EmptyState } from "../../components/shared/EmptyState";
import { StatusBadge } from "../../components/shared/Badge";
import { useAdminElectionsForDashboard } from "../../hooks/useAdminElectionsForDashboard";
import { deriveStatus } from "../../hooks/useElections";

export function AdminDashboardPage() {
  const { elections, loading, error } = useAdminElectionsForDashboard();

  const counts = useMemo(() => ({
    open: elections.filter((e) => deriveStatus(e) === "active").length,
    draft: elections.filter((e) => deriveStatus(e) === "draft").length,
    closed: elections.filter((e) => deriveStatus(e) === "closed" || deriveStatus(e) === "cancelled").length,
  }), [elections]);

  // Priority feed: what actually needs the admin's attention right now —
  // drafts to finish setting up, then elections currently open to watch.
  // Closed elections don't need action, so they're left off this list
  // (Analytics/Elections still cover them in full).
  const attention = useMemo(
    () => [
      ...elections.filter((e) => deriveStatus(e) === "draft"),
      ...elections.filter((e) => deriveStatus(e) === "active"),
    ].slice(0, 5),
    [elections]
  );

  const ElectionRow = ({ election }: { election: any }) => {
    const status = deriveStatus(election);
    // Candidates can only be added/edited while the election is still a
    // draft (before nominations are sent / voting starts). Once it's live
    // or closed, "Manage" should route to the status/monitoring view
    // instead of the (no longer usable) candidate wizard.
    const manageTo = status === "draft"
      ? `/admin/elections/${election.id}/candidates`
      : `/admin/elections/${election.id}/status`;
    return (
    <Card className="relative flex flex-col gap-4 border-l-4 border-l-indigo-500 p-5 transition hover:-translate-y-0.5 hover:shadow-xl sm:flex-row sm:items-center sm:justify-between dark:bg-navy-900 dark:border-navy-700">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <h2 className="font-semibold text-navy-900 dark:text-navy-100">{election.title}</h2>
          <StatusBadge status={status} />
        </div>
        <p className="flex items-center gap-1.5 text-xs text-navy-400 dark:text-navy-500">
          <CalendarClock className="h-3.5 w-3.5" />
          {election.startTime && election.endTime
            ? `${new Date(election.startTime).toLocaleString()} – ${new Date(election.endTime).toLocaleString()}`
            : "Not scheduled yet — add candidates to continue setup"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link to={manageTo}><Button size="sm" variant="ghost">Manage</Button></Link>
        <Link to={`/admin/elections/${election.id}/analytics`}><Button size="sm" variant="ghost"><BarChart3 className="h-4 w-4" />Analytics</Button></Link>
      </div>
    </Card>
    );
  };

  return (
    <Layout>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="eyebrow text-indigo-600">Control center</p>
          <h1 className="mt-1 text-3xl font-extrabold text-navy-900 dark:text-navy-50">Admin dashboard</h1>
          <p className="mt-1 text-navy-500 dark:text-navy-400">Create elections, manage candidates, and monitor results.</p>
        </div>

        {!loading && !error && elections.length > 0 && (
          <Link
            to="/admin/elections"
            className="flex items-center divide-x divide-navy-100 self-start rounded-2xl border border-navy-100 bg-white shadow-sm transition hover:border-indigo-200 hover:shadow-md dark:divide-navy-800 dark:border-navy-800 dark:bg-navy-900"
          >
            <span className="flex items-center gap-2 px-4 py-3">
              <Activity className="h-4 w-4 text-emerald-500" />
              <span className="text-lg font-extrabold text-navy-900 dark:text-white">{counts.open}</span>
              <span className="text-xs font-semibold text-navy-500">Open</span>
            </span>
            <span className="flex items-center gap-2 px-4 py-3">
              <FileEdit className="h-4 w-4 text-gold-500" />
              <span className="text-lg font-extrabold text-navy-900 dark:text-white">{counts.draft}</span>
              <span className="text-xs font-semibold text-navy-500">Draft</span>
            </span>
            <span className="flex items-center gap-2 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 text-navy-400" />
              <span className="text-lg font-extrabold text-navy-900 dark:text-white">{counts.closed}</span>
              <span className="text-xs font-semibold text-navy-500">Closed</span>
            </span>
          </Link>
        )}
      </div>

      {loading && <Spinner label="Loading elections" />}
      {!loading && error && <EmptyState title="Something went wrong" description={error} />}
      {!loading && !error && elections.length === 0 && (
        <EmptyState
          title="No elections yet"
          description="Create your first election to start collecting verified on-chain votes."
          icon={<Vote className="h-6 w-6" />}
          action={
            <Link to="/admin/elections/new">
              <Button size="sm" variant="secondary">Create election</Button>
            </Link>
          }
        />
      )}

      {!loading && !error && elections.length > 0 && (
        <>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold text-navy-900 dark:text-navy-50">Needs your attention</h2>
            <Link to="/admin/elections" className="flex items-center gap-1 text-sm font-semibold text-gold-700 hover:underline">
              View all elections <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {attention.length > 0 ? (
            <div className="flex flex-col gap-3">
              {attention.map((e) => <ElectionRow key={e.id} election={e} />)}
            </div>
          ) : (
            <Card className="p-5 text-sm text-navy-400">Nothing needs attention right now — all elections are closed or up to date.</Card>
          )}
        </>
      )}
    </Layout>
  );
}
