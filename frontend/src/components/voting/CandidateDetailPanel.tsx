import { BadgeCheck, Building2, Info, MousePointerClick, Award, Lightbulb } from "lucide-react";
import { Button } from "../shared/Button";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function initials(name) {
  return name.
  split(" ").
  filter(Boolean).
  slice(0, 2).
  map((w) => {return w[0].toUpperCase();}).
  join("");
}

export function CandidateDetailPanel({ candidate, onOpenDetails }) {
  if (!candidate) {
    return (
      _jsxDEV("div", {
 className: "flex h-full min-h-[280px] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-navy-200 p-8 text-center", children: [
        _jsxDEV(MousePointerClick, { className: "h-8 w-8 text-navy-300" }, void 0, false),
        _jsxDEV("p", { className: "text-sm font-medium text-navy-500", children: "Select a candidate from the list to see their details here" }, void 0, false

        )] 
}, void 0, true
      ));

  }

  return (
    _jsxDEV("div", {
 className: "flex flex-col gap-4", children: [

      _jsxDEV("button", {
        type: "button",
        onClick: onOpenDetails,
        className: "focus-ring group relative mx-auto h-32 w-32 overflow-hidden rounded-2xl border-4 border-navy-100 shadow-card transition-transform hover:scale-[1.02]",
        "aria-label": `View full details for ${candidate.name}`, children: [

        candidate.photoUrl ?
        _jsxDEV("img", { src: candidate.photoUrl, alt: candidate.name, className: "h-full w-full object-cover" }, void 0, false) :

        _jsxDEV("div", {
 className: "flex h-full w-full items-center justify-center bg-navy-100 text-3xl font-bold text-navy-600", children:
          initials(candidate.name) 
}, void 0, false
        ),

        _jsxDEV("div", {
 className: "absolute inset-0 flex items-center justify-center gap-1 bg-navy-950/0 text-white opacity-0 transition-all group-hover:bg-navy-950/60 group-hover:opacity-100", children: [
          _jsxDEV(Info, { className: "h-4 w-4" }, void 0, false),
          _jsxDEV("span", { className: "text-xs font-semibold", children: "View details" }, void 0, false)] 
}, void 0, true
        )] 
}, void 0, true
      ),

      _jsxDEV("div", {
 className: "text-center", children: [
        _jsxDEV("p", { className: "text-lg font-bold text-navy-900", children: candidate.name }, void 0, false),
        candidate.voterId &&
        _jsxDEV("span", {
 className: "mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-mono font-semibold text-emerald-700", children: [
          _jsxDEV(BadgeCheck, { className: "h-3.5 w-3.5" }, void 0, false),
          candidate.voterId] 
}, void 0, true
        ),

        candidate.party &&
        _jsxDEV("div", {
 className: "mt-1.5 flex items-center justify-center gap-1.5", children: [
          _jsxDEV(Building2, { className: "h-3.5 w-3.5 text-navy-400" }, void 0, false),
          _jsxDEV("p", { className: "text-sm text-navy-600", children: candidate.party }, void 0, false)] 
}, void 0, true
        )] 
}, void 0, true

      ),

      (candidate.bio || candidate.qualification || candidate.supports) &&
      _jsxDEV("div", {
 className: "flex flex-col gap-2 rounded-xl border border-navy-100 bg-navy-50 p-3", children: [
        candidate.bio &&
        _jsxDEV("p", { className: "line-clamp-3 text-xs text-navy-600", children: candidate.bio }, void 0, false),

        candidate.qualification &&
        _jsxDEV("div", {
 className: "flex items-start gap-1.5", children: [
          _jsxDEV(Award, { className: "mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-gold-500" }, void 0, false),
          _jsxDEV("p", { className: "line-clamp-1 text-xs text-navy-500", children: candidate.qualification }, void 0, false)] 
}, void 0, true
        ),

        candidate.supports &&
        _jsxDEV("div", {
 className: "flex items-start gap-1.5", children: [
          _jsxDEV(Lightbulb, { className: "mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-500" }, void 0, false),
          _jsxDEV("p", { className: "line-clamp-1 text-xs text-navy-500", children: candidate.supports }, void 0, false)] 
}, void 0, true
        )] 
}, void 0, true

      ),

      _jsxDEV(Button, {
 variant: "ghost", size: "sm", onClick: onOpenDetails, className: "mx-auto", children: [
        _jsxDEV(Info, { className: "h-4 w-4" }, void 0, false), "View full profile"] 
}, void 0, true

      )] 
}, void 0, true
    ));

}