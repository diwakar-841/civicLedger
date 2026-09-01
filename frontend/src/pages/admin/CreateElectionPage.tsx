import { useState, FormEvent, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/Layout";
import { Button } from "../../components/shared/Button";
import { TextField, TextAreaField } from "../../components/shared/Input";
import { useCreateElection } from "../../hooks/useAdminElections";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";
import { apiClient } from "../../lib/apiClient";

export function CreateElectionPage() {
  const location = useLocation();
  const preset = (location.state as { groupId?: string } | null) ?? null;
  const [form, setForm] = useState({
    title: "",
    description: "",
    electionType: preset?.groupId ? "group" : "public",
    groupId: preset?.groupId ?? "",
  });
  const [groups, setGroups] = useState<any[]>([]);
  useEffect(() => {
    apiClient
      .get("/groups")
      .then(({ data }) => setGroups(data))
      .catch(() => {});
  }, []);
  const { createElection, loading } = useCreateElection();
  const { show } = useToast();
  const navigate = useNavigate();
  const selectedGroup =
    form.electionType === "group"
      ? groups.find((g) => g.id === form.groupId)
      : undefined;
  const groupTooSmall =
    form.electionType === "group" &&
    Boolean(selectedGroup) &&
    (selectedGroup.member_count ?? 0) < 3;

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const election = await createElection({
        title: form.title,
        description: form.description,
        electionType: form.electionType as "public" | "group",
        groupId: form.electionType === "group" ? form.groupId : undefined,
      });
      show("Election created. Add at least 2 candidates.", "success");
      navigate(`/admin/elections/${election.id}/candidates`);
    } catch (err) {
      show(formatError(err, "Could not create election"), "error");
    }
  }

  return (
    <Layout>
      <div className="mx-auto max-w-xl">
        <p className="eyebrow text-indigo-600">Election setup</p>
        <h1 className="mb-2 mt-1 text-3xl font-extrabold text-navy-900">
          Create an election
        </h1>
        <p className="mb-7 text-sm text-navy-500">
          Candidates are added in the next step.
        </p>
        <div className="px-1 sm:px-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <TextField
              label="Title"
              required
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
            />
            <TextAreaField
              label="Description"
              rows={3}
              required
              value={form.description}
              onChange={(e) => update("description", e.target.value)}
            />
            <div>
              <label className="mb-1 block text-sm font-medium text-navy-700">
                Election access
              </label>
              <select
                className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm"
                value={form.electionType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    electionType: e.target.value,
                    groupId: "",
                  })
                }
              >
                <option value="public">Public Election</option>
                <option value="group">Group Election</option>
              </select>
            </div>
            {form.electionType === "group" && (
              <div>
                <label className="mb-1 block text-sm font-medium text-navy-700">
                  Group
                </label>
                <select
                  required
                  className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm"
                  value={form.groupId}
                  onChange={(e) =>
                    setForm({ ...form, groupId: e.target.value })
                  }
                >
                  <option value="">Select a group</option>
                  {groups.map((g) => (
                    <option
                      key={g.id}
                      value={g.id}
                      disabled={(g.member_count ?? 0) < 3}
                    >
                      {g.name} ({g.member_count ?? 0} member
                      {(g.member_count ?? 0) === 1 ? "" : "s"}
                      {(g.member_count ?? 0) < 3 ? " — needs 3" : ""})
                    </option>
                  ))}
                </select>
                {selectedGroup && (selectedGroup.member_count ?? 0) < 3 && (
                  <p className="mt-1.5 text-xs text-amber-700">
                    Minimum 3 members required (
                    {selectedGroup.member_count ?? 0} currently).
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-navy-400">
              Voting times are set after the candidate list is final.
            </p>
            <Button
              type="submit"
              loading={loading}
              fullWidth
              className="mt-2"
              disabled={
                !form.title.trim() ||
                !form.description.trim() ||
                (form.electionType === "group" &&
                  (!form.groupId || groupTooSmall))
              }
            >
              Create election &amp; add candidates
            </Button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
