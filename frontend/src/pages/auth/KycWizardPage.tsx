import { useState, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle, Mail, Phone, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { TextField } from "../../components/shared/Input";
import { apiClient } from "../../lib/apiClient";
import { useAuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function StepDots({ step }) {
  const steps = ["identity", "otp"];
  const labels = ["Phone + DOB", "Verify phone"];
  const activeIndex = steps.indexOf(step);
  return (
    _jsxDEV("div", {
 className: "mb-6 flex items-center justify-center gap-2", children:
      steps.map((s, index) => {
        const done = activeIndex > index;
        const active = activeIndex === index;
        return (
          _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
            _jsxDEV("div", {
 className: "flex flex-col items-center gap-1", children: [
              _jsxDEV("div", {
                className: `flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                active ?
                "bg-indigo-600 text-white ring-4 ring-indigo-600/20" :
                done ?
                "bg-emerald-500 text-white" :
                "bg-navy-100 text-navy-400"}`, children:

                done ? _jsxDEV(CheckCircle, { className: "h-4 w-4" }, void 0, false) : index + 1 
}, void 0, false
              ),
              _jsxDEV("span", {
                className: `text-[10px] font-medium ${
                active ? "text-indigo-600" : done ? "text-emerald-600" : "text-navy-400"}`, children:

                labels[index] 
}, void 0, false
              )] 
}, void 0, true
            ),
            index === 0 && _jsxDEV("div", { className: `mb-4 h-px w-10 ${done ? "bg-emerald-500" : "bg-navy-200"}` }, void 0, false)] 
}, s, true
          ));

      }) 
}, void 0, false
    ));

}

export function KycWizardPage() {
  const [step, setStep] = useState("identity");
  const [kycToken, setKycToken] = useState("");
  const [phone, setPhone] = useState("");
  const [dob, setDob] = useState("");
  const [otp, setOtp] = useState("");
  const [devOtp, setDevOtp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const { login } = useAuthContext();
  const { show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("kycToken");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    setKycToken(token);
  }, [navigate]);

  useEffect(() => {
    if (resendCountdown <= 0) {return;}
    const timer = window.setTimeout(() => {return setResendCountdown((current) => {return current - 1;});}, 1000);
    return () => {return window.clearTimeout(timer);};
  }, [resendCountdown]);

  async function handleIdentity(event) {
    event.preventDefault();
    if (!kycToken) {return;}
    if (!/^\d{10}$/.test(phone)) {
      show("Please enter your 10-digit phone number", "error");
      return;
    }
    if (!dob) {
      show("Please select your date of birth", "error");
      return;
    }

    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/kyc/verify-identity", {
        kycToken,
        phone: `+91${phone}`,
        dob
      });
      setKycToken(data.kycToken);
      sessionStorage.setItem("kycToken", data.kycToken);
      setStep("otp");
      setResendCountdown(60);
      setDevOtp(data.devOtp ?? null);
      show(
        data.devOtp ?
        "Couldn't send a real text — showing the code below for local testing" :
        "A verification code has been sent to your phone",
        data.devOtp ? "info" : "success"
      );
    } catch (error) {
      show(formatError(error, "Identity verification failed"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handleOtp(event) {
    event.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post("/auth/kyc/verify-otp", { kycToken, otp });
      sessionStorage.removeItem("kycToken");
      login(data.user, data.accessToken);
      show("Your account is fully verified", "success");
      navigate(data.user.role === "admin" ? "/admin" : "/home", { replace: true });
    } catch (error) {
      show(formatError(error, "Invalid verification code"), "error");
      setOtp("");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      const { data } = await apiClient.post(
        "/auth/kyc/resend-otp",
        { kycToken }
      );
      setOtp("");
      setResendCountdown(60);
      setDevOtp(data.devOtp ?? null);
      show(
        data.devOtp ?
        "Couldn't send a real text — showing the code below for local testing" :
        "A new verification code has been sent to your phone",
        data.devOtp ? "info" : "success"
      );
    } catch (error) {
      show(formatError(error, "Could not resend the code"), "error");
    } finally {
      setResending(false);
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
 initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.45 }, children: [
          _jsxDEV("div", {
 className: "mb-6 flex flex-col items-center text-center sm:mb-8", children: [
            _jsxDEV("span", {
 className: "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25", children:
              step === "otp" ? _jsxDEV(Mail, { className: "h-7 w-7" }, void 0, false) : _jsxDEV(ShieldCheck, { className: "h-7 w-7" }, void 0, false) 
}, void 0, false
            ),
            _jsxDEV("h1", {
 className: "text-2xl font-extrabold text-navy-900", children:
              step === "identity" ? "Finish your identity check" : "Verify your phone" 
}, void 0, false
            ),
            _jsxDEV("p", {
 className: "mt-1.5 max-w-xs text-sm text-navy-500", children:
              step === "identity" ?
              "Use the phone number and DOB from your registration." :
              "Enter the 6-digit code sent to your phone." 
}, void 0, false
            )] 
}, void 0, true
          ),

          _jsxDEV(StepDots, { step: step }, void 0, false),

          _jsxDEV(AnimatePresence, {
 mode: "wait", children:
            step === "identity" ?
            _jsxDEV(motion.div, {
 initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: -20 }, children:
              _jsxDEV(Card, {
 className: "p-6 sm:p-8", children:
                _jsxDEV("form", {
 onSubmit: handleIdentity, className: "flex flex-col gap-4", children: [
                  _jsxDEV("div", {
 className: "flex flex-col gap-1.5", children: [
                    _jsxDEV("label", {
 className: "flex items-center gap-1.5 text-sm font-medium text-navy-700", children: [
                      _jsxDEV(Phone, { className: "h-3.5 w-3.5 text-navy-400" }, void 0, false), "Phone number"] 
}, void 0, true

                    ),
                    _jsxDEV("div", {
 className: "flex gap-2", children: [
                      _jsxDEV("span", { className: "flex items-center rounded-lg border border-navy-200 bg-navy-50 px-3 text-sm text-navy-500", children: "+91" }, void 0, false),
                      _jsxDEV("input", {
                        type: "tel",
                        inputMode: "numeric",
                        autoComplete: "tel",
                        maxLength: 10,
                        required: true,
                        value: phone,
                        onChange: (event) => {return setPhone(event.target.value.replace(/\D/g, "").slice(0, 10));},
                        placeholder: "10-digit mobile number",
                        className: "focus-ring flex-1 rounded-lg border border-navy-200 bg-white px-3.5 py-2.5 text-sm text-navy-900 placeholder:text-navy-300" 
}, void 0, false
                      )] 
}, void 0, true
                    ),
                    _jsxDEV("p", { className: "text-xs text-navy-400", children: "This number can only belong to one account." }, void 0, false)] 
}, void 0, true
                  ),

                  _jsxDEV(TextField, {
                    label: "Date of birth",
                    type: "date",
                    required: true,
                    value: dob,
                    onChange: (event) => {return setDob(event.target.value);},
                    hint: "Must match the date entered during registration" 
}, void 0, false
                  ),

                  _jsxDEV(Button, { type: "submit", loading: loading, fullWidth: true, className: "mt-2", disabled: !/^\d{10}$/.test(phone) || !dob, children: "Verify details & send code" }, void 0, false

                  )] 
}, void 0, true
                ) 
}, void 0, false
              ) 
}, "identity", false
            ) :

            _jsxDEV(motion.div, {
 initial: { opacity: 0, x: 20 }, animate: { opacity: 1, x: 0 }, exit: { opacity: 0, x: 20 }, children:
              _jsxDEV(Card, {
 className: "p-6 sm:p-8", children: [
                _jsxDEV("div", {
 className: "mb-5 flex items-start gap-3 rounded-xl border border-gold-100 bg-gold-50 p-3.5", children: [
                  _jsxDEV(Mail, { className: "mt-0.5 h-4 w-4 flex-shrink-0 text-gold-500" }, void 0, false),
                  _jsxDEV("p", {
 className: "text-xs leading-relaxed text-navy-600", children: ["We sent a ",
                    _jsxDEV("strong", { children: "6-digit code" }, void 0, false), " to +91 ", phone, ". It expires in ", _jsxDEV("strong", { children: "10 minutes" }, void 0, false), "."] 
}, void 0, true
                  )] 
}, void 0, true
                ),
                devOtp &&
                _jsxDEV("div", {
 className: "mb-5 rounded-xl border border-amber-200 bg-amber-50 p-3.5", children: [
                  _jsxDEV("p", { className: "text-xs font-medium text-amber-800", children: "The code couldn't actually be texted to your phone (SMS isn't set up, or the SMS provider rejected the request)." }, void 0, false

                  ),
                  _jsxDEV("p", {
 className: "mt-1 text-xs text-amber-700", children: ["Your verification code is",
                    " ",
                    _jsxDEV("span", { className: "font-mono text-sm font-bold tracking-widest", children: devOtp }, void 0, false), ". This is only shown because real delivery failed (dev mode)."] 
}, void 0, true

                  )] 
}, void 0, true
                ),

                _jsxDEV("form", {
 onSubmit: handleOtp, className: "flex flex-col gap-3", children: [
                  _jsxDEV("div", {
 className: "flex flex-col gap-1.5", children: [
                    _jsxDEV("label", { className: "text-sm font-medium text-navy-700", children: "Phone verification code" }, void 0, false),
                    _jsxDEV("input", {
                      type: "text",
                      inputMode: "numeric",
                      autoComplete: "one-time-code",
                      maxLength: 6,
                      required: true,
                      value: otp,
                      onChange: (event) => {return setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));},
                      placeholder: "Enter 6-digit code",
                      className: "focus-ring w-full rounded-lg border border-navy-200 bg-white px-3.5 py-3 text-center font-mono text-lg tracking-widest text-navy-900" 
}, void 0, false
                    )] 
}, void 0, true
                  ),
                  _jsxDEV(Button, { type: "submit", loading: loading, fullWidth: true, disabled: otp.length !== 6, children: "Verify phone & finish" }, void 0, false

                  )] 
}, void 0, true
                ),
                _jsxDEV("div", {
 className: "mt-5 flex flex-col items-center gap-2", children: [
                  _jsxDEV("button", {
                    type: "button",
                    onClick: handleResend,
                    disabled: resending || resendCountdown > 0,
                    className: "text-sm font-semibold text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50", children:

                    resending ? "Sending…" : resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : "Resend code" 
}, void 0, false
                  ),
                  _jsxDEV("button", {
                    type: "button",
                    onClick: () => {setStep("identity");setOtp("");setDevOtp(null);},
                    className: "text-xs text-navy-400 hover:text-navy-600", children:
                    "← Change phone number" 
}, void 0, false

                  )] 
}, void 0, true
                )] 
}, void 0, true
              ) 
}, "otp", false
            ) 
}, void 0, false

          )] 
}, void 0, true
        ) 
}, void 0, false
      )] 
}, void 0, true
    ));

}