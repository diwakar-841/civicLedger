import { X, BadgeCheck, Building2, Award, Lightbulb, CheckCircle2, Hash } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

function initials(name) {
  return name.
  split(" ").
  filter(Boolean).
  slice(0, 2).
  map((w) => {return w[0].toUpperCase();}).
  join("");
}

export function CandidateDetailsModal({
  candidate,
  selected = false,
  onSelect,
  onClose,
  disabled,
  readOnly = false
}) {
  return (
    _jsxDEV(AnimatePresence, {
 children:
      _jsxDEV("div", {
 className: "fixed inset-0 z-50 flex items-center justify-center px-4", children: [
        _jsxDEV(motion.div, {
          className: "absolute inset-0 bg-black/60 backdrop-blur-sm",
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 },
          onClick: onClose 
}, void 0, false
        ),

        _jsxDEV(motion.div, {
          className: "relative z-10 w-full max-w-sm rounded-2xl bg-white shadow-2xl",
          initial: { opacity: 0, scale: 0.95, y: 16 },
          animate: { opacity: 1, scale: 1, y: 0 },
          exit: { opacity: 0, scale: 0.95, y: 16 },
          transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }, children: [

          _jsxDEV("div", {
 className: "flex items-center justify-between border-b border-navy-100 px-6 py-4", children: [
            _jsxDEV("h2", { className: "text-base font-semibold text-navy-900", children: "Candidate details" }, void 0, false),
            _jsxDEV("button", {
              onClick: onClose,
              className: "rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700",
              "aria-label": "Close", children:

              _jsxDEV(X, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
            )] 
}, void 0, true
          ),

          _jsxDEV("div", {
 className: "flex flex-col gap-4 p-6", children: [

            _jsxDEV("div", {
 className: "flex flex-col items-center gap-3 text-center", children: [
              candidate.photoUrl ?
              _jsxDEV("img", {
                src: candidate.photoUrl,
                alt: candidate.name,
                className: "h-24 w-24 rounded-2xl border-2 border-navy-100 object-cover" 
}, void 0, false
              ) :

              _jsxDEV("div", {
 className: "flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-navy-200 bg-navy-100 text-3xl font-bold text-navy-600", children:
                initials(candidate.name) 
}, void 0, false
              ),

              _jsxDEV("div", {
 children: [
                _jsxDEV("p", { className: "text-lg font-bold text-navy-900", children: candidate.name }, void 0, false),
                candidate.voterId &&
                _jsxDEV("span", {
 className: "mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-700", children: [
                  _jsxDEV(BadgeCheck, { className: "h-3 w-3" }, void 0, false),
                  candidate.voterId] 
}, void 0, true
                )] 
}, void 0, true

              )] 
}, void 0, true
            ),

            _jsxDEV("div", {
 className: "flex flex-col gap-3 rounded-xl border border-navy-100 bg-navy-50 p-4", children: [
              candidate.party &&
              _jsxDEV("div", {
 className: "flex items-start gap-2", children: [
                _jsxDEV(Building2, { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-navy-400" }, void 0, false),
                _jsxDEV("div", {
 children: [
                  _jsxDEV("p", { className: "text-xs font-semibold uppercase tracking-wide text-navy-400", children: "Team / Party" }, void 0, false),
                  _jsxDEV("p", { className: "text-sm text-navy-700", children: candidate.party }, void 0, false)] 
}, void 0, true
                )] 
}, void 0, true
              ),

              candidate.qualification &&
              _jsxDEV("div", {
 className: "flex items-start gap-2", children: [
                _jsxDEV(Award, { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-gold-500" }, void 0, false),
                _jsxDEV("div", {
 children: [
                  _jsxDEV("p", { className: "text-xs font-semibold uppercase tracking-wide text-navy-400", children: "Qualification" }, void 0, false),
                  _jsxDEV("p", { className: "text-sm text-navy-700", children: candidate.qualification }, void 0, false)] 
}, void 0, true
                )] 
}, void 0, true
              ),

              candidate.supports &&
              _jsxDEV("div", {
 className: "flex items-start gap-2", children: [
                _jsxDEV(Lightbulb, { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" }, void 0, false),
                _jsxDEV("div", {
 children: [
                  _jsxDEV("p", { className: "text-xs font-semibold uppercase tracking-wide text-navy-400", children: "Agenda" }, void 0, false),
                  _jsxDEV("p", { className: "text-sm text-navy-700", children: candidate.supports }, void 0, false)] 
}, void 0, true
                )] 
}, void 0, true
              ),

              readOnly &&
              _jsxDEV("div", {
 className: "flex items-start gap-2", children: [
                _jsxDEV(Hash, { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-navy-400" }, void 0, false),
                _jsxDEV("div", {
 children: [
                  _jsxDEV("p", { className: "text-xs font-semibold uppercase tracking-wide text-navy-400", children: "On-chain ID" }, void 0, false),
                  _jsxDEV("p", { className: "text-sm text-navy-700", children: ["#", candidate.onChainCandidateId] }, void 0, true)] 
}, void 0, true
                )] 
}, void 0, true
              ),

              candidate.bio &&
              _jsxDEV("div", {
 children: [
                _jsxDEV("p", { className: "text-xs font-semibold uppercase tracking-wide text-navy-400", children: "About" }, void 0, false),
                _jsxDEV("p", { className: "text-sm text-navy-700", children: candidate.bio }, void 0, false)] 
}, void 0, true
              ),

              !candidate.party && !candidate.qualification && !candidate.supports && !candidate.bio &&
              _jsxDEV("p", { className: "text-sm text-navy-400", children: "No additional details provided for this candidate." }, void 0, false)] 
}, void 0, true

            ),

            !readOnly &&
            _jsxDEV(Button, {
              fullWidth: true,
              variant: selected ? "secondary" : "primary",
              disabled: disabled,
              onClick: onSelect, children:

              selected ?
              _jsxDEV(_Fragment, {
 children: [
                _jsxDEV(CheckCircle2, { className: "h-4 w-4" }, void 0, false), "Selected — choose this candidate"] 
}, void 0, true

              ) :

              "Choose this candidate" 
}, void 0, false

            )] 
}, void 0, true

          )] 
}, void 0, true
        )] 
}, void 0, true
      ) 
}, void 0, false
    ));

}