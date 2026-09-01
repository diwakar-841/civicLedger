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
import { useVoterSearch } from "../../hooks/useAdminElections";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function CreateGroupPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [voterQuery, setVoterQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selected, setSelected] = useState([]);
  const [viewingVoter, setViewingVoter] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const { show } = useToast();
  const { results: voterResults, loading: searching, search, clear } = useVoterSearch();

  useEffect(() => {
    function onOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {setShowDropdown(false);}
    }
    document.addEventListener("mousedown", onOutside);
    return () => {return document.removeEventListener("mousedown", onOutside);};
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
    return () => {return clearTimeout(timer);};
  }, [voterQuery, search, clear]);

  function addVoter(voter) {
    if (selected.some((v) => {return v.id === voter.id;})) {return;}
    setSelected((prev) => {return [...prev, voter];});
    setVoterQuery("");
    clear();
    setShowDropdown(false);
  }

  function removeVoter(id) {
    setSelected((prev) => {return prev.filter((v) => {return v.id !== id;});});
  }

  function submit(e) {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {return;}
    setConfirm(true);
  }

  async function create() {
    setLoading(true);
    try {
      await apiClient.post("/groups", { name: title, description, userIds: selected.map((u) => {return u.id;}) });
      show("Group created and invitations sent.", "success");
      navigate("/groups");
    } catch (e) {
      show(e?.response?.data?.error || "Could not create group", "error");
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  function initialsOf(name) {
    return name.split(" ").filter(Boolean).slice(0, 2).map((n) => {return n[0];}).join("");
  }

  return (
    _jsxDEV(Layout, {
 children: [
      _jsxDEV("div", {
 className: "mx-auto max-w-xl", children: [
        _jsxDEV("p", { className: "eyebrow text-indigo-600", children: "Workspace setup" }, void 0, false),
        _jsxDEV("h1", { className: "mb-2 mt-1 text-3xl font-extrabold text-navy-900 dark:text-white", children: "Create a group" }, void 0, false),
        _jsxDEV("p", { className: "mb-7 text-sm text-navy-500", children: "Bring voters together and invite them to private elections." }, void 0, false),
        _jsxDEV("div", {
 className: "px-1 sm:px-2", children:
          _jsxDEV("form", {
 onSubmit: submit, className: "flex flex-col gap-4", children: [
            _jsxDEV(TextField, { label: "Title", required: true, value: title, onChange: (e) => {return setTitle(e.target.value);}, maxLength: 120 }, void 0, false),
            _jsxDEV(TextAreaField, { label: "Description", required: true, rows: 3, value: description, onChange: (e) => {return setDescription(e.target.value);}, maxLength: 500 }, void 0, false),

            _jsxDEV("div", {
 ref: searchRef, className: "relative", children: [
              _jsxDEV("label", { className: "mb-1.5 block text-xs font-bold uppercase tracking-wide text-navy-500", children: "Search members to invite" }, void 0, false),
              _jsxDEV("div", {
 className: "relative flex items-center", children: [
                _jsxDEV(Search, { className: "pointer-events-none absolute left-3 h-4 w-4 text-navy-400" }, void 0, false),
                _jsxDEV("input", {
                  type: "text",
                  value: voterQuery,
                  onChange: (e) => {return setVoterQuery(e.target.value);},
                  placeholder: "Search by name or voter ID…",
                  className: "focus-ring w-full rounded-xl border border-navy-200 py-3 pl-9 pr-4 text-sm shadow-sm" 
}, void 0, false
                )] 
}, void 0, true
              ),

              showDropdown &&
              _jsxDEV("div", {
 className: "absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-navy-200 bg-white shadow-lg", children: [
                searching && _jsxDEV("div", { className: "px-4 py-3 text-sm text-navy-400", children: "Searching…" }, void 0, false),
                !searching && voterResults.length === 0 &&
                _jsxDEV("div", { className: "px-4 py-3 text-sm text-navy-400", children: "No verified voters found" }, void 0, false),

                !searching &&
                voterResults.map((v) => {
                  const alreadyAdded = selected.some((s) => {return s.id === v.id;});
                  return (
                    _jsxDEV("div", {

                      className: `flex w-full items-center gap-3 border-b border-navy-100 px-4 py-3 last:border-0 ${
                      alreadyAdded ? "opacity-40" : "hover:bg-navy-50"}`, children: [

                      _jsxDEV("button", {
                        type: "button",
                        onClick: () => {return setViewingVoter(v);},
                        className: "flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-navy-100 text-sm font-bold text-navy-600 transition hover:ring-2 hover:ring-gold-400",
                        "aria-label": `View details for ${v.fullName}`,
                        title: "View details", children:

                        v.photoUrl ? _jsxDEV("img", { src: v.photoUrl, alt: v.fullName, className: "h-full w-full object-cover" }, void 0, false) : initialsOf(v.fullName) 
}, void 0, false
                      ),
                      _jsxDEV("button", {
 type: "button", onClick: () => {return setViewingVoter(v);}, className: "min-w-0 flex-1 text-left", children: [
                        _jsxDEV("p", { className: "truncate text-sm font-medium text-navy-900", children: v.fullName }, void 0, false),
                        _jsxDEV("p", { className: "font-mono text-xs text-navy-500", children: v.voterId }, void 0, false)] 
}, void 0, true
                      ),
                      _jsxDEV("div", {
 className: "flex flex-shrink-0 items-center gap-1.5", children: [
                        v.walletLinked && _jsxDEV(BadgeCheck, { className: "h-4 w-4 text-emerald-500" }, void 0, false),
                        alreadyAdded ?
                        _jsxDEV("span", { className: "text-[10px] font-semibold text-emerald-600", children: "Added" }, void 0, false) :

                        _jsxDEV("button", {
                          type: "button",
                          onClick: () => {return addVoter(v);},
                          className: "rounded-lg bg-gold-100 px-2.5 py-1 text-xs font-semibold text-gold-700 hover:bg-gold-200", children:
                          "Add" 
}, void 0, false

                        )] 
}, void 0, true

                      )] 
}, v.id, true
                    ));

                })] 
}, void 0, true
              )] 
}, void 0, true

            ),

            selected.length > 0 ?
            _jsxDEV("div", {
 className: "flex flex-col gap-2", children: [
              _jsxDEV("p", { className: "text-xs font-semibold uppercase tracking-wide text-navy-400", children: ["Selected (", selected.length, ")"] }, void 0, true),
              selected.map((v) => {return (
                  _jsxDEV("div", {
 className: "flex items-center gap-3 rounded-xl border border-navy-200 bg-white px-3 py-2.5", children: [
                    _jsxDEV("button", {
                      type: "button",
                      onClick: () => {return setViewingVoter(v);},
                      className: "flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gold-100 text-sm font-bold text-gold-700 transition hover:ring-2 hover:ring-gold-400", children:

                      v.photoUrl ? _jsxDEV("img", { src: v.photoUrl, alt: v.fullName, className: "h-full w-full object-cover" }, void 0, false) : initialsOf(v.fullName) 
}, void 0, false
                    ),
                    _jsxDEV("div", {
 className: "min-w-0 flex-1", children: [
                      _jsxDEV("p", { className: "truncate text-sm font-semibold text-navy-900", children: v.fullName }, void 0, false),
                      _jsxDEV("p", { className: "font-mono text-xs text-navy-500", children: v.voterId }, void 0, false)] 
}, void 0, true
                    ),
                    v.walletLinked && _jsxDEV(BadgeCheck, { className: "h-4 w-4 flex-shrink-0 text-emerald-500" }, void 0, false),
                    _jsxDEV("button", {
                      type: "button",
                      onClick: () => {return removeVoter(v.id);},
                      className: "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-red-50 hover:text-red-600",
                      "aria-label": `Remove ${v.fullName}`, children:

                      _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
                    )] 
}, v.id, true
                  ));
              })] 
}, void 0, true
            ) :

            _jsxDEV("div", {
 className: "flex items-center gap-2 rounded-xl border border-dashed border-navy-200 px-4 py-5 text-sm text-navy-400", children: [
              _jsxDEV(UserPlus, { className: "h-5 w-5 flex-shrink-0" }, void 0, false),
              _jsxDEV("span", { children: "No members selected yet — a group can start with none, and you can invite more later." }, void 0, false)] 
}, void 0, true
            ),

            _jsxDEV(Button, { type: "submit", size: "lg", className: "mt-2", disabled: !title.trim() || !description.trim(), children: "Review and create group" }, void 0, false

            )] 
}, void 0, true
          ) 
}, void 0, false
        )] 
}, void 0, true
      ),

      _jsxDEV(AdminAuthModal, {
        open: confirm,
        title: "Confirm group creation",
        description: `Create "${title}" and send ${selected.length} invitation${selected.length === 1 ? "" : "s"}?`,
        onConfirm: create,
        onClose: () => {return setConfirm(false);} 
}, void 0, false
      ),
      viewingVoter &&
      _jsxDEV(VoterDetailModal, {
        voter: viewingVoter,
        onClose: () => {return setViewingVoter(null);},
        alreadyAdded: selected.some((s) => {return s.id === viewingVoter.id;}),
        onAdd: selected.some((s) => {return s.id === viewingVoter.id;}) ? undefined : () => {addVoter(viewingVoter);setViewingVoter(null);} 
}, void 0, false
      )] 
}, void 0, true

    ));

}