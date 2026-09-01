import { User, Mail, Phone, Calendar, BookOpen, Briefcase, ShieldCheck } from "lucide-react";
import { Card } from "../shared/Card";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function UserProfileCard({ user, isEditing }) {
  return (
    _jsxDEV(Card, {
 className: "flex flex-col gap-6 p-6 dark:bg-navy-900 dark:border-navy-700", children: [
      _jsxDEV("div", {
 className: "flex flex-col gap-4 border-b border-navy-100 pb-6 sm:flex-row sm:items-center sm:gap-5 dark:border-navy-800", children: [
        user.profilePhotoUrl ?
        _jsxDEV("img", {
          src: user.profilePhotoUrl,
          alt: user.fullName,
          className: "h-20 w-20 flex-shrink-0 rounded-2xl object-cover ring-4 ring-indigo-50" 
}, void 0, false
        ) :
        _jsxDEV("span", { className: "flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-extrabold text-white shadow-lg shadow-indigo-600/20", children: user.fullName.slice(0, 1).toUpperCase() }, void 0, false),
        _jsxDEV("div", {
 className: "flex-1", children: [
          _jsxDEV("div", { className: "flex flex-wrap items-center gap-2", children: [_jsxDEV("h2", { className: "text-2xl font-bold text-navy-900 dark:text-navy-50", children: user.fullName }, void 0, false), _jsxDEV("span", { className: "inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700", children: [_jsxDEV(ShieldCheck, { className: "h-3 w-3" }, void 0, false), "Administrator"] }, void 0, true)] }, void 0, true),
          _jsxDEV("p", {
 className: "mt-1 text-sm text-navy-500 dark:text-navy-400", children:
            user.bio || "Manage elections and trusted civic participation from your account." 
}, void 0, false
          )] 
}, void 0, true
        )] 
}, void 0, true
      ),

      _jsxDEV("div", {
 className: "grid gap-5 sm:grid-cols-2", children: [
        _jsxDEV("div", {
 className: "flex items-start gap-3", children: [
          _jsxDEV(Mail, { className: "h-5 w-5 flex-shrink-0 text-gold-400 mt-0.5" }, void 0, false),
          _jsxDEV("div", {
 className: "min-w-0", children: [
            _jsxDEV("p", { className: "text-xs font-semibold uppercase text-navy-500 dark:text-navy-400", children: "Email" }, void 0, false),
            _jsxDEV("p", { className: "text-sm text-navy-700 dark:text-navy-200 break-all", children: user.email }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true
        ),

        _jsxDEV("div", {
 className: "flex items-start gap-3", children: [
          _jsxDEV(Phone, { className: "h-5 w-5 flex-shrink-0 text-gold-400 mt-0.5" }, void 0, false),
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", { className: "text-xs font-semibold uppercase text-navy-500 dark:text-navy-400", children: "Phone" }, void 0, false),
            _jsxDEV("p", { className: "text-sm text-navy-700 dark:text-navy-200", children: user.phone || "Not added yet" }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true
        ),

        _jsxDEV("div", {
 className: "flex items-start gap-3", children: [
          _jsxDEV(Calendar, { className: "h-5 w-5 flex-shrink-0 text-gold-400 mt-0.5" }, void 0, false),
          _jsxDEV("div", {
 children: [
            _jsxDEV("p", { className: "text-xs font-semibold uppercase text-navy-500 dark:text-navy-400", children: "Date of Birth" }, void 0, false),
            _jsxDEV("p", {
 className: "text-sm text-navy-700 dark:text-navy-200", children:
              user.dob ? new Date(user.dob).toLocaleDateString() : "Not added yet" 
}, void 0, false
            )] 
}, void 0, true
          )] 
}, void 0, true
        )] 
}, void 0, true
      ),

      _jsxDEV("div", {
 className: "border-t border-navy-100 pt-5 dark:border-navy-800", children: _jsxDEV("div", {
 className: "flex gap-3", children: [
          _jsxDEV(BookOpen, { className: "h-5 w-5 flex-shrink-0 text-gold-400 mt-0.5" }, void 0, false),
          _jsxDEV("div", {
 className: "flex-1", children: [
            _jsxDEV("p", { className: "text-xs font-semibold uppercase text-navy-500 dark:text-navy-400", children: "Qualifications" }, void 0, false),
            _jsxDEV("p", {
 className: "mt-1 text-sm text-navy-700 dark:text-navy-200 whitespace-pre-wrap", children:
              user.qualifications || "Not added yet" 
}, void 0, false
            )] 
}, void 0, true
          )] 
}, void 0, true
        ) 
}, void 0, false),

      _jsxDEV("div", {
 className: "flex gap-3", children: [
        _jsxDEV(Briefcase, { className: "h-5 w-5 flex-shrink-0 text-gold-400 mt-0.5" }, void 0, false),
        _jsxDEV("div", {
 className: "flex-1", children: [
          _jsxDEV("p", { className: "text-xs font-semibold uppercase text-navy-500 dark:text-navy-400", children: "Experience" }, void 0, false),
          _jsxDEV("p", {
 className: "mt-1 text-sm text-navy-700 dark:text-navy-200 whitespace-pre-wrap", children:
            user.experience || "Not added yet" 
}, void 0, false
          )] 
}, void 0, true
        )] 
}, void 0, true
      )] 
}, void 0, true
    ));

}