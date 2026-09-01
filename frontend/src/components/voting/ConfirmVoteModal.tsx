import { AlertTriangle, BadgeCheck, Building2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function initials(name) {
  return name.
  split(" ").
  filter(Boolean).
  slice(0, 2).
  map((w) => {return w[0].toUpperCase();}).
  join("");
}

export function ConfirmVoteModal({ candidate, onConfirm, onCancel }) {
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
          onClick: onCancel 
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
            _jsxDEV("div", {
 className: "flex items-center gap-3", children: [
              _jsxDEV("span", {
 className: "flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100", children:
                _jsxDEV(AlertTriangle, { className: "h-5 w-5 text-amber-600" }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("h2", { className: "text-base font-semibold text-navy-900", children: "Confirm your vote" }, void 0, false)] 
}, void 0, true
            ),
            _jsxDEV("button", {
              onClick: onCancel,
              className: "rounded-lg p-1 text-navy-400 hover:bg-navy-50 hover:text-navy-700",
              "aria-label": "Close", children:

              _jsxDEV(X, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
            )] 
}, void 0, true
          ),

          _jsxDEV("div", {
 className: "flex flex-col gap-4 p-6", children: [
            _jsxDEV("p", { className: "text-sm text-navy-600", children: "Please check carefully — this is who you're about to vote for:" }, void 0, false

            ),

            _jsxDEV("div", {
 className: "flex items-center gap-3 rounded-xl border border-navy-100 bg-navy-50 p-3", children: [
              candidate.photoUrl ?
              _jsxDEV("img", {
                src: candidate.photoUrl,
                alt: candidate.name,
                className: "h-14 w-14 flex-shrink-0 rounded-lg border border-navy-200 object-cover" 
}, void 0, false
              ) :

              _jsxDEV("div", {
 className: "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-lg bg-navy-200 text-base font-bold text-navy-700", children:
                initials(candidate.name) 
}, void 0, false
              ),

              _jsxDEV("div", {
 className: "min-w-0", children: [
                _jsxDEV("p", { className: "font-bold text-navy-900", children: candidate.name }, void 0, false),
                candidate.voterId &&
                _jsxDEV("span", {
 className: "mt-0.5 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs font-mono font-semibold text-emerald-700", children: [
                  _jsxDEV(BadgeCheck, { className: "h-3 w-3" }, void 0, false),
                  candidate.voterId] 
}, void 0, true
                ),

                candidate.party &&
                _jsxDEV("div", {
 className: "mt-1 flex items-center gap-1", children: [
                  _jsxDEV(Building2, { className: "h-3 w-3 text-navy-400" }, void 0, false),
                  _jsxDEV("p", { className: "text-xs text-navy-500", children: candidate.party }, void 0, false)] 
}, void 0, true
                )] 
}, void 0, true

              )] 
}, void 0, true
            ),

            _jsxDEV("div", {
 className: "rounded-lg border border-red-200 bg-red-50 px-4 py-3", children: [
              _jsxDEV("p", { className: "text-xs font-semibold text-red-800", children: "Once you submit, your vote cannot be changed, edited, or withdrawn — for any reason." }, void 0, false

              ),
              _jsxDEV("p", { className: "mt-1 text-xs text-red-700", children: "Make sure this is the candidate you intend to vote for before continuing." }, void 0, false

              )] 
}, void 0, true
            ),

            _jsxDEV("div", {
 className: "flex flex-col gap-2 sm:flex-row-reverse", children: [
              _jsxDEV(Button, { fullWidth: true, onClick: onConfirm, children: "Yes, this is who I'm voting for" }, void 0, false

              ),
              _jsxDEV(Button, { fullWidth: true, variant: "ghost", onClick: onCancel, children: "Go back" }, void 0, false

              )] 
}, void 0, true
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