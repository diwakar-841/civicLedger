import { useState, FormEvent } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { TextField } from "../components/shared/Input";
import { apiClient } from "../lib/apiClient";
import { useToast } from "../contexts/ToastContext";
import { formatError } from "../lib/formatError";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { show } = useToast();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiClient.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      show(formatError(err, "Could not send reset email"), "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    _jsxDEV("div", {
 className: "relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6", children: [
      _jsxDEV("div", { className: "pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" }, void 0, false),
      _jsxDEV("div", { className: "pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" }, void 0, false),
      _jsxDEV("div", {
 className: "w-full max-w-md", children:
        _jsxDEV(motion.div, {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }, children: [

          _jsxDEV("div", {
 className: "mb-6 flex flex-col items-center text-center sm:mb-8", children: [
            _jsxDEV("span", {
 className: "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25", children:
              _jsxDEV(ShieldCheck, { className: "h-6 w-6 sm:h-7 sm:w-7" }, void 0, false) 
}, void 0, false
            ),
            _jsxDEV("h1", { className: "text-2xl font-extrabold text-navy-900", children: "Reset your password" }, void 0, false),
            _jsxDEV("p", { className: "mt-1.5 text-sm text-navy-500", children: "We'll send a secure reset link to your email" }, void 0, false)] 
}, void 0, true
          ),

          sent ?
          _jsxDEV(Card, {
 className: "flex flex-col items-center gap-4 p-8 text-center", children: [
            _jsxDEV("span", {
 className: "flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600", children:
              _jsxDEV(CheckCircle2, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
            ),
            _jsxDEV("h2", { className: "text-lg font-semibold text-navy-900", children: "Check your email" }, void 0, false),
            _jsxDEV("p", {
 className: "text-sm text-navy-500", children: ["If an account exists for ",
              _jsxDEV("span", { className: "font-medium text-navy-700", children: email }, void 0, false), ", a password reset link has been sent."] 
}, void 0, true
            ),
            _jsxDEV(Link, { to: "/login", className: "text-sm font-medium text-gold-500 hover:text-gold-600", children: "Back to sign in" }, void 0, false

            )] 
}, void 0, true
          ) :

          _jsxDEV(_Fragment, {
 children: [
            _jsxDEV(Card, {
 className: "p-6 sm:p-8", children:
              _jsxDEV("form", {
 onSubmit: handleSubmit, className: "flex flex-col gap-4", children: [
                _jsxDEV(TextField, {
                  label: "Email address",
                  type: "email",
                  autoComplete: "email",
                  required: true,
                  value: email,
                  onChange: (e) => {return setEmail(e.target.value);} 
}, void 0, false
                ),
                _jsxDEV(Button, { type: "submit", loading: loading, fullWidth: true, className: "mt-1", children: "Send reset link" }, void 0, false

                )] 
}, void 0, true
              ) 
}, void 0, false
            ),
            _jsxDEV("p", {
 className: "mt-6 text-center text-sm text-navy-500", children: ["Remembered it?",
              " ",
              _jsxDEV(Link, { to: "/login", className: "font-semibold text-gold-400 hover:text-gold-300", children: "Sign in" }, void 0, false

              )] 
}, void 0, true
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