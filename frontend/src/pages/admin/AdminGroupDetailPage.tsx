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
  X 
} from
"lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Spinner } from "../../components/shared/Spinner";
import { VoterDetailModal } from "../../components/admin/VoterDetailModal";
import { useVoterSearch } from "../../hooks/useAdminElections";
import { apiClient } from "../../lib/apiClient";
import { useToast } from "../../contexts/ToastContext";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => {return part[0]?.toUpperCase();}).join("") || "G";
}

async function fileToCompressedDataUrl(file, max = 320) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {return resolve(String(reader.result));};
    reader.onerror = () => {return reject(new Error("Could not read the image"));};
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {return resolve(img);};
    img.onerror = () => {return reject(new Error("Unsupported image"));};
    img.src = dataUrl;
  });
  const scale = Math.min(1, max / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) {return dataUrl;}
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function AdminGroupDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const { results, loading: searching, search, clear } = useVoterSearch();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [viewingVoter, setViewingVoter] = useState(null);
  const menuRef = useRef(null);

  const [form, setForm] = useState({ name: "", description: "", photoUrl: null });
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState("");
  const fileRef = useRef(null);

  async function load() {
    if (!id) {return;}
    setLoading(true);
    try {
      const [detail, memberList, requestList] = await Promise.all([
      apiClient.get(`/groups/${id}`),
      apiClient.get(`/groups/${id}/members`),
      apiClient.get(`/groups/${id}/requests`)]
      );
      setGroup(detail.data);
      setMembers(Array.isArray(memberList.data) ? memberList.data : []);
      setRequests(Array.isArray(requestList.data) ? requestList.data : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load group");
    } finally {setLoading(false);}
  }

  useEffect(() => {load();}, [id]);
  useEffect(() => {
    const timer = setTimeout(() => {return search(query);}, 250);
    return () => {return clearTimeout(timer);};
  }, [query, search]);

  useEffect(() => {
    function onClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {setMenuOpen(false);}
    }
    document.addEventListener("mousedown", onClick);
    return () => {return document.removeEventListener("mousedown", onClick);};
  }, []);

  const statusByUser = useMemo(() => {
    const map = new Map();
    for (const request of requests) {
      if (request.status === "pending") {map.set(request.user_id, "pending");} else
      if (request.status === "rejected") {map.set(request.user_id, "rejected");}
    }
    for (const member of members) {map.set(member.id, "member");}
    return map;
  }, [members, requests]);

  function openEdit() {
    if (!group) {return;}
    setForm({ name: group.name ?? "", description: group.description ?? "", photoUrl: group.photo_url ?? null });
    setEditError("");
    setEditOpen(true);
  }

  async function pickPhoto(file) {
    if (!file) {return;}
    if (!file.type.startsWith("image/")) {setEditError("Please choose an image file.");return;}
    try {
      const compressed = await fileToCompressedDataUrl(file);
      setForm((prev) => {return { ...prev, photoUrl: compressed };});
      setEditError("");
    } catch {setEditError("Could not read that image. Try another one.");}
  }

  async function saveEdit() {
    if (!id) {return;}
    const name = form.name.trim();
    const description = form.description.trim();
    if (name.length < 2) {setEditError("Group name must be at least 2 characters.");return;}
    if (!description) {setEditError("Group description is required.");return;}
    setSavingEdit(true);
    try {
      const { data } = await apiClient.put(`/groups/${id}`, { name, description, photoUrl: form.photoUrl });
      setGroup((prev) => {return { ...prev, ...data };});
      show("Group details updated.", "success");
      setEditOpen(false);
    } catch (err) {setEditError(err?.response?.data?.error || "Could not save group details.");} finally
    {setSavingEdit(false);}
  }

  async function invite(user) {
    if (!id) {return;}
    setSaving(user.id);
    try {
      await apiClient.post(`/groups/${id}/requests`, { userId: user.id });
      show(`Invitation sent to ${user.fullName}.`, "success");
      await load();
    } catch (err) {show(err?.response?.data?.error || "Could not send invitation.", "error");} finally
    {setSaving(null);}
  }

  async function deleteGroup() {
    if (!id || !group) {return;}
    if (!window.confirm(`Delete "${group.name}"? Members, invitations and this group will be removed.`)) {return;}
    setDeleting(true);
    try {
      await apiClient.delete(`/groups/${id}`);
      show("Group deleted.", "success");
      navigate("/admin/groups");
    } catch (err) {show(err?.response?.data?.error || "Could not delete group.", "error");} finally
    {setDeleting(false);}
  }

  function startElection() {
    if (!id) {return;}
    if (memberCount < 3) {
      show(`This group has ${memberCount} member${memberCount === 1 ? "" : "s"}. At least 3 are required before starting an election for it.`, "error");
      return;
    }
    navigate("/admin/elections/new", { state: { groupId: id, groupName: group?.name } });
  }

  const pending = requests.filter((r) => {return r.status === "pending";});
  const memberCount = group?.member_count ?? members.length;

  return _jsxDEV(Layout, {
 children: [_jsxDEV("div", {
 className: "mx-auto max-w-3xl", children: [
      loading && !group && _jsxDEV(Spinner, { label: "Loading group" }, void 0, false),
      error && _jsxDEV("p", { className: "rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700", children: error }, void 0, false),

      group && _jsxDEV(_Fragment, {
 children: [

        _jsxDEV("div", {
 className: "relative mb-5 overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-500 px-4 pb-6 pt-4 text-white shadow-lg", children: [
          _jsxDEV("div", {
 className: "flex items-center justify-between", children: [
            _jsxDEV("button", {
 onClick: () => {return navigate("/admin/groups");}, className: "rounded-full p-2 hover:bg-white/15", "aria-label": "Back to groups", children:
              _jsxDEV(ArrowLeft, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
            ),
            _jsxDEV("div", {
 className: "relative", ref: menuRef, children: [
              _jsxDEV("button", {
 onClick: () => {return setMenuOpen((open) => {return !open;});}, className: "rounded-full p-2 hover:bg-white/15", "aria-label": "Group options", "aria-haspopup": "menu", "aria-expanded": menuOpen, children:
                _jsxDEV(MoreVertical, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
              ),
              menuOpen && _jsxDEV("div", {
 role: "menu", className: "absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-navy-100 bg-white text-left shadow-xl dark:border-navy-700 dark:bg-navy-900", children: [
                _jsxDEV("button", {
 role: "menuitem", onClick: () => {setMenuOpen(false);openEdit();}, className: "flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-navy-800 hover:bg-indigo-50 dark:text-white dark:hover:bg-navy-800", children: [
                  _jsxDEV(Pencil, { className: "h-4 w-4 text-indigo-600" }, void 0, false), " Edit group details"] 
}, void 0, true
                ),
                _jsxDEV("button", {
 role: "menuitem", onClick: () => {setMenuOpen(false);setAddOpen(true);}, className: "flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-navy-800 hover:bg-indigo-50 dark:text-white dark:hover:bg-navy-800", children: [
                  _jsxDEV(UserPlus, { className: "h-4 w-4 text-indigo-600" }, void 0, false), " Add members"] 
}, void 0, true
                ),
                _jsxDEV("button", {
 role: "menuitem", onClick: () => {setMenuOpen(false);startElection();}, className: "flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-navy-800 hover:bg-indigo-50 dark:text-white dark:hover:bg-navy-800", children: [
                  _jsxDEV(Vote, { className: "h-4 w-4 text-teal-600" }, void 0, false), " Start election"] 
}, void 0, true
                ),
                _jsxDEV("button", {
 role: "menuitem", disabled: deleting, onClick: () => {setMenuOpen(false);deleteGroup();}, className: "flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-navy-800", children: [
                  _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false), " ", deleting ? "Deleting…" : "Delete group"] 
}, void 0, true
                )] 
}, void 0, true
              )] 
}, void 0, true
            )] 
}, void 0, true
          ),

          _jsxDEV("div", {
 className: "mt-2 flex flex-col items-center text-center", children: [
            _jsxDEV("button", {
 onClick: openEdit, className: "group relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-white/25", "aria-label": "Change group photo", children: [
              group.photo_url ?
              _jsxDEV("img", { src: group.photo_url, alt: `${group.name} photo`, className: "h-full w-full object-cover" }, void 0, false) :
              _jsxDEV("span", { className: "flex h-full w-full items-center justify-center bg-white/20 text-2xl font-extrabold", children: initials(group.name) }, void 0, false),
              _jsxDEV("span", {
 className: "absolute inset-x-0 bottom-0 flex items-center justify-center bg-black/40 py-1 opacity-0 transition group-hover:opacity-100", children:
                _jsxDEV(Camera, { className: "h-3.5 w-3.5" }, void 0, false) 
}, void 0, false
              )] 
}, void 0, true
            ),
            _jsxDEV("h1", { className: "mt-3 text-2xl font-extrabold leading-tight", children: group.name }, void 0, false),
            _jsxDEV("p", { className: "mt-1 text-sm text-white/80", children: group.description }, void 0, false),
            _jsxDEV("p", {
 className: "mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold", children: [
              _jsxDEV(Users, { className: "h-3.5 w-3.5" }, void 0, false), " ", memberCount, " ", memberCount === 1 ? "member" : "members",
              pending.length > 0 && _jsxDEV("span", { className: "ml-1 text-white/80", children: ["· ", pending.length, " pending"] }, void 0, true)] 
}, void 0, true
            ),

            _jsxDEV("div", {
 className: "mt-4 grid w-full grid-cols-2 gap-2 sm:max-w-sm", children: [
              _jsxDEV("button", {
 onClick: () => {return setAddOpen(true);}, className: "flex items-center justify-center gap-1.5 rounded-xl bg-white/15 px-2 py-2.5 text-sm font-bold hover:bg-white/25", children: [
                _jsxDEV(UserPlus, { className: "h-4 w-4" }, void 0, false), " Add"] 
}, void 0, true
              ),
              _jsxDEV("button", {
 onClick: startElection, className: "flex items-center justify-center gap-1.5 rounded-xl bg-white px-2 py-2.5 text-sm font-bold text-indigo-700 hover:bg-white/90", children: [
                _jsxDEV(Vote, { className: "h-4 w-4" }, void 0, false), " Election"] 
}, void 0, true
              )] 
}, void 0, true
            )] 
}, void 0, true

          )] 
}, void 0, true
        ),

        editOpen && _jsxDEV(Card, {
 className: "mb-5 p-5", children: [
          _jsxDEV("div", {
 className: "mb-4 flex items-start justify-between gap-3", children: [
            _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
              _jsxDEV(Pencil, { className: "h-5 w-5 text-indigo-600" }, void 0, false),
              _jsxDEV("div", {
 children: [
                _jsxDEV("h2", { className: "font-bold text-navy-900 dark:text-white", children: "Edit group details" }, void 0, false),
                _jsxDEV("p", { className: "text-xs text-navy-500", children: "Update the group name, description and photo." }, void 0, false)] 
}, void 0, true
              )] 
}, void 0, true
            ),
            _jsxDEV("button", { onClick: () => {return setEditOpen(false);}, className: "rounded-lg p-2 text-navy-400 hover:bg-navy-50", "aria-label": "Close edit group", children: _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) }, void 0, false)] 
}, void 0, true
          ),

          _jsxDEV("div", {
 className: "flex flex-col gap-4 sm:flex-row sm:items-start", children: [
            _jsxDEV("div", {
 className: "flex flex-col items-center gap-2", children: [
              _jsxDEV("div", {
 className: "h-24 w-24 overflow-hidden rounded-full border border-navy-200 bg-navy-50", children:
                form.photoUrl ?
                _jsxDEV("img", { src: form.photoUrl, alt: "Group photo preview", className: "h-full w-full object-cover" }, void 0, false) :
                _jsxDEV("span", { className: "flex h-full w-full items-center justify-center text-xl font-extrabold text-navy-400", children: initials(form.name || group.name) }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("input", { ref: fileRef, type: "file", accept: "image/*", className: "hidden", onChange: (e) => {return pickPhoto(e.target.files?.[0]);} }, void 0, false),
              _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                _jsxDEV("button", {
 type: "button", onClick: () => {return fileRef.current?.click();}, className: "rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100", children:
                  form.photoUrl ? "Change photo" : "Upload photo" 
}, void 0, false
                ),
                form.photoUrl && _jsxDEV("button", { type: "button", onClick: () => {return setForm((prev) => {return { ...prev, photoUrl: null };});}, className: "rounded-lg px-2 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50", children: "Remove" }, void 0, false)] 
}, void 0, true
              )] 
}, void 0, true
            ),

            _jsxDEV("div", {
 className: "flex-1 space-y-3", children: [
              _jsxDEV("label", {
 className: "block", children: [
                _jsxDEV("span", { className: "mb-1 block text-xs font-bold uppercase tracking-wide text-navy-500", children: "Group name" }, void 0, false),
                _jsxDEV("input", {
 value: form.name, onChange: (e) => {return setForm((prev) => {return { ...prev, name: e.target.value };});}, maxLength: 120,
                  className: "focus-ring w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm shadow-sm", placeholder: "e.g. Ward 12 Residents" 
}, void 0, false)] 
}, void 0, true
              ),
              _jsxDEV("label", {
 className: "block", children: [
                _jsxDEV("span", { className: "mb-1 block text-xs font-bold uppercase tracking-wide text-navy-500", children: "Description" }, void 0, false),
                _jsxDEV("textarea", {
 value: form.description, onChange: (e) => {return setForm((prev) => {return { ...prev, description: e.target.value };});}, rows: 3, maxLength: 500,
                  className: "focus-ring w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm shadow-sm", placeholder: "What is this group for?" 
}, void 0, false),
                _jsxDEV("span", { className: "mt-1 block text-right text-[11px] text-navy-400", children: [form.description.length, "/500"] }, void 0, true)] 
}, void 0, true
              ),
              editError && _jsxDEV("p", { className: "rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700", children: editError }, void 0, false),
              _jsxDEV("div", {
 className: "flex gap-2", children: [
                _jsxDEV("button", {
 onClick: saveEdit, disabled: savingEdit, className: "rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-50", children:
                  savingEdit ? "Saving…" : "Save changes" 
}, void 0, false
                ),
                _jsxDEV("button", { onClick: () => {return setEditOpen(false);}, className: "rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-bold text-navy-600 hover:bg-navy-50", children: "Cancel" }, void 0, false)] 
}, void 0, true
              )] 
}, void 0, true
            )] 
}, void 0, true
          )] 
}, void 0, true
        ),

        addOpen && _jsxDEV(Card, {
 className: "mb-5 p-5", children: [
          _jsxDEV("div", {
 className: "mb-4 flex items-start justify-between gap-3", children: [
            _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
              _jsxDEV(UserPlus, { className: "h-5 w-5 text-indigo-600" }, void 0, false),
              _jsxDEV("div", {
 children: [
                _jsxDEV("h2", { className: "font-bold text-navy-900 dark:text-white", children: "Add members" }, void 0, false),
                _jsxDEV("p", { className: "text-xs text-navy-500", children: "Search a verified voter. People already in the group or already invited are marked." }, void 0, false)] 
}, void 0, true
              )] 
}, void 0, true
            ),
            _jsxDEV("button", { onClick: () => {setAddOpen(false);setQuery("");clear();}, className: "rounded-lg p-2 text-navy-400 hover:bg-navy-50", "aria-label": "Close add members", children: _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) }, void 0, false)] 
}, void 0, true
          ),
          _jsxDEV("div", {
 className: "relative", children: [
            _jsxDEV(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" }, void 0, false),
            _jsxDEV("input", { autoFocus: true, value: query, onChange: (e) => {return setQuery(e.target.value);}, placeholder: "Search by name or voter ID", className: "focus-ring w-full rounded-xl border border-navy-200 bg-white py-3 pl-10 pr-10 text-sm shadow-sm" }, void 0, false),
            query && _jsxDEV("button", { onClick: () => {setQuery("");clear();}, className: "absolute right-3 top-1/2 -translate-y-1/2 text-navy-400", children: _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) }, void 0, false)] 
}, void 0, true
          ),
          (searching || results.length > 0) && query.length >= 2 && _jsxDEV("div", {
 className: "mt-2 divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white shadow-lg dark:divide-navy-800 dark:border-navy-700 dark:bg-navy-900", children: [
            searching ? _jsxDEV("p", { className: "p-3 text-sm text-navy-400", children: "Searching voters…" }, void 0, false) : results.map((user) => {
              const state = statusByUser.get(user.id);
              const isMember = state === "member";
              const isPending = state === "pending";
              const blocked = isMember || isPending;
              return _jsxDEV("div", {
 className: `flex w-full items-center justify-between gap-3 p-3 text-left ${blocked ? "bg-navy-50/60 dark:bg-navy-800/40" : ""}`, children: [
                _jsxDEV("button", {
                  type: "button",
                  onClick: () => {return setViewingVoter(user);},
                  className: "flex min-w-0 items-center gap-2.5 text-left",
                  "aria-label": `View details for ${user.fullName}`,
                  title: "View profile", children: [

                  _jsxDEV("span", {
 className: "flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-100 text-xs font-bold text-navy-600 transition hover:ring-2 hover:ring-gold-400 dark:bg-navy-800 dark:text-navy-300", children:
                    user.photoUrl ? _jsxDEV("img", { src: user.photoUrl, alt: user.fullName, className: "h-full w-full object-cover" }, void 0, false) : initials(user.fullName) 
}, void 0, false
                  ),
                  _jsxDEV("span", {
 className: "min-w-0", children: [
                    _jsxDEV("span", { className: "block truncate text-sm font-semibold text-navy-900 dark:text-white", children: user.fullName }, void 0, false),
                    _jsxDEV("span", { className: "text-xs text-navy-400", children: [user.voterId, " · ", user.walletLinked ? "Wallet linked" : "No wallet linked"] }, void 0, true)] 
}, void 0, true
                  )] 
}, void 0, true
                ),
                isMember ?
                _jsxDEV("span", { className: "inline-flex shrink-0 items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-bold text-teal-700", children: [_jsxDEV(UserCheck, { className: "h-3 w-3" }, void 0, false), " Already a member"] }, void 0, true) :
                isPending ?
                _jsxDEV("span", { className: "inline-flex shrink-0 items-center gap-1 rounded-full bg-gold-50 px-2.5 py-1 text-[11px] font-bold text-gold-700", children: [_jsxDEV(Clock3, { className: "h-3 w-3" }, void 0, false), " Invitation sent"] }, void 0, true) :
                _jsxDEV("button", {
 disabled: saving === user.id, onClick: () => {return invite(user);}, className: "shrink-0 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 disabled:opacity-50", children:
                  saving === user.id ? "Sending…" : state === "rejected" ? "Invite again" : "Invite" 
}, void 0, false
                )] 
}, user.id, true
              );
            }),
            !searching && results.length === 0 && _jsxDEV("p", { className: "p-3 text-sm text-navy-400", children: "No verified voters matched that search." }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true
        ),

        _jsxDEV(Card, {
 className: "mb-5 p-0 overflow-hidden", children:
          _jsxDEV("button", {
            onClick: () => {return navigate(`/admin/groups/${id}/members`);},
            className: "flex w-full items-center justify-between gap-3 p-5 text-left hover:bg-indigo-50/60 dark:hover:bg-navy-800", children: [

            _jsxDEV("span", {
 className: "flex items-center gap-3", children: [
              _jsxDEV("span", {
 className: "flex h-11 w-11 items-center justify-center rounded-full bg-indigo-100 text-indigo-700", children:
                _jsxDEV(Users, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("span", {
 children: [
                _jsxDEV("span", { className: "block font-bold text-navy-900 dark:text-white", children: "Manage members" }, void 0, false),
                _jsxDEV("span", { className: "block text-xs text-navy-500", children: "Search members, view details, remove members and see the full activity history." }, void 0, false

                )] 
}, void 0, true
              )] 
}, void 0, true
            ),
            _jsxDEV("span", {
 className: "flex shrink-0 items-center gap-2", children: [
              _jsxDEV("span", { className: "rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700", children: memberCount }, void 0, false),
              pending.length > 0 && _jsxDEV("span", { className: "rounded-full bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-700", children: [pending.length, " pending"] }, void 0, true),
              _jsxDEV(ChevronRight, { className: "h-5 w-5 text-navy-400" }, void 0, false)] 
}, void 0, true
            )] 
}, void 0, true
          ) 
}, void 0, false
        )] 
}, void 0, true

      )] 
}, void 0, true
    ),
    viewingVoter &&
    _jsxDEV(VoterDetailModal, {
      voter: viewingVoter,
      onClose: () => {return setViewingVoter(null);},
      alreadyAdded: statusByUser.get(viewingVoter.id) === "member" || statusByUser.get(viewingVoter.id) === "pending",
      onAdd:
      statusByUser.get(viewingVoter.id) === "member" || statusByUser.get(viewingVoter.id) === "pending" ?
      undefined :
      () => {invite(viewingVoter);setViewingVoter(null);} 
}, void 0, false

    )] 
}, void 0, true

  );
}