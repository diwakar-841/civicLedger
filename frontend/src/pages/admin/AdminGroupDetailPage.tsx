import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  Clock3,
  MoreVertical,
  Pencil,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Vote,
  X,
} from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Spinner } from "../../components/shared/Spinner";
import { VoterDetailModal } from "../../components/admin/VoterDetailModal";
import {
  useVoterSearch,
  type VoterSearchResult,
} from "../../hooks/useAdminElections";
import { apiClient } from "../../lib/apiClient";
import { useToast } from "../../contexts/ToastContext";

type Member = { id: string; full_name: string; email: string };
type GroupRequest = {
  id: string;
  user_id: string;
  status: string;
  created_at: string;
  full_name: string;
  email: string;
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "G"
  );
}

async function fileToCompressedDataUrl(file: File, max = 320): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Unsupported image"));
    img.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function AdminGroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const { results, loading: searching, search, clear } = useVoterSearch();
  const [group, setGroup] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [requests, setRequests] = useState<GroupRequest[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewingVoter, setViewingVoter] = useState<VoterSearchResult | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Edit-group form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    photoUrl: null as string | null,
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [detail, memberList, requestList] = await Promise.all([
        apiClient.get(`/groups/${id}`),
        apiClient.get(`/groups/${id}/members`),
        apiClient.get(`/groups/${id}/requests`),
      ]);
      setGroup(detail.data);
      setMembers(Array.isArray(memberList.data) ? memberList.data : []);
      setRequests(Array.isArray(requestList.data) ? requestList.data : []);
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not load group");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);
  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const statusByUser = useMemo(() => {
    const map = new Map<string, "member" | "pending" | "rejected">();
    for (const request of requests) {
      if (request.status === "pending") map.set(request.user_id, "pending");
      else if (request.status === "rejected")
        map.set(request.user_id, "rejected");
    }
    for (const member of members) map.set(member.id, "member");
    return map;
  }, [members, requests]);

  function openEdit() {
    if (!group) return;
    setForm({
      name: group.name ?? "",
      description: group.description ?? "",
      photoUrl: group.photo_url ?? null,
    });
    setEditError("");
    setEditOpen(true);
  }

  async function pickPhoto(file?: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setEditError("Please choose an image file.");
      return;
    }
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setForm((prev) => ({ ...prev, photoUrl: compressed }));
      setEditError("");
    } catch {
      setEditError("Could not read that image. Try another one.");
    }
  }

  async function saveEdit() {
    if (!id) return;
    const name = form.name.trim();
    const description = form.description.trim();
    if (name.length < 2) {
      setEditError("Group name must be at least 2 characters.");
      return;
    }
    if (!description) {
      setEditError("Group description is required.");
      return;
    }
    setSavingEdit(true);
    try {
      const { data } = await apiClient.put(`/groups/${id}`, {
        name,
        description,
        photoUrl: form.photoUrl,
      });
      setGroup((prev: any) => ({ ...prev, ...data }));
      show("Group details updated.", "success");
      setEditOpen(false);
    } catch (err: any) {
      setEditError(
        err?.response?.data?.error || "Could not save group details.",
      );
    } finally {
      setSavingEdit(false);
    }
  }

  async function invite(user: VoterSearchResult) {
    if (!id) return;
    setSaving(user.id);
    try {
      await apiClient.post(`/groups/${id}/requests`, { userId: user.id });
      show(`Invitation sent to ${user.fullName}.`, "success");
      await load();
    } catch (err: any) {
      show(err?.response?.data?.error || "Could not send invitation.", "error");
    } finally {
      setSaving(null);
    }
  }

  async function deleteGroup() {
    if (!id || !group) return;
    if (
      !window.confirm(
        `Delete "${group.name}"? Members, invitations and this group will be removed.`,
      )
    )
      return;
    setDeleting(true);
    try {
      await apiClient.delete(`/groups/${id}`);
      show("Group deleted.", "success");
      navigate("/admin/groups");
    } catch (err: any) {
      show(err?.response?.data?.error || "Could not delete group.", "error");
    } finally {
      setDeleting(false);
    }
  }

  function startElection() {
    if (!id) return;
    if (memberCount < 3) {
      show(
        `This group has ${memberCount} member${memberCount === 1 ? "" : "s"}. At least 3 are required before starting an election for it.`,
        "error",
      );
      return;
    }
    navigate("/admin/elections/new", {
      state: { groupId: id, groupName: group?.name },
    });
  }

  const pending = requests.filter((r) => r.status === "pending");
  const memberCount = group?.member_count ?? members.length;

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        {loading && !group && <Spinner label="Loading group" />}
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        )}

        {group && (
          <>
            {}
            <div className="relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-500 px-4 pb-6 pt-4 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => navigate("/admin/groups")}
                  className="rounded-full p-2 hover:bg-white/15"
                  aria-label="Back to groups"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setMenuOpen((open) => !open)}
                    className="rounded-full p-2 hover:bg-white/15"
                    aria-label="Group options"
                    aria-haspopup="menu"
                    aria-expanded={menuOpen}
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                  {menuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-navy-100 bg-white text-left shadow-xl dark:border-navy-700 dark:bg-navy-900"
                    >
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          openEdit();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-navy-800 hover:bg-indigo-50 dark:text-white dark:hover:bg-navy-800"
                      >
                        <Pencil className="h-4 w-4 text-indigo-600" /> Edit
                        group details
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          setAddOpen(true);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-navy-800 hover:bg-indigo-50 dark:text-white dark:hover:bg-navy-800"
                      >
                        <UserPlus className="h-4 w-4 text-indigo-600" /> Add
                        members
                      </button>
                      <button
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          startElection();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-navy-800 hover:bg-indigo-50 dark:text-white dark:hover:bg-navy-800"
                      >
                        <Vote className="h-4 w-4 text-teal-600" /> Start
                        election
                      </button>
                      <button
                        role="menuitem"
                        disabled={deleting}
                        onClick={() => {
                          setMenuOpen(false);
                          deleteGroup();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-navy-800"
                      >
                        <Trash2 className="h-4 w-4" />{" "}
                        {deleting ? "Deleting…" : "Delete group"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-2 flex flex-col items-center text-center">
                <button
                  onClick={openEdit}
                  className="group relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-white/25"
                  aria-label="Change group photo"
                >
                  {group.photo_url ? (
                    <img
                      src={group.photo_url}
                      alt={`${group.name} photo`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center bg-white/20 text-2xl font-extrabold">
                      {initials(group.name)}
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/40 py-1 opacity-0 transition group-hover:opacity-100">
                    <Camera className="h-3.5 w-3.5" />
                  </span>
                </button>
                <h1 className="mt-3 text-2xl font-extrabold leading-tight">
                  {group.name}
                </h1>
                <p className="mt-1 text-sm text-white/80">
                  {group.description}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold">
                  <Users className="h-3.5 w-3.5" /> {memberCount}{" "}
                  {memberCount === 1 ? "member" : "members"}
                  {pending.length > 0 && (
                    <span className="ml-1 text-white/80">
                      · {pending.length} pending
                    </span>
                  )}
                </p>

                <div className="mt-4 grid w-full grid-cols-2 gap-2 sm:max-w-sm">
                  <button
                    onClick={() => setAddOpen(true)}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-white/15 px-2 py-2.5 text-sm font-bold hover:bg-white/25"
                  >
                    <UserPlus className="h-4 w-4" /> Add
                  </button>
                  <button
                    onClick={startElection}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2.5 text-sm font-bold text-indigo-700 hover:bg-white/90"
                  >
                    <Vote className="h-4 w-4" /> Election
                  </button>
                </div>
              </div>
            </div>

            {editOpen && (
              <Card className="mb-5 p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Pencil className="h-5 w-5 text-indigo-600" />
                    <div>
                      <h2 className="font-bold text-navy-900 dark:text-white">
                        Edit group details
                      </h2>
                      <p className="text-xs text-navy-500">
                        Update the group name, description and photo.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditOpen(false)}
                    className="rounded-lg p-2 text-navy-400 hover:bg-navy-50"
                    aria-label="Close edit group"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-24 w-24 overflow-hidden rounded-full border border-navy-200 bg-navy-50">
                      {form.photoUrl ? (
                        <img
                          src={form.photoUrl}
                          alt="Group photo preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-xl font-extrabold text-navy-400">
                          {initials(form.name || group.name)}
                        </span>
                      )}
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => pickPhoto(e.target.files?.[0])}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileRef.current?.click()}
                        className="rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                      >
                        {form.photoUrl ? "Change photo" : "Upload photo"}
                      </button>
                      {form.photoUrl && (
                        <button
                          type="button"
                          onClick={() =>
                            setForm((prev) => ({ ...prev, photoUrl: null }))
                          }
                          className="rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 space-y-3">
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-navy-500">
                        Group name
                      </span>
                      <input
                        value={form.name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, name: e.target.value }))
                        }
                        maxLength={120}
                        className="focus-ring w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm shadow-sm"
                        placeholder="e.g. Ward 12 Residents"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-navy-500">
                        Description
                      </span>
                      <textarea
                        value={form.description}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={3}
                        maxLength={500}
                        className="focus-ring w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm shadow-sm"
                        placeholder="What is this group for?"
                      />
                      <span className="mt-1 block text-right text-[11px] text-navy-400">
                        {form.description.length}/500
                      </span>
                    </label>
                    {editError && (
                      <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">
                        {editError}
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={savingEdit}
                        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
                      >
                        {savingEdit ? "Saving…" : "Save changes"}
                      </button>
                      <button
                        onClick={() => setEditOpen(false)}
                        className="rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-bold text-navy-600 hover:bg-navy-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {addOpen && (
              <Card className="mb-5 p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-indigo-600" />
                    <div>
                      <h2 className="font-bold text-navy-900 dark:text-white">
                        Add members
                      </h2>
                      <p className="text-xs text-navy-500">
                        Search a verified voter. People already in the group or
                        already invited are marked.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setAddOpen(false);
                      setQuery("");
                      clear();
                    }}
                    className="rounded-lg p-2 text-navy-400 hover:bg-navy-50"
                    aria-label="Close add members"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by name or voter ID"
                    className="focus-ring w-full rounded-xl border border-navy-200 bg-white py-3 pl-10 pr-10 text-sm shadow-sm"
                  />
                  {query && (
                    <button
                      onClick={() => {
                        setQuery("");
                        clear();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {(searching || results.length > 0) && query.length >= 2 && (
                  <div className="mt-2 divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white shadow-lg dark:divide-navy-800 dark:border-navy-700 dark:bg-navy-900">
                    {searching ? (
                      <p className="p-3 text-sm text-navy-400">
                        Searching voters…
                      </p>
                    ) : (
                      results.map((user) => {
                        const state = statusByUser.get(user.id);
                        const isMember = state === "member";
                        const isPending = state === "pending";
                        const blocked = isMember || isPending;
                        return (
                          <div
                            key={user.id}
                            className={`flex w-full items-center justify-between gap-3 p-3 text-left ${blocked ? "bg-navy-50/60 dark:bg-navy-800/40" : ""}`}
                          >
                            <button
                              type="button"
                              onClick={() => setViewingVoter(user)}
                              className="flex min-w-0 items-center gap-2.5 text-left"
                              aria-label={`View details for ${user.fullName}`}
                              title="View profile"
                            >
                              <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-100 text-xs font-bold text-navy-600 transition hover:ring-2 hover:ring-gold-400 dark:bg-navy-800 dark:text-navy-300">
                                {user.photoUrl ? (
                                  <img
                                    src={user.photoUrl}
                                    alt={user.fullName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  initials(user.fullName)
                                )}
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm font-semibold text-navy-900 dark:text-white">
                                  {user.fullName}
                                </span>
                                <span className="text-xs text-navy-400">
                                  {user.voterId} ·{" "}
                                  {user.walletLinked
                                    ? "Wallet linked"
                                    : "No wallet linked"}
                                </span>
                              </span>
                            </button>
                            {isMember ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700">
                                <UserCheck className="h-3 w-3" /> Already a
                                member
                              </span>
                            ) : isPending ? (
                              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-bold text-gold-700">
                                <Clock3 className="h-3 w-3" /> Invitation sent
                              </span>
                            ) : (
                              <button
                                disabled={saving === user.id}
                                onClick={() => invite(user)}
                                className="shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                              >
                                {saving === user.id
                                  ? "Sending…"
                                  : state === "rejected"
                                    ? "Invite again"
                                    : "Invite"}
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                    {!searching && results.length === 0 && (
                      <p className="p-3 text-sm text-navy-400">
                        No verified voters matched that search.
                      </p>
                    )}
                  </div>
                )}
              </Card>
            )}

            <Card className="mb-5 p-0 overflow-hidden">
              <button
                onClick={() => navigate(`/admin/groups/${id}/members`)}
                className="flex w-full items-center justify-between gap-3 p-5 text-left hover:bg-indigo-50/60 dark:hover:bg-navy-800"
              >
                <span className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
                    <Users className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block font-bold text-navy-900 dark:text-white">
                      Manage members
                    </span>
                    <span className="block text-xs text-navy-500">
                      Search members, view details, remove members and see the
                      full activity history.
                    </span>
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                    {memberCount}
                  </span>
                  {pending.length > 0 && (
                    <span className="rounded-full bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-700">
                      {pending.length} pending
                    </span>
                  )}
                  <ChevronRight className="h-5 w-5 text-navy-400" />
                </span>
              </button>
            </Card>
          </>
        )}
      </div>
      {viewingVoter && (
        <VoterDetailModal
          voter={viewingVoter}
          onClose={() => setViewingVoter(null)}
          alreadyAdded={
            statusByUser.get(viewingVoter.id) === "member" ||
            statusByUser.get(viewingVoter.id) === "pending"
          }
          onAdd={
            statusByUser.get(viewingVoter.id) === "member" ||
            statusByUser.get(viewingVoter.id) === "pending"
              ? undefined
              : () => {
                  invite(viewingVoter);
                  setViewingVoter(null);
                }
          }
        />
      )}
    </Layout>
  );
}
