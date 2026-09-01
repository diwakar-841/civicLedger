import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Users } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { apiClient } from "../lib/apiClient";

interface MyGroup {
  id: string;
  name: string;
  description: string;
  photo_url: string | null;
  member_count: number;
  joined_at: string;
}

export function GroupsPage() {
  const [groups, setGroups] = useState<MyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiClient
      .get<MyGroup[]>("/groups/mine")
      .then(({ data }) => setGroups(Array.isArray(data) ? data : []))
      .catch(() =>
        setError("Could not load your groups. Please refresh and try again."),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow text-indigo-600">Workspace</p>
        <h1 className="mb-2 mt-1 text-3xl font-extrabold text-navy-900 dark:text-white">
          Your groups
        </h1>
        <p className="mb-7 text-sm text-navy-500">
          Private communities and election spaces you belong to.
        </p>

        {loading && <Spinner label="Loading your groups" />}
        {!loading && error && (
          <EmptyState
            title="Something went wrong"
            description={error}
            icon={<Users className="h-6 w-6" />}
          />
        )}
        {!loading && !error && groups.length === 0 && (
          <EmptyState
            title="No groups yet"
            description="You'll see a group here once you accept an invitation from an administrator."
            icon={<Users className="h-6 w-6" />}
          />
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`} className="group">
                <Card className="flex h-full flex-col p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl">
                  {g.photo_url ? (
                    <img
                      src={g.photo_url}
                      alt={g.name}
                      className="mb-4 h-10 w-10 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                      <Users className="h-5 w-5" />
                    </div>
                  )}
                  <h2 className="font-bold text-navy-900 dark:text-white">
                    {g.name}
                  </h2>
                  <p className="mt-1 line-clamp-2 flex-1 text-sm text-navy-500">
                    {g.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between border-t border-navy-100 pt-3 text-xs text-navy-400">
                    <span className="font-bold uppercase tracking-wide">
                      {g.member_count} members
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-indigo-600 group-hover:text-indigo-800">
                      View <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
