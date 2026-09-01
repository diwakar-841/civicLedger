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
  X 
} from
"lucide-react";
import { Layout } from "../../components/layout/Layout";
import { Card } from "../../components/shared/Card";
import { Spinner } from "../../components/shared/Spinner";
import { apiClient } from "../../lib/apiClient";
import { useToast } from "../../contexts/ToastContext";
import { AdminAuthModal } from "../../components/auth/AdminAuthModal";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => {return part[0]?.toUpperCase();}).join("") || "?";
}

function formatDateTime(value) {
  if (!value) {return "—";}
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {return "—";}
  return date.toLocaleString(undefined, { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

const ACTIVITY_STYLES = {
  invitation_sent: { label: "Invitation sent", icon: UserPlus, tone: "bg-indigo-50 text-indigo-700" },
  invitation_accepted: { label: "Invitation accepted", icon: Check, tone: "bg-emerald-50 text-emerald-700" },
  invitation_rejected: { label: "Invitation rejected", icon: X, tone: "bg-red-50 text-red-700" },
  member_removed: { label: "Member removed", icon: UserMinus, tone: "bg-red-50 text-red-700" },
  election_created: { label: "Election created", icon: Vote, tone: "bg-teal-50 text-teal-700" },
  group_created: { label: "Group created", icon: Users, tone: "bg-indigo-50 text-indigo-700" },
  group_updated: { label: "Group updated", icon: ShieldCheck, tone: "bg-gold-50 text-gold-700" },
  group_deleted: { label: "Group deleted", icon: Trash2, tone: "bg-red-50 text-red-700" }
};

function activityStyle(type) {
  return ACTIVITY_STYLES[type] ?? { label: type.replace(/_/g, " "), icon: History, tone: "bg-navy-100 text-navy-600" };
}

export function AdminGroupMembersPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();

  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [confirmName, setConfirmName] = useState("");
  const [reason, setReason] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [showRemoveAuth, setShowRemoveAuth] = useState(false);
  const [historyFilter, setHistoryFilter] = useState("all");

  async function load() {
    if (!id) {return;}
    setLoading(true);
    try {
      const [detail, memberList, activityList] = await Promise.all([
      apiClient.get(`/groups/${id}`),
      apiClient.get(`/groups/${id}/members`),
      apiClient.get(`/groups/${id}/activity`)]
      );
      setGroup(detail.data);
      setMembers(Array.isArray(memberList.data) ? memberList.data : []);
      setActivity(Array.isArray(activityList.data) ? activityList.data : []);
    } catch (err) {
      setError(err?.response?.data?.error || "Could not load group members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {load();}, [id]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) {return members;}
    return members.filter((member) =>
    {return member.full_name.toLowerCase().includes(term) ||
      member.email.toLowerCase().includes(term) ||
      (member.phone ?? "").toLowerCase().includes(term);}
    );
  }, [members, query]);

  const visibleActivity = useMemo(() => {
    if (historyFilter === "all") {return activity;}
    if (historyFilter === "elections") {return activity.filter((item) => {return item.type === "election_created";});}
    return activity.filter((item) => {return item.type.startsWith("invitation") || item.type === "member_removed";});
  }, [activity, historyFilter]);

  function openRemove(member) {
    setRemoveTarget(member);
    setConfirmName("");
    setReason("");
    setRemoveError("");
    setShowRemoveAuth(false);
  }

  function proceedToAuth() {
    if (!removeTarget) {return;}
    if (confirmName.trim().toLowerCase() !== removeTarget.full_name.trim().toLowerCase()) {
      setRemoveError("Type the member's full name exactly as shown to confirm.");
      return;
    }
    if (reason.trim().length < 3) {
      setRemoveError("Please give a short reason for the removal.");
      return;
    }
    setRemoveError("");
    setShowRemoveAuth(true);
  }

  async function performRemoval() {
    if (!id || !removeTarget) {return;}
    try {
      await apiClient.delete(`/groups/${id}/members/${removeTarget.id}`, { data: { confirmName: confirmName.trim(), reason: reason.trim() } });
      show(`${removeTarget.full_name} was removed from the group.`, "success");
      setRemoveTarget(null);
      setSelected(null);
      await load();
    } catch (err) {
      throw new Error(err?.response?.data?.error || err?.response?.data?.message || "Could not remove this member.");
    }
  }

  return _jsxDEV(Layout, {
 children: _jsxDEV("div", {
 className: "mx-auto max-w-3xl pb-10", children: [
      _jsxDEV("div", {
 className: "mb-5 flex items-center gap-3", children: [
        _jsxDEV("button", {
 onClick: () => {return navigate(`/admin/groups/${id}`);}, className: "rounded-full border border-navy-200 p-2 text-navy-600 hover:bg-navy-50 dark:border-navy-700 dark:text-white", "aria-label": "Back to group", children:
          _jsxDEV(ArrowLeft, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
        ),
        _jsxDEV("div", {
 className: "min-w-0", children: [
          _jsxDEV("h1", { className: "truncate text-xl font-extrabold text-navy-900 dark:text-white", children: "Manage members" }, void 0, false),
          _jsxDEV("p", { className: "truncate text-xs text-navy-500", children: [group?.name ?? "Group", " · ", members.length, " ", members.length === 1 ? "member" : "members"] }, void 0, true)] 
}, void 0, true
        )] 
}, void 0, true
      ),

      loading && !group && _jsxDEV(Spinner, { label: "Loading members" }, void 0, false),
      error && _jsxDEV("p", { className: "mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700", children: error }, void 0, false),

      _jsxDEV(Card, {
 className: "mb-5 p-5", children: [
        _jsxDEV("div", {
 className: "relative mb-4", children: [
          _jsxDEV(Search, { className: "pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" }, void 0, false),
          _jsxDEV("input", {
            value: query,
            onChange: (event) => {return setQuery(event.target.value);},
            placeholder: "Search members by name, email or phone",
            className: "focus-ring w-full rounded-xl border border-navy-200 bg-white py-3 pl-10 pr-10 text-sm shadow-sm dark:border-navy-700 dark:bg-navy-900" 
}, void 0, false
          ),
          query && _jsxDEV("button", { onClick: () => {return setQuery("");}, className: "absolute right-3 top-1/2 -translate-y-1/2 text-navy-400", "aria-label": "Clear search", children: _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) }, void 0, false)] 
}, void 0, true
        ),

        filtered.length === 0 ?
        _jsxDEV("p", {
 className: "py-6 text-center text-sm text-navy-500", children:
          members.length === 0 ? "No members yet. Invite verified voters from the group page." : "No member matched that search." 
}, void 0, false
        ) :

        _jsxDEV("ul", {
 className: "divide-y divide-navy-100 dark:divide-navy-800", children:
          filtered.map((member) => {return (
              _jsxDEV("li", {
 children: [
                _jsxDEV("div", {
 className: "flex items-center justify-between gap-3 py-3", children: [
                  _jsxDEV("button", {
 onClick: () => {return setSelected(selected?.id === member.id ? null : member);}, className: "flex min-w-0 flex-1 items-center gap-3 text-left", children: [
                    member.profile_photo_url ?
                    _jsxDEV("img", { src: member.profile_photo_url, alt: "", className: "h-10 w-10 shrink-0 rounded-full object-cover" }, void 0, false) :
                    _jsxDEV("span", { className: "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700", children: initials(member.full_name) }, void 0, false),
                    _jsxDEV("span", {
 className: "min-w-0", children: [
                      _jsxDEV("span", { className: "block truncate text-sm font-semibold text-navy-900 dark:text-white", children: member.full_name }, void 0, false),
                      _jsxDEV("span", { className: "flex items-center gap-1 truncate text-xs text-navy-400", children: [_jsxDEV(Mail, { className: "h-3 w-3" }, void 0, false), member.email] }, void 0, true)] 
}, void 0, true
                    )] 
}, void 0, true
                  ),
                  _jsxDEV("button", {
 onClick: () => {return openRemove(member);}, className: "rounded-lg p-2 text-navy-400 hover:bg-red-50 hover:text-red-600", "aria-label": `Remove ${member.full_name}`, children:
                    _jsxDEV(Trash2, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
                  )] 
}, void 0, true
                ),

                selected?.id === member.id &&
                _jsxDEV("div", {
 className: "mb-3 rounded-xl bg-navy-50 p-4 text-sm dark:bg-navy-800/60", children: [
                  _jsxDEV("p", { className: "mb-2 text-xs font-bold uppercase tracking-wide text-navy-500", children: "Member details" }, void 0, false),
                  _jsxDEV("dl", {
 className: "grid gap-2 sm:grid-cols-2", children: [
                    _jsxDEV("div", { children: [_jsxDEV("dt", { className: "text-xs text-navy-400", children: "Full name" }, void 0, false), _jsxDEV("dd", { className: "font-semibold text-navy-900 dark:text-white", children: member.full_name }, void 0, false)] }, void 0, true),
                    _jsxDEV("div", { children: [_jsxDEV("dt", { className: "text-xs text-navy-400", children: "Email" }, void 0, false), _jsxDEV("dd", { className: "break-all text-navy-700 dark:text-navy-100", children: member.email }, void 0, false)] }, void 0, true),
                    _jsxDEV("div", { children: [_jsxDEV("dt", { className: "text-xs text-navy-400", children: "Phone" }, void 0, false), _jsxDEV("dd", { className: "flex items-center gap-1 text-navy-700 dark:text-navy-100", children: [_jsxDEV(Phone, { className: "h-3 w-3" }, void 0, false), member.phone || "Not provided"] }, void 0, true)] }, void 0, true),
                    _jsxDEV("div", { children: [_jsxDEV("dt", { className: "text-xs text-navy-400", children: "Verification" }, void 0, false), _jsxDEV("dd", { className: "flex items-center gap-1 text-navy-700 dark:text-navy-100", children: [_jsxDEV(ShieldCheck, { className: "h-3 w-3" }, void 0, false), member.is_verified ? "Verified voter" : "Not verified"] }, void 0, true)] }, void 0, true),
                    _jsxDEV("div", { children: [_jsxDEV("dt", { className: "text-xs text-navy-400", children: "Joined group" }, void 0, false), _jsxDEV("dd", { className: "flex items-center gap-1 text-navy-700 dark:text-navy-100", children: [_jsxDEV(Calendar, { className: "h-3 w-3" }, void 0, false), formatDateTime(member.joined_at)] }, void 0, true)] }, void 0, true),
                    _jsxDEV("div", { children: [_jsxDEV("dt", { className: "text-xs text-navy-400", children: "Last login" }, void 0, false), _jsxDEV("dd", { className: "text-navy-700 dark:text-navy-100", children: formatDateTime(member.last_login_at) }, void 0, false)] }, void 0, true)] 
}, void 0, true
                  ),
                  _jsxDEV("button", {
 onClick: () => {return openRemove(member);}, className: "mt-3 inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100", children: [
                    _jsxDEV(UserMinus, { className: "h-3.5 w-3.5" }, void 0, false), " Remove from group"] 
}, void 0, true
                  )] 
}, void 0, true
                )] 
}, member.id, true

              ));
          }) 
}, void 0, false
        )] 
}, void 0, true

      ),

      _jsxDEV(Card, {
 className: "p-5", children: [
        _jsxDEV("div", {
 className: "mb-4 flex flex-wrap items-center justify-between gap-3", children: [
          _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
            _jsxDEV(History, { className: "h-5 w-5 text-indigo-600" }, void 0, false),
            _jsxDEV("div", {
 children: [
              _jsxDEV("h2", { className: "font-bold text-navy-900 dark:text-white", children: "History" }, void 0, false),
              _jsxDEV("p", { className: "text-xs text-navy-500", children: "Member and election activity for this group." }, void 0, false)] 
}, void 0, true
            )] 
}, void 0, true
          ),
          _jsxDEV("div", {
 className: "flex gap-1 rounded-xl bg-navy-50 p-1 dark:bg-navy-800", children:
            ["all", "members", "elections"].map((key) => {return (
                _jsxDEV("button", {

                  onClick: () => {return setHistoryFilter(key);},
                  className: `rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${historyFilter === key ? "bg-white text-indigo-700 shadow-sm dark:bg-navy-900" : "text-navy-500"}`, children:

                  key 
}, key, false
                ));
            }) 
}, void 0, false
          )] 
}, void 0, true
        ),

        visibleActivity.length === 0 ?
        _jsxDEV("p", { className: "py-6 text-center text-sm text-navy-500", children: "No activity recorded yet." }, void 0, false) :

        _jsxDEV("ol", {
 className: "relative space-y-4 border-l border-navy-100 pl-5 dark:border-navy-800", children:
          visibleActivity.map((item) => {
            const style = activityStyle(item.type);
            const Icon = style.icon;
            return (
              _jsxDEV("li", {
 className: "relative", children: [
                _jsxDEV("span", {
 className: `absolute -left-[30px] flex h-6 w-6 items-center justify-center rounded-full ${style.tone}`, children:
                  _jsxDEV(Icon, { className: "h-3.5 w-3.5" }, void 0, false) 
}, void 0, false
                ),
                _jsxDEV("div", {
 className: "rounded-xl border border-navy-100 bg-white p-3 shadow-sm dark:border-navy-800 dark:bg-navy-900", children: [
                  _jsxDEV("div", {
 className: "flex flex-wrap items-center justify-between gap-2", children: [
                    _jsxDEV("span", { className: `rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${style.tone}`, children: style.label }, void 0, false),
                    _jsxDEV("span", { className: "flex items-center gap-1 text-[11px] text-navy-400", children: [_jsxDEV(Clock3, { className: "h-3 w-3" }, void 0, false), formatDateTime(item.created_at)] }, void 0, true)] 
}, void 0, true
                  ),
                  item.target_name &&
                  _jsxDEV("p", {
 className: "mt-2 text-sm font-semibold text-navy-900 dark:text-white", children: [
                    item.target_name,
                    item.target_email && _jsxDEV("span", { className: "ml-1 text-xs font-normal text-navy-400", children: item.target_email }, void 0, false)] 
}, void 0, true
                  ),

                  item.detail && _jsxDEV("p", { className: "mt-1 text-xs text-navy-600 dark:text-navy-300", children: item.detail }, void 0, false),
                  _jsxDEV("p", { className: "mt-1 text-[11px] text-navy-400", children: ["By ", item.actor_name || "System"] }, void 0, true)] 
}, void 0, true
                )] 
}, item.id, true
              ));

          }) 
}, void 0, false
        )] 
}, void 0, true

      ),

      removeTarget && !showRemoveAuth &&
      _jsxDEV("div", {
 className: "fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-4 sm:items-center", role: "dialog", "aria-modal": "true", children:
        _jsxDEV("div", {
 className: "max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl dark:bg-navy-900", children: [
          _jsxDEV("div", {
 className: "mb-3 flex items-start justify-between gap-3", children: [
            _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
              _jsxDEV("span", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600", children: _jsxDEV(UserMinus, { className: "h-4 w-4" }, void 0, false) }, void 0, false),
              _jsxDEV("div", {
 children: [
                _jsxDEV("h3", { className: "font-bold text-navy-900 dark:text-white", children: "Remove member" }, void 0, false),
                _jsxDEV("p", { className: "text-xs text-navy-500", children: "This action is recorded in the group history." }, void 0, false)] 
}, void 0, true
              )] 
}, void 0, true
            ),
            _jsxDEV("button", { onClick: () => {return setRemoveTarget(null);}, className: "rounded-lg p-2 text-navy-400 hover:bg-navy-50", "aria-label": "Cancel removal", children: _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) }, void 0, false)] 
}, void 0, true
          ),

          _jsxDEV("p", {
 className: "mb-3 rounded-xl bg-navy-50 px-3 py-2 text-sm text-navy-700 dark:bg-navy-800 dark:text-navy-100", children: ["You are about to remove ",
            _jsxDEV("strong", { children: removeTarget.full_name }, void 0, false), " (", removeTarget.email, ") from ", group?.name, "."] 
}, void 0, true
          ),

          _jsxDEV("label", {
 className: "mb-3 block", children: [
            _jsxDEV("span", { className: "mb-1 block text-xs font-bold uppercase tracking-wide text-navy-500", children: ["Type “", removeTarget.full_name, "” to confirm"] }, void 0, true),
            _jsxDEV("input", { value: confirmName, onChange: (event) => {return setConfirmName(event.target.value);}, className: "focus-ring w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm dark:border-navy-700 dark:bg-navy-900", placeholder: "Member full name" }, void 0, false)] 
}, void 0, true
          ),

          _jsxDEV("label", {
 className: "mb-3 block", children: [
            _jsxDEV("span", { className: "mb-1 block text-xs font-bold uppercase tracking-wide text-navy-500", children: "Reason for removal" }, void 0, false),
            _jsxDEV("textarea", { value: reason, onChange: (event) => {return setReason(event.target.value);}, rows: 2, maxLength: 200, className: "focus-ring w-full rounded-xl border border-navy-200 bg-white px-3 py-2.5 text-sm dark:border-navy-700 dark:bg-navy-900", placeholder: "e.g. Moved out of the ward" }, void 0, false)] 
}, void 0, true
          ),

          removeError && _jsxDEV("p", { className: "mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700", children: removeError }, void 0, false),

          _jsxDEV("div", {
 className: "flex gap-2", children: [
            _jsxDEV("button", { onClick: proceedToAuth, className: "flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50", children: "Remove member" }, void 0, false

            ),
            _jsxDEV("button", { onClick: () => {return setRemoveTarget(null);}, className: "rounded-xl border border-navy-200 px-4 py-2.5 text-sm font-bold text-navy-600 hover:bg-navy-50 dark:border-navy-700 dark:text-white", children: "Cancel" }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true
        ) 
}, void 0, false
      ),

      _jsxDEV(AdminAuthModal, {
        open: !!removeTarget && showRemoveAuth,
        title: "Confirm member removal",
        description: removeTarget ? `Verify it's you to remove ${removeTarget.full_name} from ${group?.name ?? "this group"}.` : undefined,
        onConfirm: performRemoval,
        onClose: () => {return setShowRemoveAuth(false);} 
}, void 0, false
      )] 
}, void 0, true
    ) 
}, void 0, false);
}