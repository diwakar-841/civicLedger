import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Mail, ShieldCheck, Users } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { EmptyState } from "../components/shared/EmptyState";
import { apiClient } from "../lib/apiClient";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => {return p[0]?.toUpperCase();}).join("") || "?";
}

export function GroupDetailPage() {
  const { id } = useParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersRestricted, setMembersRestricted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) {return;}
    setLoading(true);
    setError(null);
    setMembersRestricted(false);
    Promise.allSettled([apiClient.get(`/groups/${id}`), apiClient.get(`/groups/${id}/members`)]).
    then(([groupRes, membersRes]) => {
      if (groupRes.status === "fulfilled") {
        setGroup(groupRes.value.data);
      } else {
        setError(groupRes.reason?.response?.data?.error || "Could not load this group.");
      }
      if (membersRes.status === "fulfilled") {
        setMembers(Array.isArray(membersRes.value.data) ? membersRes.value.data : []);
      } else {

        setMembersRestricted(true);
      }
    }).
    finally(() => {return setLoading(false);});
  }, [id]);

  return (
    _jsxDEV(Layout, {
 children:
      _jsxDEV("div", {
 className: "mx-auto max-w-3xl", children: [
        _jsxDEV(Link, {
 to: "/groups", className: "mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-500 hover:text-indigo-700", children: [
          _jsxDEV(ArrowLeft, { className: "h-4 w-4" }, void 0, false), " Back to your groups"] 
}, void 0, true
        ),

        loading && _jsxDEV(Spinner, { label: "Loading group" }, void 0, false),
        !loading && error && _jsxDEV(EmptyState, { title: "Something went wrong", description: error, icon: _jsxDEV(Users, { className: "h-6 w-6" }, void 0, false) }, void 0, false),

        !loading && !error && group &&
        _jsxDEV(_Fragment, {
 children: [
          _jsxDEV(Card, {
 className: "mb-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center", children: [
            group.photo_url ?
            _jsxDEV("img", { src: group.photo_url, alt: group.name, className: "h-16 w-16 flex-shrink-0 rounded-2xl object-cover" }, void 0, false) :

            _jsxDEV("span", { className: "flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-xl font-extrabold text-white", children: _jsxDEV(Users, { className: "h-7 w-7" }, void 0, false) }, void 0, false),

            _jsxDEV("div", {
 children: [
              _jsxDEV("h1", { className: "text-2xl font-extrabold text-navy-900 dark:text-white", children: group.name }, void 0, false),
              _jsxDEV("p", { className: "mt-1 text-sm text-navy-500", children: group.description }, void 0, false),
              _jsxDEV("p", { className: "mt-2 text-xs font-bold uppercase tracking-wide text-navy-400", children: [group.member_count, " members"] }, void 0, true)] 
}, void 0, true
            )] 
}, void 0, true
          ),

          _jsxDEV("h2", { className: "mb-3 text-lg font-bold text-navy-900 dark:text-white", children: "Members" }, void 0, false),
          membersRestricted &&
          _jsxDEV(EmptyState, { title: "Members list is visible to group members", description: "Accept the invitation to see who else is in this group.", icon: _jsxDEV(Users, { className: "h-6 w-6" }, void 0, false) }, void 0, false),

          !membersRestricted && members.length === 0 && _jsxDEV(EmptyState, { title: "No members yet", icon: _jsxDEV(Users, { className: "h-6 w-6" }, void 0, false) }, void 0, false),
          !membersRestricted && members.length > 0 &&
          _jsxDEV("div", {
 className: "flex flex-col gap-2", children:
            members.map((m) => {return (
                _jsxDEV(Card, {
 className: "flex items-center gap-3 p-4", children: [
                  m.profile_photo_url ?
                  _jsxDEV("img", { src: m.profile_photo_url, alt: m.full_name, className: "h-10 w-10 flex-shrink-0 rounded-full object-cover" }, void 0, false) :

                  _jsxDEV("span", { className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-700", children: initials(m.full_name) }, void 0, false),

                  _jsxDEV("div", {
 className: "min-w-0 flex-1", children: [
                    _jsxDEV("p", {
 className: "flex items-center gap-1.5 truncate text-sm font-bold text-navy-900 dark:text-white", children: [
                      m.full_name,
                      m.is_verified && _jsxDEV(ShieldCheck, { className: "h-3.5 w-3.5 flex-shrink-0 text-emerald-500" }, void 0, false)] 
}, void 0, true
                    ),
                    _jsxDEV("p", { className: "flex items-center gap-1 truncate text-xs text-navy-500", children: [_jsxDEV(Mail, { className: "h-3 w-3 flex-shrink-0" }, void 0, false), m.email] }, void 0, true)] 
}, void 0, true
                  )] 
}, m.id, true
                ));
            }) 
}, void 0, false
          )] 
}, void 0, true

        )] 
}, void 0, true

      ) 
}, void 0, false
    ));

}