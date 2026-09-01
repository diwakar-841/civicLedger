import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, KeyRound, Mail, ShieldCheck, User } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { TextField } from "../components/shared/Input";
import { apiClient } from "../lib/apiClient";
import { useToast } from "../contexts/ToastContext";
import { formatError } from "../lib/formatError";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

function maxDob(minAge) {
  const date = new Date();
  date.setFullYear(date.getFullYear() - minAge);
  return date.toISOString().split("T")[0];
}

const MAX_DOB = maxDob(16);

export function RegisterPage() {
  const navigate = useNavigate();
  const { show } = useToast();
  const [form, setForm] = useState({ fullName: "", email: "", dob: "" });
  const [verificationMethod, setVerificationMethod] = useState("otp");
  const [emailOtp, setEmailOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function update(key, value) {
    setForm((current) => {return { ...current, [key]: value };});
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (form.dob > MAX_DOB) {
      show("You must be at least 16 years old to register", "error");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/auth/register/initiate", {
        ...form,
        emailVerificationMethod: verificationMethod
      });
      setSubmitted(true);
      show(
        verificationMethod === "otp" ?
        "Verification code sent to your Gmail address" :
        "Verification link sent to your Gmail address",
        "success"
      );
    } catch (error) {
      show(formatError(error, "Could not start registration"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailOtp(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/register/verify-otp", {
        email: form.email,
        otp: emailOtp
      });
      navigate(`/register/complete?token=${encodeURIComponent(data.setPasswordToken)}`, { replace: true });
    } catch (error) {
      show(formatError(error, "Could not verify the code"), "error");
      setEmailOtp("");
    } finally {
      setLoading(false);
    }
  }

  async function switchVerificationMethod(method) {
    if (method === verificationMethod) {return;}
    setResending(true);
    try {
      await apiClient.post("/auth/resend-verification-public", { email: form.email, method });
      setVerificationMethod(method);
      setEmailOtp("");
      show(
        method === "otp" ?
        "A new verification code was sent to your Gmail" :
        "A new verification link was sent to your Gmail",
        "success"
      );
    } catch (error) {
      show(formatError(error, "Could not change the verification method"), "error");
    } finally {
      setResending(false);
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
              submitted ? verificationMethod === "otp" ? _jsxDEV(KeyRound, { className: "h-7 w-7" }, void 0, false) : _jsxDEV(Mail, { className: "h-7 w-7" }, void 0, false) : _jsxDEV(ShieldCheck, { className: "h-7 w-7" }, void 0, false) 
}, void 0, false
            ),
            _jsxDEV("h1", {
 className: "text-2xl font-extrabold text-navy-900", children:
              submitted ? verificationMethod === "otp" ? "Enter your Gmail code" : "Check your Gmail" : "Register to vote" 
}, void 0, false
            ),
            _jsxDEV("p", {
 className: "mt-1.5 max-w-sm text-sm text-navy-500", children:
              submitted ?
              verificationMethod === "otp" ?
              `We sent a 6-digit code to ${form.email}. Enter it below to create your password.` :
              `We sent a verification link to ${form.email}. Open it to create your password.` :
              "Start with three details. We’ll verify your Gmail first, then confirm your phone after you sign in." 
}, void 0, false
            )] 
}, void 0, true
          ),

          submitted ?
          _jsxDEV(Card, {
 className: "p-6 text-center sm:p-8", children: [
            _jsxDEV("div", {
 className: "mb-5 flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-left", children: [
              verificationMethod === "otp" ?
              _jsxDEV(KeyRound, { className: "h-5 w-5 flex-shrink-0 text-indigo-600" }, void 0, false) :
              _jsxDEV(Mail, { className: "h-5 w-5 flex-shrink-0 text-indigo-600" }, void 0, false),
              _jsxDEV("p", {
 className: "text-sm text-indigo-900", children:
                verificationMethod === "otp" ?
                _jsxDEV(_Fragment, { children: ["The code expires in ", _jsxDEV("strong", { children: "10 minutes" }, void 0, false), ". Your pending registration remains available for ", _jsxDEV("strong", { children: "24 hours" }, void 0, false), "."] }, void 0, true) :
                _jsxDEV(_Fragment, { children: ["The link is valid for ", _jsxDEV("strong", { children: "24 hours" }, void 0, false), ". Your pending registration is automatically deleted if email and phone verification are not completed within that window."] }, void 0, true
                ) 
}, void 0, false
              )] 
}, void 0, true
            ),
            verificationMethod === "otp" ?
            _jsxDEV("form", {
 onSubmit: handleEmailOtp, className: "flex flex-col gap-3", children: [
              _jsxDEV("input", {
                type: "text",
                inputMode: "numeric",
                autoComplete: "one-time-code",
                maxLength: 6,
                required: true,
                value: emailOtp,
                onChange: (event) => {return setEmailOtp(event.target.value.replace(/\D/g, "").slice(0, 6));},
                placeholder: "Enter 6-digit code",
                className: "focus-ring w-full rounded-lg border border-navy-200 bg-white px-3.5 py-3 text-center font-mono text-lg tracking-widest text-navy-900" 
}, void 0, false
              ),
              _jsxDEV(Button, { type: "submit", loading: loading, fullWidth: true, disabled: emailOtp.length !== 6, children: "Verify Gmail and continue" }, void 0, false

              ),
              _jsxDEV("button", {
                type: "button",
                onClick: () => {return switchVerificationMethod("link");},
                disabled: resending,
                className: "text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50", children:

                resending ? "Sending…" : "Use a verification link instead" 
}, void 0, false
              )] 
}, void 0, true
            ) :

            _jsxDEV(_Fragment, {
 children: [
              _jsxDEV("p", { className: "text-xs text-navy-500", children: "Check your inbox and spam folder if the message does not appear shortly." }, void 0, false

              ),
              _jsxDEV("button", {
                type: "button",
                onClick: () => {return switchVerificationMethod("otp");},
                disabled: resending,
                className: "mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50", children:

                resending ? "Sending…" : "Use a verification code instead" 
}, void 0, false
              )] 
}, void 0, true
            ),

            _jsxDEV("button", {
              type: "button",
              onClick: () => {setSubmitted(false);setEmailOtp("");setForm({ fullName: "", email: "", dob: "" });},
              className: "mt-5 text-sm font-semibold text-indigo-600 hover:text-indigo-800", children:
              "Use a different Gmail address" 
}, void 0, false

            )] 
}, void 0, true
          ) :

          _jsxDEV(Card, {
 className: "p-6 sm:p-8", children:
            _jsxDEV("form", {
 onSubmit: handleSubmit, className: "flex flex-col gap-4", children: [
              _jsxDEV("div", {
 className: "flex flex-col gap-1.5", children: [
                _jsxDEV("label", {
 className: "flex items-center gap-1.5 text-sm font-medium text-navy-700", children: [
                  _jsxDEV(User, { className: "h-3.5 w-3.5 text-navy-400" }, void 0, false), "Full name"] 
}, void 0, true

                ),
                _jsxDEV("input", {
                  type: "text",
                  required: true,
                  autoComplete: "name",
                  value: form.fullName,
                  onChange: (event) => {return update("fullName", event.target.value);},
                  placeholder: "Your full name",
                  className: "focus-ring w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300" 
}, void 0, false
                )] 
}, void 0, true
              ),

              _jsxDEV(TextField, {
                label: "Gmail address",
                type: "email",
                autoComplete: "email",
                required: true,
                value: form.email,
                onChange: (event) => {return update("email", event.target.value);},
                placeholder: "you@gmail.com" 
}, void 0, false
              ),

              _jsxDEV("div", {
 className: "flex flex-col gap-1.5", children: [
                _jsxDEV("label", {
 className: "flex items-center gap-1.5 text-sm font-medium text-navy-700", children: [
                  _jsxDEV(Calendar, { className: "h-3.5 w-3.5 text-navy-400" }, void 0, false), "Date of birth"] 
}, void 0, true

                ),
                _jsxDEV("input", {
                  type: "date",
                  required: true,
                  max: MAX_DOB,
                  value: form.dob,
                  onChange: (event) => {return update("dob", event.target.value);},
                  className: "focus-ring w-full rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900" 
}, void 0, false
                ),
                _jsxDEV("p", { className: "text-xs text-navy-400", children: "Must be at least 16 years old" }, void 0, false)] 
}, void 0, true
              ),

              _jsxDEV(Button, { type: "submit", loading: loading, fullWidth: true, className: "mt-2", children: "Send Gmail code" }, void 0, false

              )] 
}, void 0, true
            ) 
}, void 0, false
          ),

          _jsxDEV("p", {
 className: "mt-4 text-center text-sm text-navy-400", children: ["Already registered?",
            " ",
            _jsxDEV(Link, { to: "/login", className: "font-semibold text-indigo-600 hover:text-indigo-800 transition-colors", children: "Sign in" }, void 0, false

            )] 
}, void 0, true
          ),
          _jsxDEV("div", {
 className: "mt-6 flex items-center justify-center gap-2 text-xs text-navy-500", children: [
            _jsxDEV(ShieldCheck, { className: "h-3.5 w-3.5 text-gold-400" }, void 0, false),
            _jsxDEV("span", { children: "Your registration details are protected" }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true
        ) 
}, void 0, false
      )] 
}, void 0, true
    ));

}