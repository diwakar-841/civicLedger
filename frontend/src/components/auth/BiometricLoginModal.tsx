import { useState } from "react";
import { Fingerprint, KeyRound, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";
import { runLoginBiometric } from "../../lib/webauthn";
import { apiClient } from "../../lib/apiClient";
import { formatError } from "../../lib/formatError";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

export function BiometricLoginModal({ loginToken, onSuccess, onCancel }) {
  const [tab, setTab] = useState("biometric");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleBiometric() {
    setError("");
    setLoading(true);
    try {
      const result = await runLoginBiometric(loginToken);
      onSuccess(result.user, result.accessToken);
    } catch (err) {
      setError(formatError(err, "Biometric verification failed — please try again"));
    } finally {
      setLoading(false);
    }
  }

  async function handlePin() {
    if (pin.length !== 6) {return;}
    setError("");
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/login-pin", { loginToken, pin });
      onSuccess(data.user, data.accessToken);
    } catch (err) {
      setError(formatError(err, "Incorrect PIN — please try again"));
    } finally {
      setLoading(false);
    }
  }

  return (
    _jsxDEV(AnimatePresence, {
 children:
      _jsxDEV("div", {
 className: "fixed inset-0 z-50 flex items-end justify-center sm:items-center px-4 pb-6 sm:pb-0", children: [

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
          initial: { opacity: 0, y: 40 },
          animate: { opacity: 1, y: 0 },
          exit: { opacity: 0, y: 40 },
          transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] }, children: [

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
              _jsxDEV("h2", { className: "text-base font-semibold text-navy-900", children: "Sign in" }, void 0, false)] 
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
              onClick: () => {setTab("pin");setError("");setPin("");},
              className: `flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-xs font-semibold transition-colors ${
              tab === "pin" ?
              "border-b-2 border-gold-400 text-gold-600" :
              "text-navy-400 hover:text-navy-700"}`, children: [

              _jsxDEV(KeyRound, { className: "h-3.5 w-3.5" }, void 0, false), "Login PIN"] 
}, void 0, true

            )] 
}, void 0, true
          ),

          _jsxDEV("div", {
 className: "p-6 flex flex-col gap-4", children: [
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
 className: "flex flex-col items-center gap-3 rounded-xl border border-navy-100 bg-navy-50 p-6", children: [
                  _jsxDEV(Fingerprint, { className: "h-14 w-14 text-navy-400" }, void 0, false),
                  _jsxDEV("p", {
 className: "text-center text-sm text-navy-600", children: ["Tap the button below — your device will prompt for",
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
                  loading ? "Waiting for biometric…" : "Sign in with biometric" 
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
                  _jsxDEV("strong", { children: "Login PIN" }, void 0, false), " to sign in."] 
}, void 0, true
                ),

                _jsxDEV("div", {
 className: "flex flex-col gap-1.5", children: [
                  _jsxDEV("label", { className: "text-sm font-medium text-navy-800", children: "Login PIN" }, void 0, false),
                  _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                    _jsxDEV("input", {
                      type: showPin ? "text" : "password",
                      inputMode: "numeric",
                      pattern: "\\d*",
                      maxLength: 6,
                      value: pin,
                      onChange: (e) => {return setPin(e.target.value.replace(/\D/g, "").slice(0, 6));},
                      placeholder: "••••••",
                      autoFocus: true,
                      className: "flex-1 rounded-lg border border-navy-200 px-3 py-2.5 text-sm font-mono tracking-widest text-navy-900 placeholder-navy-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
}, void 0, false

                    ),
                    _jsxDEV("button", {
                      type: "button",
                      onClick: () => {return setShowPin((v) => {return !v;});},
                      className: "flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg border border-navy-200 text-navy-400 hover:bg-navy-50 hover:text-navy-700",
                      "aria-label": showPin ? "Hide PIN" : "Show PIN", children:

                      showPin ?
                      _jsxDEV("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: _jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" }, void 0, false) }, void 0, false) :
                      _jsxDEV("svg", { className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, children: [_jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" }, void 0, false), _jsxDEV("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" }, void 0, false)] }, void 0, true) 
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
                  disabled: pin.length !== 6, children:

                  loading ? "Verifying…" : "Sign in with PIN" 
}, void 0, false
                )] 
}, "pin", true
              ) 
}, void 0, false

            ),

            _jsxDEV("button", {
              type: "button",
              onClick: () => {
                setError("");
                if (tab === "biometric") {
                  setTab("pin");
                  setPin("");
                } else {
                  setTab("biometric");
                }
              },
              className: "flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-navy-500 hover:text-navy-700", children:

              tab === "biometric" ?
              _jsxDEV(_Fragment, {
 children: [
                _jsxDEV(KeyRound, { className: "h-3.5 w-3.5" }, void 0, false), "Use PIN instead"] 
}, void 0, true

              ) :

              _jsxDEV(_Fragment, {
 children: [
                _jsxDEV(Fingerprint, { className: "h-3.5 w-3.5" }, void 0, false), "Use fingerprint instead"] 
}, void 0, true

              ) 
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