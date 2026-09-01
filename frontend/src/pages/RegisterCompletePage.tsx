import { useState, FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, Eye, EyeOff, ShieldCheck, Copy, Check, BadgeCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { apiClient } from "../lib/apiClient";
import { useToast } from "../contexts/ToastContext";
import { formatError } from "../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function PasswordField({
  label,
  value,
  onChange,
  show,
  onToggle,
  autoComplete,
  hint

}) {
  return (
    _jsxDEV("div", {
 className: "flex flex-col gap-1", children: [
      _jsxDEV("label", { className: "text-sm font-medium text-navy-700", children: label }, void 0, false),
      _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
        _jsxDEV("input", {
          type: show ? "text" : "password",
          value: value,
          autoComplete: autoComplete,
          onChange: (e) => {return onChange(e.target.value);},
          className: "flex-1 rounded-lg border border-navy-200 px-3 py-2.5 text-sm text-navy-900 placeholder-navy-300 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 [&::-ms-reveal]:hidden [&::-ms-clear]:hidden" 
}, void 0, false

        ),
        _jsxDEV("button", {
          type: "button",
          onClick: onToggle,
          className: "flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-lg border border-navy-200 text-navy-400 hover:bg-navy-50 hover:text-navy-700",
          "aria-label": show ? "Hide password" : "Show password", children:

          show ? _jsxDEV(EyeOff, { className: "h-4 w-4" }, void 0, false) : _jsxDEV(Eye, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
        )] 
}, void 0, true
      ),
      hint && _jsxDEV("p", { className: "text-xs text-navy-400", children: hint }, void 0, false)] 
}, void 0, true
    ));

}

export function RegisterCompletePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { show } = useToast();

  const setPasswordToken = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [voterId, setVoterId] = useState(null);
  const [copied, setCopied] = useState(false);

  const hasToken = Boolean(setPasswordToken);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!hasToken) {return;}
    if (password !== confirm) {show("Passwords do not match", "error");return;}

    setLoading(true);
    try {
      const { data } = await apiClient.post(
        "/auth/register/set-password",
        { setPasswordToken, password }
      );

      setVoterId(data.voterId);
    } catch (err) {
      show(formatError(err, "Could not set password — the link may have expired"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyVoterId() {
    if (!voterId) {return;}
    try {
      await navigator.clipboard.writeText(voterId);
      setCopied(true);
      setTimeout(() => {return setCopied(false);}, 2000);
    } catch {

    }
  }

  return (
    _jsxDEV("div", {
 className: "relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6", children: [
      _jsxDEV("div", { className: "pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" }, void 0, false),
      _jsxDEV("div", { className: "pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" }, void 0, false),
      _jsxDEV("div", {
 className: "w-full max-w-md", children:
        _jsxDEV(motion.div, {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }, children: [

          _jsxDEV("div", {
 className: "mb-8 flex flex-col items-center text-center", children: [
            _jsxDEV("span", {
 className: "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25", children:
              voterId ?
              _jsxDEV(BadgeCheck, { className: "h-7 w-7" }, void 0, false) :
              hasToken ?
              _jsxDEV(KeyRound, { className: "h-7 w-7" }, void 0, false) :

              _jsxDEV(ShieldCheck, { className: "h-7 w-7" }, void 0, false) 
}, void 0, false

            ),
            _jsxDEV("h1", {
 className: "text-2xl font-extrabold text-navy-900", children:
              voterId ? "Password created" : hasToken ? "Create your password" : "Invalid link" 
}, void 0, false
            ),
            _jsxDEV("p", {
 className: "mt-1.5 max-w-sm text-sm text-navy-500", children:
              voterId ?
              "Sign in next to verify your phone and finish setup." :
              hasToken ?
              "Choose a strong password. You'll verify your phone next." :
              "This link is invalid or has expired. Please start registration again." 
}, void 0, false
            )] 
}, void 0, true
          ),

          voterId ?
          _jsxDEV(Card, {
 className: "p-6 sm:p-8", children:
            _jsxDEV("div", {
 className: "flex flex-col items-center gap-4 text-center", children: [
              _jsxDEV("p", { className: "text-xs font-semibold uppercase tracking-wide text-navy-400", children: "Your unique Voter ID" }, void 0, false

              ),
              _jsxDEV("div", {
 className: "flex w-full items-center justify-between gap-2 rounded-xl border-2 border-gold-300 bg-gold-50 px-4 py-3", children: [
                _jsxDEV("span", {
 className: "font-mono text-lg font-bold tracking-wider text-navy-900", children:
                  voterId 
}, void 0, false
                ),
                _jsxDEV("button", {
                  type: "button",
                  onClick: handleCopyVoterId,
                  className: "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-navy-200 bg-white text-navy-500 hover:bg-navy-50 hover:text-navy-800",
                  "aria-label": "Copy Voter ID", children:

                  copied ? _jsxDEV(Check, { className: "h-4 w-4 text-emerald-600" }, void 0, false) : _jsxDEV(Copy, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
                )] 
}, void 0, true
              ),
              _jsxDEV("p", { className: "text-sm text-navy-500", children: "Your Voter ID is unique — keep it handy." }, void 0, false),
              _jsxDEV(Button, { fullWidth: true, className: "mt-2", onClick: () => {return navigate("/login");}, children: "Sign in to verify your phone" }, void 0, false

              )] 
}, void 0, true
            ) 
}, void 0, false
          ) :
          hasToken ?
          _jsxDEV(Card, {
 className: "p-6 sm:p-8", children:
            _jsxDEV("form", {
 onSubmit: handleSubmit, className: "flex flex-col gap-4", children: [
              _jsxDEV(PasswordField, {
                label: "Password",
                value: password,
                onChange: setPassword,
                show: showPwd,
                onToggle: () => {return setShowPwd((v) => {return !v;});},
                autoComplete: "new-password",
                hint: "At least 10 characters, with uppercase, lowercase and a number" 
}, void 0, false
              ),
              _jsxDEV(PasswordField, {
                label: "Confirm password",
                value: confirm,
                onChange: setConfirm,
                show: showPwd,
                onToggle: () => {return setShowPwd((v) => {return !v;});},
                autoComplete: "new-password" 
}, void 0, false
              ),
              confirm && password !== confirm &&
              _jsxDEV("p", { className: "text-xs text-red-500", children: "Passwords do not match" }, void 0, false),

              _jsxDEV(Button, {
                type: "submit",
                loading: loading,
                fullWidth: true,
                className: "mt-2",
                disabled: !password || !confirm || password !== confirm, children:
                "Create account" 
}, void 0, false

              )] 
}, void 0, true
            ) 
}, void 0, false
          ) :

          _jsxDEV(Card, {
 className: "p-6 text-center", children: [
            _jsxDEV("p", { className: "mb-4 text-sm text-navy-500", children: "Verification links expire after 24 hours." }, void 0, false

            ),
            _jsxDEV(Link, {
              to: "/register",
              className: "inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors", children:
              "Start registration again" 
}, void 0, false

            )] 
}, void 0, true
          ),

          _jsxDEV("p", {
 className: "mt-4 text-center text-sm text-navy-400", children: ["Already registered?",
            " ",
            _jsxDEV(Link, { to: "/login", className: "font-semibold text-indigo-600 hover:text-indigo-800 transition-colors", children: "Sign in" }, void 0, false

            )] 
}, void 0, true
          )] 
}, void 0, true
        ) 
}, void 0, false
      )] 
}, void 0, true
    ));

}