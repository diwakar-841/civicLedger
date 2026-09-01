import { useState, FormEvent, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Layout } from "../../components/layout/Layout";
import { Button } from "../../components/shared/Button";
import { TextField, TextAreaField } from "../../components/shared/Input";
import { useCreateElection } from "../../hooks/useAdminElections";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";
import { apiClient } from "../../lib/apiClient";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function CreateElectionPage() {
  const location = useLocation();
  const preset = location.state ?? null;
  const [form, setForm] = useState({
    title: "",
    description: "",
    electionType: preset?.groupId ? "group" : "public",
    groupId: preset?.groupId ?? ""
  });
  const [groups, setGroups] = useState([]);
  useEffect(() => {apiClient.get("/groups").then(({ data }) => {return setGroups(data);}).catch(() => {});}, []);
  const { createElection, loading } = useCreateElection();
  const { show } = useToast();
  const navigate = useNavigate();
  const selectedGroup = form.electionType === "group" ? groups.find((g) => {return g.id === form.groupId;}) : undefined;
  const groupTooSmall = form.electionType === "group" && Boolean(selectedGroup) && (selectedGroup.member_count ?? 0) < 3;

  function update(key, value) {
    setForm((prev) => {return { ...prev, [key]: value };});
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const election = await createElection({
        title: form.title,
        description: form.description,
        electionType: form.electionType,
        groupId: form.electionType === "group" ? form.groupId : undefined
      });
      show("Election created. Add at least 2 candidates.", "success");
      navigate(`/admin/elections/${election.id}/candidates`);
    } catch (err) {
      show(formatError(err, "Could not create election"), "error");
    }
  }

  return (
    _jsxDEV(Layout, {
 children:
      _jsxDEV("div", {
 className: "mx-auto max-w-xl", children: [
        _jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Election setup" }, void 0, false),
        _jsxDEV("h1", { className: "mb-2 mt-1 text-3xl font-extrabold text-navy-900", children: "Create an election" }, void 0, false),
        _jsxDEV("p", { className: "mb-7 text-sm text-navy-500", children: "Candidates are added in the next step." }, void 0, false),
        _jsxDEV("div", {
 className: "px-1 sm:px-2", children:
          _jsxDEV("form", {
 onSubmit: handleSubmit, className: "flex flex-col gap-4", children: [
            _jsxDEV(TextField, { label: "Title", required: true, value: form.title, onChange: (e) => {return update("title", e.target.value);} }, void 0, false),
            _jsxDEV(TextAreaField, {
              label: "Description",
              rows: 3,
              required: true,
              value: form.description,
              onChange: (e) => {return update("description", e.target.value);} 
}, void 0, false
            ),
            _jsxDEV("div", {
 children: [
              _jsxDEV("label", { className: "mb-1 block text-sm font-medium text-navy-700", children: "Election access" }, void 0, false),
              _jsxDEV("select", {
 className: "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm", value: form.electionType, onChange: (e) => {return setForm({ ...form, electionType: e.target.value, groupId: "" });}, children: [
                _jsxDEV("option", { value: "public", children: "Public Election" }, void 0, false), _jsxDEV("option", { value: "group", children: "Group Election" }, void 0, false)] 
}, void 0, true
              )] 
}, void 0, true
            ),
            form.electionType === "group" && _jsxDEV("div", {
 children: [
              _jsxDEV("label", { className: "mb-1 block text-sm font-medium text-navy-700", children: "Group" }, void 0, false),
              _jsxDEV("select", {
 required: true, className: "w-full rounded-lg border border-navy-200 bg-white px-3 py-2.5 text-sm", value: form.groupId, onChange: (e) => {return setForm({ ...form, groupId: e.target.value });}, children: [
                _jsxDEV("option", { value: "", children: "Select a group" }, void 0, false),
                groups.map((g) => {return (
                    _jsxDEV("option", {
 value: g.id, disabled: (g.member_count ?? 0) < 3, children: [
                      g.name, " (", g.member_count ?? 0, " member", (g.member_count ?? 0) === 1 ? "" : "s", (g.member_count ?? 0) < 3 ? " — needs 3" : "", ")"] 
}, g.id, true
                    ));
                })] 
}, void 0, true
              ),
              selectedGroup && (selectedGroup.member_count ?? 0) < 3 &&
              _jsxDEV("p", {
 className: "mt-1.5 text-xs text-amber-700", children: ["Minimum 3 members required (",
                selectedGroup.member_count ?? 0, " currently)."] 
}, void 0, true
              )] 
}, void 0, true

            ),
            _jsxDEV("p", { className: "text-xs text-navy-400", children: "Voting times are set after the candidate list is final." }, void 0, false

            ),
            _jsxDEV(Button, { type: "submit", loading: loading, fullWidth: true, className: "mt-2", disabled: !form.title.trim() || !form.description.trim() || form.electionType === "group" && (!form.groupId || groupTooSmall), children: "Create election & add candidates" }, void 0, false

            )] 
}, void 0, true
          ) 
}, void 0, false
        )] 
}, void 0, true
      ) 
}, void 0, false
    ));

}