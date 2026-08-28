import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Users, UserRound } from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { EmptyState } from "../../components/shared/EmptyState";
import { Spinner } from "../../components/shared/Spinner";
import { apiClient } from "../../lib/apiClient";

export function AdminGroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    apiClient.get("/groups").then(({ data }) => setGroups(Array.isArray(data) ? data : [])).catch(() => setGroups([])).finally(() => setLoading(false));
  }, []);

  return <Layout>
    <div className="mb-7 flex items-end justify-between gap-4">
      <div><p className="eyebrow text-indigo-600">Workspace</p><h1 className="mt-1 text-3xl font-extrabold text-navy-900 dark:text-white">Groups</h1><p className="mt-1 text-sm text-navy-500">Manage your voter communities and election spaces.</p></div>
      <Link to="/admin/groups/new"><Button size="sm" className="hidden sm:flex"><Plus className="h-4 w-4" />New group</Button></Link>
    </div>
    {loading && <Spinner label="Loading groups" />}
    {!loading && groups.length === 0 && <EmptyState title="No groups yet" description="Create a group to organize voters around an election." icon={<Users className="h-6 w-6" />} action={<Link to="/admin/groups/new"><Button size="sm">Create group</Button></Link>} />}
    {!loading && groups.length > 0 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{groups.map((group) => <Link key={group.id} to={`/admin/groups/${group.id}`} className="group"><Card className="h-full p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl"><div className="mb-5 flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600"><Users className="h-5 w-5" /></span><ArrowRight className="h-4 w-4 text-navy-300 transition group-hover:translate-x-1 group-hover:text-indigo-600" /></div><h2 className="font-bold text-navy-900 dark:text-white">{group.name}</h2><p className="mt-1 line-clamp-2 min-h-10 text-sm text-navy-500">{group.description || "No description added yet."}</p><div className="mt-5 flex items-center gap-1.5 border-t border-navy-100 pt-4 text-xs font-bold uppercase tracking-wide text-navy-400"><UserRound className="h-3.5 w-3.5" />{group.member_count ?? 0} members</div></Card></Link>)}</div>}
  </Layout>;
}