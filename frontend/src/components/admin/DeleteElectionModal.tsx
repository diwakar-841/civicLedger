import { AlertTriangle, X, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../shared/Button";
import { TextField } from "../shared/Input";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function DeleteElectionModal({
  electionTitle,
  password,
  code,
  loading,
  error,
  onPasswordChange,
  onCodeChange,
  onCancel,
  onConfirm
}) {
  const canSubmit = password.trim().length > 0 && code.trim().length >= 6;

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
 className: "flex h-8 w-8 items-center justify-center rounded-lg bg-red-100", children:
                _jsxDEV(AlertTriangle, { className: "h-5 w-5 text-red-600" }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("h2", { className: "text-base font-semibold text-navy-900", children: "Delete election" }, void 0, false)] 
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
            _jsxDEV("div", {
 className: "rounded-lg border border-red-200 bg-red-50 px-4 py-3", children: [
              _jsxDEV("p", {
 className: "text-xs font-semibold text-red-800", children: ["You are about to permanently delete \"",
                electionTitle, "\", including all its candidates."] 
}, void 0, true
              ),
              _jsxDEV("p", { className: "mt-1 text-xs text-red-700", children: "This cannot be undone. Votes already recorded on-chain remain part of the blockchain's history, but this election will no longer appear anywhere in the app." }, void 0, false

              )] 
}, void 0, true
            ),

            _jsxDEV("div", {
 className: "flex flex-col gap-3", children: [
              _jsxDEV("p", {
 className: "flex items-center gap-1.5 text-xs font-medium text-navy-500", children: [
                _jsxDEV(ShieldAlert, { className: "h-3.5 w-3.5" }, void 0, false), "Confirm your identity to continue"] 
}, void 0, true

              ),
              _jsxDEV(TextField, {
                label: "Password",
                type: "password",
                autoComplete: "current-password",
                value: password,
                onChange: (e) => {return onPasswordChange(e.target.value);} 
}, void 0, false
              ),
              _jsxDEV(TextField, {
                label: "2FA code",
                type: "text",
                inputMode: "numeric",
                placeholder: "6-digit authenticator code",
                value: code,
                onChange: (e) => {return onCodeChange(e.target.value);} 
}, void 0, false
              ),
              error && _jsxDEV("p", { className: "text-xs font-medium text-red-600", children: error }, void 0, false)] 
}, void 0, true
            ),

            _jsxDEV("div", {
 className: "flex flex-col gap-2 sm:flex-row-reverse", children: [
              _jsxDEV(Button, {
                fullWidth: true,
                variant: "danger",
                onClick: onConfirm,
                loading: loading,
                disabled: !canSubmit, children:
                "Yes, permanently delete" 
}, void 0, false

              ),
              _jsxDEV(Button, { fullWidth: true, variant: "ghost", onClick: onCancel, disabled: loading, children: "Cancel" }, void 0, false

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