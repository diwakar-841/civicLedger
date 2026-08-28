import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, Users } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { apiClient } from "../lib/apiClient";

interface GroupDetails {
  id: string;
  name: string;
  description: string;
  photo_url: string | null;
  member_count: number;
  created_at: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  profile_photo_url: string | null;
  is_verified: boolean;
  joined_at: string;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("") || "?";
}

/**
 * Group details + member roster for a voter/candidate who belongs to the
 * group. Read-only — membership management stays an admin-only capability.
 */
export function GroupDetailPage() {
  const { id } = useParams();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersRestricted, setMembersRestricted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    setMembersRestricted(false);
    Promise.allSettled([apiClient.get<GroupDetails>(`/groups/${id}`), apiClient.get<Member[]>(`/groups/${id}/members`)])
      .then(([groupRes, membersRes]) => {
        if (groupRes.status === "fulfilled") {
          setGroup(groupRes.value.data);
        } else {
          setError((groupRes.reason as any)?.response?.data?.error || "Could not load this group.");
        }
        if (membersRes.status === "fulfilled") {
          setMembers(Array.isArray(membersRes.value.data) ? membersRes.value.data : []);
        } else {
          // Not yet a member (e.g. still deciding on an invitation) — the
          // roster is member-only, but the group's own details above still
          // loaded, so show those and just skip the member list.
          setMembersRestricted(true);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <Link to="/groups" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-indigo-700">
          <ArrowLeft className="h-4 w-4" /> Back to your groups
        </Link>

        {loading && <Spinner label="Loading group" />}
        {!loading && error && <EmptyState title="Something went wrong" description={error} icon={<Users className="h-6 w-6" />} />}

        {!loading && !error && group && (
          <>
            <Card className="mb-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
              {group.photo_url ? (
                <img src={group.photo_url} alt={group.name} className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover" />
              ) : (
                <span className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-extrabold text-white"><Users className="h-7 w-7" /></span>
              )}
              <div>
                <h1 className="text-2xl font-extrabold text-navy-900 dark:text-white">{group.name}</h1>
                <p className="mt-1 text-sm text-navy-500">{group.description}</p>
                <p className="mt-2 text-xs font-bold uppercase tracking-wide text-navy-400">{group.member_count} members</p>
              </div>
            </Card>

            <h2 className="mb-3 text-lg font-bold text-navy-900 dark:text-white">Members</h2>
            {membersRestricted && (
              <EmptyState title="Members list is visible to group members" description="Accept the invitation to see who else is in this group." icon={<Users className="h-6 w-6" />} />
            )}
            {!membersRestricted && members.length === 0 && <EmptyState title="No members yet" icon={<Users className="h-6 w-6" />} />}
            {!membersRestricted && members.length > 0 && (
              <div className="flex flex-col gap-2">
                {members.map((m) => (
                  <Card key={m.id} className="flex items-center gap-3 p-4">
                    {m.profile_photo_url ? (
                      <img src={m.profile_photo_url} alt={m.full_name} className="h-10 w-10 flex-shrink-0 rounded-full object-cover" />
                    ) : (
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700">{initials(m.full_name)}</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-bold text-navy-900 dark:text-white">
                        {m.full_name}
                        {m.is_verified && <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />}
                      </p>
                      <p className="flex items-center gap-1 truncate text-xs text-navy-500"><Mail className="h-3 w-3 flex-shrink-0" />{m.email}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
