import { CheckCircle2, BadgeCheck } from "lucide-react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function initials(name) {
  return name.
  split(" ").
  filter(Boolean).
  slice(0, 2).
  map((w) => {return w[0].toUpperCase();}).
  join("");
}

export function CandidateListItem({ candidate, selected, onSelect, disabled }) {
  return (
    _jsxDEV("button", {
      type: "button",
      onClick: onSelect,
      disabled: disabled,
      "aria-pressed": selected,
      className: `focus-ring group flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all duration-150 ${
      selected ?
      "border-gold-400 bg-gold-50 shadow-card" :
      "border-navy-100 bg-white hover:border-navy-300 hover:shadow-card"} ${
      disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`, children: [

      _jsxDEV("div", {
 className: "relative flex-shrink-0", children: [
        candidate.photoUrl ?
        _jsxDEV("img", {
          src: candidate.photoUrl,
          alt: candidate.name,
          className: "h-11 w-11 rounded-lg border-2 border-navy-100 object-cover",
          onError: (e) => {
            e.target.style.display = "none";
            const sib = e.target.nextElementSibling;
            if (sib) {sib.style.display = "flex";}
          } 
}, void 0, false
        ) :
        null,
        _jsxDEV("div", {
          style: { display: candidate.photoUrl ? "none" : "flex" },
          className: `h-11 w-11 items-center justify-center rounded-lg border-2 text-sm font-bold ${
          selected ?
          "border-gold-300 bg-gold-100 text-gold-700" :
          "border-navy-200 bg-navy-100 text-navy-600"}`, children:

          initials(candidate.name) 
}, void 0, false
        )] 
}, void 0, true
      ),

      _jsxDEV("div", {
 className: "min-w-0 flex-1", children: [
        _jsxDEV("p", { className: "truncate text-sm font-bold text-navy-900", children: candidate.name }, void 0, false),
        _jsxDEV("div", {
 className: "mt-0.5 flex flex-wrap items-center gap-1.5", children: [
          candidate.voterId &&
          _jsxDEV("span", {
 className: "inline-flex items-center gap-0.5 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-mono font-semibold text-emerald-700", children: [
            _jsxDEV(BadgeCheck, { className: "h-2.5 w-2.5" }, void 0, false),
            candidate.voterId] 
}, void 0, true
          ),

          candidate.party &&
          _jsxDEV("span", { className: "truncate text-xs text-navy-500", children: candidate.party }, void 0, false)] 
}, void 0, true

        )] 
}, void 0, true
      ),

      _jsxDEV("div", {
        className: `flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? "border-gold-500 bg-gold-400" : "border-navy-200 bg-white"}`, children:

        selected && _jsxDEV(CheckCircle2, { className: "h-3.5 w-3.5 text-navy-950" }, void 0, false) 
}, void 0, false
      )] 
}, void 0, true
    ));

}