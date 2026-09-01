import { CheckCircle2, BadgeCheck, Building2, Info } from "lucide-react";
import { Candidate } from "../../hooks/useElections";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function initials(name) {
  return name.
  split(" ").
  filter(Boolean).
  slice(0, 2).
  map((w) => {return w[0].toUpperCase();}).
  join("");
}

export function CandidateCard({ candidate, selected, onSelect, onViewDetails, disabled }) {
  return (
    _jsxDEV("div", {
      className: `flex items-stretch gap-3 rounded-2xl border-2 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
      selected ? "border-indigo-500 bg-indigo-50 shadow-card" : "border-navy-100 bg-white hover:border-indigo-300"}`, children: [

      _jsxDEV("button", {
        type: "button",
        onClick: onSelect,
        disabled: disabled,
        "aria-pressed": selected,
        className: `focus-ring group flex flex-1 items-center gap-3 rounded-lg p-2 text-left ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`, children: [

        _jsxDEV("span", {
          className: `flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? "border-indigo-600 bg-indigo-500" : "border-navy-300 bg-white group-hover:border-indigo-400"}`, children:

          selected && _jsxDEV(CheckCircle2, { className: "h-4 w-4 text-navy-950" }, void 0, false) 
}, void 0, false
        ),

        _jsxDEV("div", {
 className: "min-w-0 flex-1", children: [
          _jsxDEV("div", {
 className: "flex flex-wrap items-center gap-2", children: [
            _jsxDEV("p", { className: "text-base font-bold leading-tight text-navy-900", children: candidate.name }, void 0, false),
            candidate.voterId &&
            _jsxDEV("span", {
 className: "inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700", children: [
              _jsxDEV(BadgeCheck, { className: "h-3 w-3" }, void 0, false),
              candidate.voterId] 
}, void 0, true
            )] 
}, void 0, true

          ),
          candidate.party &&
          _jsxDEV("div", {
 className: "mt-1 flex items-center gap-1.5", children: [
            _jsxDEV(Building2, { className: "h-3.5 w-3.5 flex-shrink-0 text-navy-400" }, void 0, false),
            _jsxDEV("p", { className: "truncate text-sm font-medium text-navy-600", children: candidate.party }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true

        )] 
}, void 0, true
      ),

      _jsxDEV("button", {
        type: "button",
        onClick: onViewDetails,
        className: "focus-ring group relative flex-shrink-0 rounded-xl",
        "aria-label": `View details for ${candidate.name}`,
        title: "View candidate details", children: [

        candidate.photoUrl &&
        _jsxDEV("img", {
          src: candidate.photoUrl,
          alt: candidate.name,
          className: "h-16 w-16 rounded-xl border-2 border-navy-100 object-cover",
          onError: (e) => {
            e.target.style.display = "none";
            const sib = e.target.nextElementSibling;
            if (sib) {sib.style.display = "flex";}
          } 
}, void 0, false
        ),

        _jsxDEV("div", {
          style: { display: candidate.photoUrl ? "none" : "flex" },
          className: `h-16 w-16 items-center justify-center rounded-xl border-2 text-xl font-bold ${
          selected ?
          "border-indigo-300 bg-indigo-100 text-indigo-700" :
          "border-navy-200 bg-navy-100 text-navy-600"}`, children:

          initials(candidate.name) 
}, void 0, false
        ),
        _jsxDEV("span", {
 className: "absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-navy-800 text-white shadow-sm transition-colors group-hover:bg-navy-950", children:
          _jsxDEV(Info, { className: "h-3.5 w-3.5" }, void 0, false) 
}, void 0, false
        )] 
}, void 0, true
      )] 
}, void 0, true
    ));

}