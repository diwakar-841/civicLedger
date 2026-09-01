import { useState } from "react";
import { Fingerprint, KeyRound, X, BadgeCheck, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";
import { runVoteAuth } from "../../lib/webauthn";
import { apiClient } from "../../lib/apiClient";
import { formatError } from "../../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function initials(name) {
  return name.
  split(" ").
  filter(Boolean).
  slice(0, 2).
  map((w) => {return w[0].toUpperCase();}).
  join("");
}

export function VoteAuthModal({ candidate, onSuccess, onCancel }) {
  const [tab, setTab] = useState("biometric");
  const [votingPin, setVotingPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBiometric() {
    setError("");
    setLoading(true);
    try {
      const voteToken = await runVoteAuth();
      onSuccess(voteToken);
    } catch (err) {
      setError(formatError(err, "Verification failed — please try again"));
    } finally {
      setLoading(false);
    }
  }

  async function handlePin() {
    if (votingPin.length !== 6) {return;}
    setError("");
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/vote/verify-pin", { pin: votingPin });
      onSuccess(data.voteToken);
    } catch (err) {
      setError(formatError(err, "Incorrect voting PIN — please try again"));
    } finally {
      setLoading(false);
    }
  }

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
 className: "flex h-8 w-8 items-center justify-center rounded-lg bg-gold-100", children:
                tab === "biometric" ?
                _jsxDEV(Fingerprint, { className: "h-5 w-5 text-gold-600" }, void 0, false) :

                _jsxDEV(KeyRound, { className: "h-5 w-5 text-gold-600" }, void 0, false) 
}, void 0, false

              ),
              _jsxDEV("h2", { className: "text-base font-semibold text-navy-900", children: "Verify to vote" }, void 0, false)] 
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
 className: "flex border-b border-navy-100", children: [
            _jsxDEV("button", {
              onClick: () => {setTab("biometric");setError("");},
              className: `flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
              tab === "biometric" ?
              "border-b-2 border-gold-400 text-gold-600" :
              "text-navy-400 hover:text-navy-700"}`, children: [

              _jsxDEV(Fingerprint, { className: "h-3.5 w-3.5" }, void 0, false), "Biometric"] 
}, void 0, true

            ),
            _jsxDEV("button", {
              onClick: () => {setTab("pin");setError("");setVotingPin("");},
              className: `flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
              tab === "pin" ?
              "border-b-2 border-gold-400 text-gold-600" :
              "text-navy-400 hover:text-navy-700"}`, children: [

              _jsxDEV(KeyRound, { className: "h-3.5 w-3.5" }, void 0, false), "Voting PIN"] 
}, void 0, true

            )] 
}, void 0, true
          ),

          _jsxDEV("div", {
 className: "p-6 flex flex-col gap-4", children: [

            _jsxDEV("div", {
 className: "rounded-xl border border-navy-100 bg-navy-50 p-3", children: [
              _jsxDEV("p", { className: "mb-2 text-xs font-semibold uppercase tracking-wide text-navy-400", children: "Voting for" }, void 0, false

              ),
              _jsxDEV("div", {
 className: "flex items-center gap-3", children: [
                candidate.photoUrl ?
                _jsxDEV("img", {
                  src: candidate.photoUrl,
                  alt: candidate.name,
                  className: "h-12 w-12 rounded-lg object-cover border border-navy-200 flex-shrink-0" 
}, void 0, false
                ) :

                _jsxDEV("div", {
 className: "h-12 w-12 rounded-lg bg-navy-200 flex items-center justify-center text-sm font-bold text-navy-700 flex-shrink-0", children:
                  initials(candidate.name) 
}, void 0, false
                ),

                _jsxDEV("div", {
 className: "min-w-0", children: [
                  _jsxDEV("div", {
 className: "flex flex-wrap items-center gap-1.5", children: [
                    _jsxDEV("p", { className: "font-bold text-navy-900", children: candidate.name }, void 0, false),
                    candidate.voterId &&
                    _jsxDEV("span", {
 className: "inline-flex items-center gap-0.5 text-xs font-mono font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5", children: [
                      _jsxDEV(BadgeCheck, { className: "h-3 w-3" }, void 0, false),
                      candidate.voterId] 
}, void 0, true
                    )] 
}, void 0, true

                  ),
                  candidate.party &&
                  _jsxDEV("div", {
 className: "flex items-center gap-1 mt-0.5", children: [
                    _jsxDEV(Building2, { className: "h-3 w-3 text-navy-400" }, void 0, false),
                    _jsxDEV("p", { className: "text-xs text-navy-500", children: candidate.party }, void 0, false)] 
}, void 0, true
                  )] 
}, void 0, true

                )] 
}, void 0, true
              ),
              _jsxDEV("p", { className: "mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5", children: "This action is permanent and cannot be undone. Your vote is recorded on the blockchain." }, void 0, false

              )] 
}, void 0, true
            ),

            _jsxDEV(AnimatePresence, {
 mode: "wait", children:
              tab === "biometric" ?
              _jsxDEV(motion.div, {

                initial: { opacity: 0, x: -8 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: 8 },
                transition: { duration: 0.18 },
                className: "flex flex-col gap-4", children: [

                _jsxDEV("div", {
 className: "flex flex-col items-center gap-3 rounded-xl border border-navy-100 bg-navy-50 p-5", children: [
                  _jsxDEV(Fingerprint, { className: "h-12 w-12 text-navy-400" }, void 0, false),
                  _jsxDEV("p", {
 className: "text-center text-sm text-navy-600", children: ["Your device will prompt for",
                    " ",
                    _jsxDEV("strong", { children: "fingerprint or face ID" }, void 0, false)] 
}, void 0, true
                  )] 
}, void 0, true
                ),

                error &&
                _jsxDEV("p", {
 className: "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700", children:
                  error 
}, void 0, false
                ),

                _jsxDEV(Button, {
 loading: loading, fullWidth: true, onClick: handleBiometric, children:
                  loading ? "Waiting for biometric…" : "Confirm vote" 
}, void 0, false
                )] 
}, "biometric", true
              ) :

              _jsxDEV(motion.div, {

                initial: { opacity: 0, x: 8 },
                animate: { opacity: 1, x: 0 },
                exit: { opacity: 0, x: -8 },
                transition: { duration: 0.18 },
                className: "flex flex-col gap-4", children: [

                _jsxDEV("p", {
 className: "text-sm text-navy-600", children: ["Enter your 6-digit ",
                  _jsxDEV("strong", { children: "Voting PIN" }, void 0, false), " to confirm this vote."] 
}, void 0, true
                ),

                _jsxDEV("div", {
 className: "flex flex-col gap-1.5", children: [
                  _jsxDEV("label", { className: "text-sm font-medium text-navy-800", children: "Voting PIN" }, void 0, false),
                  _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                    _jsxDEV("input", {
                      type: showPin ? "text" : "password",
                      inputMode: "numeric",
                      pattern: "\\d*",
                      maxLength: 6,
                      value: votingPin,
                      onChange: (e) =>
                      {return setVotingPin(e.target.value.replace(/\D/g, "").slice(0, 6));},

                      placeholder: "••••••",
                      autoFocus: true,
                      className: "flex-1 rounded-lg border border-navy-200 px-3 py-2.5 text-sm font-mono tracking-widest text-navy-900 placeholder-navy-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20" 
}, void 0, false
                    ),
                    _jsxDEV("button", {
                      type: "button",
                      onClick: () => {return setShowPin((v) => {return !v;});},
                      className: "flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg border border-navy-200 text-navy-400 hover:bg-navy-50 hover:text-navy-700",
                      "aria-label": showPin ? "Hide PIN" : "Show PIN", children:

                      showPin ?
                      _jsxDEV("svg", {
 className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children:
                        _jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" }, void 0, false) 
}, void 0, false
                      ) :

                      _jsxDEV("svg", {
 className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: [
                        _jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }, void 0, false),
                        _jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }, void 0, false)] 
}, void 0, true
                      ) 
}, void 0, false

                    )] 
}, void 0, true
                  )] 
}, void 0, true
                ),

                error &&
                _jsxDEV("p", {
 className: "rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700", children:
                  error 
}, void 0, false
                ),

                _jsxDEV(Button, {
                  loading: loading,
                  fullWidth: true,
                  onClick: handlePin,
                  disabled: votingPin.length !== 6, children:

                  loading ? "Verifying…" : "Confirm vote with PIN" 
}, void 0, false
                )] 
}, "pin", true
              ) 
}, void 0, false

            ),

            _jsxDEV("button", {
              type: "button",
              onClick: onCancel,
              className: "text-center text-xs text-navy-400 hover:text-navy-600", children:
              "Cancel" 
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