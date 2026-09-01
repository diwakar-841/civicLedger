import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock3,
  History,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  Vote,
  X,
} from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Spinner } from "../../components/shared/Spinner";
import { apiClient } from "../../lib/apiClient";
import { useToast } from "../../contexts/ToastContext";
import { AdminAuthModal } from "../../components/auth/AdminAuthModal";

type Member = {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  profile_photo_url?: string | null;
  is_verified?: boolean;
  wallet_address?: string | null;
  joined_at?: string | null;
  last_login_at?: string | null;
};

type Activity = {
  id: string;
  type: string;
  actor_name: string | null;
  target_name: string | null;
  target_email: string | null;
  detail: string | null;
  created_at: string;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ACTIVITY_STYLES: Record<
  string,
  { label: string; icon: any; tone: string }
> = {
  invitation_sent: {
    label: "Invitation sent",
    icon: UserPlus,
    tone: "bg-indigo-50 text-indigo-700",
  },
  invitation_accepted: {
    label: "Invitation accepted",
    icon: Check,
    tone: "bg-emerald-50 text-emerald-700",
  },
  invitation_rejected: {
    label: "Invitation rejected",
    icon: X,
    tone: "bg-red-50 text-red-700",
  },
  member_removed: {
    label: "Member removed",
    icon: UserMinus,
    tone: "bg-red-50 text-red-700",
  },
  election_created: {
    label: "Election created",
    icon: Vote,
    tone: "bg-teal-50 text-teal-700",
  },
  group_created: {
    label: "Group created",
    icon: Users,
    tone: "bg-indigo-50 text-indigo-700",
  },
  group_updated: {
    label: "Group updated",
    icon: ShieldCheck,
    tone: "bg-gold-50 text-gold-700",
  },
  group_deleted: {
    label: "Group deleted",
    icon: Trash2,
    tone: "bg-red-50 text-red-700",
  },
};

function activityStyle(type: string) {
  return (
    ACTIVITY_STYLES[type] ?? {
      label: type.replace(/_/g, " "),
      icon: History,
      tone: "bg-navy-100 text-navy-600",
    }
  );
}

export function AdminGroupMembersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();

  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<Member | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Member | null>(null);
  const [confirmName, setConfirmName] = useState("");
  const [reason, setReason] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [showRemoveAuth, setShowRemoveAuth] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<
    "all" | "members" | "elections"
  >("all");

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [detail, memberList, activityList] = await Promise.all([
        apiClient.get(`/groups/${id}`),
        apiClient.get(`/groups/${id}/members`),
        apiClient.get(`/groups/${id}/activity`),
      ]);
      setGroup(detail.data);
      setMembers(Array.isArray(memberList.data) ? memberList.data : []);
      setActivity(Array.isArray(activityList.data) ? activityList.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not load group members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return members;
    return members.filter(
      (member) =>
        member.full_name.toLowerCase().includes(term) ||
        member.email.toLowerCase().includes(term) ||
        (member.phone ?? "").toLowerCase().includes(term),
    );
  }, [members, query]);

  const visibleActivity = useMemo(() => {
    if (historyFilter === "all") return activity;
    if (historyFilter === "elections")
      return activity.filter((item) => item.type === "election_created");
    return activity.filter(
      (item) =>
        item.type.startsWith("invitation") || item.type === "member_removed",
    );
  }, [activity, historyFilter]);

  function openRemove(member: Member) {
    setRemoveTarget(member);
    setConfirmName("");
    setReason("");
    setRemoveError("");
    setShowRemoveAuth(false);
  }

  function proceedToAuth() {
    if (!removeTarget) return;
    if (
      confirmName.trim().toLowerCase() !==
      removeTarget.full_name.trim().toLowerCase()
    ) {
      setRemoveError(
        "Type the member's full name exactly as shown to confirm.",
      );
      return;
    }
    if (reason.trim().length < 3) {
      setRemoveError("Please give a short reason for the removal.");
      return;
    }
    setRemoveError("");
    setShowRemoveAuth(true);
  }

  // Called by AdminAuthModal once the admin has verified with biometric/PIN.
  // Throwing here lets AdminAuthModal surface the error in its own banner.
  async function performRemoval() {
    if (!id || !removeTarget) return;
    try {
      await apiClient.delete(`/groups/${id}/members/${removeTarget.id}`, {
        data: { confirmName: confirmName.trim(), reason: reason.trim() },
      });
      show(`${removeTarget.full_name} was removed from the group.`, "success");
      setRemoveTarget(null);
      setSelected(null);
      await load();
    } catch (err: any) {
      throw new Error(
        err?.response?.data?.error ||
          err?.response?.data?.message ||
          "Could not remove this member.",
      );
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-3xl pb-10">
        <div className="mb-5 flex items-center gap-3">
          <button
            onClick={() => navigate(`/admin/groups/${id}`)}
            className="rounded-full border border-navy-200 p-2 text-navy-600 hover:bg-navy-50 dark:border-navy-700 dark:text-white"
            aria-label="Back to group"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold text-navy-900 dark:text-white">
              Manage members
            </h1>
            <p className="truncate text-xs text-navy-500">
              {group?.name ?? "Group"} · {members.length}{" "}
              {members.length === 1 ? "member" : "members"}
            </p>
          </div>
        </div>

        {loading && !group && <Spinner label="Loading members" />}
        {error && (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {}
        <Card className="mb-5 p-5">
          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search members by name, email or phone"
              className="focus-ring w-full rounded-xl border border-navy-200 bg-white py-3 pl-10 pr-10 text-sm shadow-sm dark:border-navy-700 dark:bg-navy-900"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-navy-500">
              {members.length === 0
                ? "No members yet. Invite verified voters from the group page."
                : "No member matched that search."}
            </p>
          ) : (
            <ul className="divide-y divide-navy-100 dark:divide-navy-800">
              {filtered.map((member) => (
                <li key={member.id}>
                  <div className="flex items-center justify-between gap-3 py-3">
                    <button
                      onClick={() =>
                        setSelected(selected?.id === member.id ? null : member)
                      }
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      {member.profile_photo_url ? (
                        <img
                          src={member.profile_photo_url}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                          {initials(member.full_name)}
                        </span>
                      )}
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-navy-900 dark:text-white">
                          {member.full_name}
                        </span>
                        <span className="flex items-center gap-1 truncate text-xs text-navy-400">
                          <Mail className="h-3 w-3" />
                          {member.email}
                        </span>
                      </span>
                    </button>
                    <button
                      onClick={() => openRemove(member)}
                      className="rounded-lg p-2 text-navy-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${member.full_name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {selected?.id === member.id && (
                    <div className="mb-3 rounded-xl bg-navy-50 p-4 text-sm dark:bg-navy-800/60">
                      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy-500">
                        Member details
                      </p>
                      <dl className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-navy-400">Full name</dt>
                          <dd className="font-semibold text-navy-900 dark:text-white">
                            {member.full_name}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-navy-400">Email</dt>
                          <dd className="break-all text-navy-700 dark:text-navy-100">
                            {member.email}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-navy-400">Phone</dt>
                          <dd className="flex items-center gap-1 text-navy-700 dark:text-navy-100">
                            <Phone className="h-3 w-3" />
                            {member.phone || "Not provided"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-navy-400">
                            Verification
                          </dt>
                          <dd className="flex items-center gap-1 text-navy-700 dark:text-navy-100">
                            <ShieldCheck className="h-3 w-3" />
                            {member.is_verified
                              ? "Verified voter"
                              : "Not verified"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-navy-400">
                            Joined group
                          </dt>
                          <dd className="flex items-center gap-1 text-navy-700 dark:text-navy-100">
                            <Calendar className="h-3 w-3" />
                            {formatDateTime(member.joined_at)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-navy-400">Last login</dt>
                          <dd className="text-navy-700 dark:text-navy-100">
                            {formatDateTime(member.last_login_at)}
                          </dd>
                        </div>
                      </dl>
                      <button
                        onClick={() => openRemove(member)}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100"
                      >
                        <UserMinus className="h-3.5 w-3.5" /> Remove from group
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        {}
        <Card className="p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-indigo-600" />
              <div>
                <h2 className="font-bold text-navy-900 dark:text-white">
                  History
                </h2>
                <p className="text-xs text-navy-500">
                  Member and election activity for this group.
                </p>
              </div>
            </div>
            <div className="flex gap-1 rounded-xl bg-navy-50 p-1 dark:bg-navy-800">
              {(["all", "members", "elections"] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setHistoryFilter(key)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${historyFilter === key ? "bg-white text-indigo-700 shadow-sm dark:bg-navy-900" : "text-navy-500"}`}
                >
                  {key}
                </button>
              ))}
            </div>
          </div>

          {visibleActivity.length === 0 ? (
            <p className="py-6 text-center text-sm text-navy-500">
              No activity recorded yet.
            </p>
          ) : (
            <ol className="relative space-y-4 border-l border-navy-100 pl-5 dark:border-navy-800">
              {visibleActivity.map((item) => {
                const style = activityStyle(item.type);
                const Icon = style.icon;
                return (
                  <li key={item.id} className="relative">
                    <span
                      className={`absolute -left-[30px] flex h-6 w-6 items-center justify-center rounded-full ${style.tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="rounded-xl border border-navy-100 bg-white p-3 shadow-sm dark:border-navy-800 dark:bg-navy-900">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.tone}`}
                        >
                          {style.label}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-navy-400">
                          <Clock3 className="h-3 w-3" />
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>
                      {item.target_name && (
                        <p className="mt-2 text-sm font-semibold text-navy-900 dark:text-white">
                          {item.target_name}
                          {item.target_email && (
                            <span className="ml-1 text-xs font-normal text-navy-400">
                              {item.target_email}
                            </span>
                          )}
                        </p>
                      )}
                      {item.detail && (
                        <p className="mt-1 text-xs text-navy-600 dark:text-navy-300">
                          {item.detail}
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-navy-400">
                        By {item.actor_name || "System"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </Card>

        {}
        {removeTarget && !showRemoveAuth && (
          <div
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center"
            role="dialog"
            aria-modal="true"
          >
            <div className="max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-navy-900">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <UserMinus className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="font-bold text-navy-900 dark:text-white">
                      Remove member
                    </h3>
                    <p className="text-xs text-navy-500">
                      This action is recorded in the group history.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setRemoveTarget(null)}
                  className="rounded-lg p-2 text-navy-400 hover:bg-navy-50"
                  aria-label="Cancel removal"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mb-3 rounded-xl bg-navy-50 px-3 py-2 text-sm text-navy-700 dark:bg-navy-800 dark:text-navy-100">
                You are about to remove{" "}
                <strong>{removeTarget.full_name}</strong> ({removeTarget.email})
                from {group?.name}.
              </p>

              <label className="mb-3 block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-navy-500">
                  Type “{removeTarget.full_name}” to confirm
                </span>
                <input
                  value={confirmName}
                  onChange={(event) => setConfirmName(event.target.value)}
                  className="focus-ring w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm dark:border-navy-700 dark:bg-navy-900"
                  placeholder="Member full name"
                />
              </label>

              <label className="mb-3 block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-navy-500">
                  Reason for removal
                </span>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={2}
                  maxLength={200}
                  className="focus-ring w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm dark:border-navy-700 dark:bg-navy-900"
                  placeholder="e.g. Moved out of the ward"
                />
              </label>

              {removeError && (
                <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                  {removeError}
                </p>
              )}

              <div className="flex gap-2">
                <button
                  onClick={proceedToAuth}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Remove member
                </button>
                <button
                  onClick={() => setRemoveTarget(null)}
                  className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-bold text-navy-600 hover:bg-navy-50 dark:border-navy-700 dark:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <AdminAuthModal
          open={!!removeTarget && showRemoveAuth}
          title="Confirm member removal"
          description={
            removeTarget
              ? `Verify it's you to remove ${removeTarget.full_name} from ${group?.name ?? "this group"}.`
              : undefined
          }
          onConfirm={performRemoval}
          onClose={() => setShowRemoveAuth(false)}
        />
      </div>
    </Layout>
  );
}
