import { X, BadgeCheck, UserPlus, Hash } from "lucide-react";
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

export function VoterDetailModal({ voter, onClose, onAdd, alreadyAdded }) {
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
            _jsxDEV("h2", { className: "text-base font-semibold text-navy-900", children: "Voter details" }, void 0, false),
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
              voter.photoUrl ?
              _jsxDEV("img", {
                src: voter.photoUrl,
                alt: voter.fullName,
                className: "h-24 w-24 rounded-2xl border-2 border-navy-100 object-cover" 
}, void 0, false
              ) :

              _jsxDEV("div", {
 className: "flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-navy-200 bg-navy-100 text-3xl font-bold text-navy-600", children:
                initials(voter.fullName) 
}, void 0, false
              ),

              _jsxDEV("div", {
 children: [
                _jsxDEV("p", { className: "text-lg font-semibold text-navy-900", children: voter.fullName }, void 0, false),
                _jsxDEV("p", {
 className: "mt-0.5 flex items-center justify-center gap-1 font-mono text-xs text-navy-500", children: [
                  _jsxDEV(Hash, { className: "h-3 w-3" }, void 0, false),
                  voter.voterId] 
}, void 0, true
                )] 
}, void 0, true
              )] 
}, void 0, true
            ),

            _jsxDEV("div", {
 className: "flex items-center justify-center gap-2", children:
              voter.walletLinked ?
              _jsxDEV("span", {
 className: "inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700", children: [
                _jsxDEV(BadgeCheck, { className: "h-3.5 w-3.5" }, void 0, false), "Wallet linked"] 
}, void 0, true

              ) :

              _jsxDEV("span", { className: "inline-flex items-center gap-1.5 rounded-full bg-navy-100 px-2.5 py-1 text-xs font-medium text-navy-500", children: "No wallet linked yet" }, void 0, false

              ) 
}, void 0, false

            ),

            onAdd &&
            _jsxDEV(Button, {
 fullWidth: true, onClick: onAdd, disabled: alreadyAdded, children: [
              _jsxDEV(UserPlus, { className: "h-4 w-4" }, void 0, false),
              alreadyAdded ? "Already added" : "Add as candidate"] 
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