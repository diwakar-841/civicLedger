import { FormEvent, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, BadgeCheck, UserPlus, X } from "lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Button } from "../../components/shared/Button";
import { TextField, TextAreaField } from "../../components/shared/Input";
import { AdminAuthModal } from "../../components/auth/AdminAuthModal";
import { VoterDetailModal } from "../../components/admin/VoterDetailModal";
import { apiClient } from "../../lib/apiClient";
import { useToast } from "../../contexts/ToastContext";
import {
  useVoterSearch,
  type VoterSearchResult,
} from "../../hooks/useAdminElections";

export function CreateGroupPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [voterQuery, setVoterQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState<VoterSearchResult[]>([]);
  const [viewingVoter, setViewingVoter] = useState<VoterSearchResult | null>(
    null,
  );
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { show } = useToast();
  const {
    results: voterResults,
    loading: searching,
    search,
    clear,
  } = useVoterSearch();

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node))
        setShowDropdown(false);
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (voterQuery.trim().length >= 2) {
        search(voterQuery);
        setShowDropdown(true);
      } else {
        clear();
        setShowDropdown(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [voterQuery, search, clear]);

  function addVoter(voter: VoterSearchResult) {
    if (selected.some((v) => v.id === voter.id)) return;
    setSelected((prev) => [...prev, voter]);
    setVoterQuery("");
    clear();
    setShowDropdown(false);
  }

  function removeVoter(id: string) {
    setSelected((prev) => prev.filter((v) => v.id !== id));
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setConfirm(true);
  }

  async function create() {
    setLoading(true);
    try {
      await apiClient.post("/groups", {
        name: title,
        description,
        userIds: selected.map((u) => u.id),
      });
      show("Group created and invitations sent.", "success");
      navigate("/groups");
    } catch (e: any) {
      show(e?.response?.data?.error || "Could not create group", "error");
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  function initialsOf(name: string) {
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0])
      .join("");
  }

  return (
    <Layout>
      <div className="mx-auto max-w-xl">
        <p className="eyebrow text-indigo-600">Workspace setup</p>
        <h1 className="mb-2 mt-1 text-3xl font-extrabold text-navy-900 dark:text-white">
          Create a group
        </h1>
        <p className="mb-7 text-sm text-navy-500">
          Bring voters together and invite them to private elections.
        </p>
        <div className="px-1 sm:px-2">
          <form onSubmit={submit} className="flex flex-col gap-4">
            <TextField
              label="Title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
            <TextAreaField
              label="Description"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
            />

            <div ref={searchRef} className="relative">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-500">
                Search members to invite
              </label>
              <div className="relative flex items-center">
                <Search className="pointer-events-none absolute left-3 h-4 w-4 text-navy-400" />
                <input
                  type="text"
                  value={voterQuery}
                  onChange={(e) => setVoterQuery(e.target.value)}
                  placeholder="Search by name or voter ID…"
                  className="focus-ring w-full rounded-xl border border-navy-200 py-3 pl-9 pr-4 text-sm shadow-sm"
                />
              </div>

              {showDropdown && (
                <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-navy-200 bg-white shadow-lg">
                  {searching && (
                    <div className="px-4 py-3 text-sm text-navy-400">
                      Searching…
                    </div>
                  )}
                  {!searching && voterResults.length === 0 && (
                    <div className="px-4 py-3 text-sm text-navy-400">
                      No verified voters found
                    </div>
                  )}
                  {!searching &&
                    voterResults.map((v) => {
                      const alreadyAdded = selected.some((s) => s.id === v.id);
                      return (
                        <div
                          key={v.id}
                          className={`flex w-full items-center gap-3 border-b border-navy-100 px-4 py-3 last:border-0 ${
                            alreadyAdded ? "opacity-40" : "hover:bg-navy-50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setViewingVoter(v)}
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-100 text-sm font-bold text-navy-600 transition hover:ring-2 hover:ring-gold-400"
                            aria-label={`View details for ${v.fullName}`}
                            title="View details"
                          >
                            {v.photoUrl ? (
                              <img
                                src={v.photoUrl}
                                alt={v.fullName}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              initialsOf(v.fullName)
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setViewingVoter(v)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-medium text-navy-900">
                              {v.fullName}
                            </p>
                            <p className="font-mono text-xs text-navy-500">
                              {v.voterId}
                            </p>
                          </button>
                          <div className="flex flex-shrink-0 items-center gap-1.5">
                            {v.walletLinked && (
                              <BadgeCheck className="h-4 w-4 text-emerald-500" />
                            )}
                            {alreadyAdded ? (
                              <span className="text-[10px] font-semibold text-emerald-600">
                                Added
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => addVoter(v)}
                                className="rounded-lg bg-gold-100 px-2.5 py-1 text-xs font-semibold text-gold-700 hover:bg-gold-200"
                              >
                                Add
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {selected.length > 0 ? (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">
                  Selected ({selected.length})
                </p>
                {selected.map((v) => (
                  <div
                    key={v.id}
                    className="flex items-center gap-3 rounded-xl border border-navy-200 bg-white px-3 py-2.5"
                  >
                    <button
                      type="button"
                      onClick={() => setViewingVoter(v)}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gold-100 text-sm font-bold text-gold-700 transition hover:ring-2 hover:ring-gold-400"
                    >
                      {v.photoUrl ? (
                        <img
                          src={v.photoUrl}
                          alt={v.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        initialsOf(v.fullName)
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-navy-900">
                        {v.fullName}
                      </p>
                      <p className="font-mono text-xs text-navy-500">
                        {v.voterId}
                      </p>
                    </div>
                    {v.walletLinked && (
                      <BadgeCheck className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                    )}
                    <button
                      type="button"
                      onClick={() => removeVoter(v.id)}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Remove ${v.fullName}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-navy-200 px-4 py-5 text-sm text-navy-400">
                <UserPlus className="h-5 w-5 flex-shrink-0" />
                <span>
                  No members selected yet — a group can start with none, and you
                  can invite more later.
                </span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              className="mt-2"
              disabled={!title.trim() || !description.trim()}
            >
              Review and create group
            </Button>
          </form>
        </div>
      </div>

      <AdminAuthModal
        open={confirm}
        title="Confirm group creation"
        description={`Create "${title}" and send ${selected.length} invitation${selected.length === 1 ? "" : "s"}?`}
        onConfirm={create}
        onClose={() => setConfirm(false)}
      />
      {viewingVoter && (
        <VoterDetailModal
          voter={viewingVoter}
          onClose={() => setViewingVoter(null)}
          alreadyAdded={selected.some((s) => s.id === viewingVoter.id)}
          onAdd={
            selected.some((s) => s.id === viewingVoter.id)
              ? undefined
              : () => {
                  addVoter(viewingVoter);
                  setViewingVoter(null);
                }
          }
        />
      )}
    </Layout>
  );
}
