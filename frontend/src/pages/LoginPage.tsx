import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../components/shared/Button";
import { TextField } from "../components/shared/Input";
import { BiometricLoginModal } from "../components/auth/BiometricLoginModal";
import { apiClient } from "../lib/apiClient";
import { useAuthContext } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { formatError } from "../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

function StepDots({ step }) {
  const steps = ["credentials", "2fa"];
  const labels = ["Sign in", "2FA"];
  return (
    _jsxDEV("div", {
 className: "mb-5 flex items-center justify-center gap-2", children:
      steps.map((s, i) => {
        const done = steps.indexOf(step) > i;
        const active = step === s;
        return (
          _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
            _jsxDEV("div", {
 className: "flex flex-col items-center gap-1", children: [
              _jsxDEV("div", {
                className: `flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                active ?
                "bg-gold-400 text-navy-950 ring-4 ring-gold-400/20" :
                done ?
                "bg-green-500 text-white" :
                "bg-navy-700 text-navy-400"}`, children:

                done ? _jsxDEV(CheckCircle, { className: "h-3.5 w-3.5" }, void 0, false) : i + 1 
}, void 0, false
              ),
              _jsxDEV("span", {
 className: `text-[10px] font-medium ${active ? "text-gold-400" : done ? "text-green-400" : "text-navy-500"}`, children:
                labels[i] 
}, void 0, false
              )] 
}, void 0, true
            ),
            i < steps.length - 1 &&
            _jsxDEV("div", { className: `mb-4 h-px w-10 transition-colors duration-300 ${done ? "bg-green-500" : "bg-navy-700"}` }, void 0, false)] 
}, s, true

          ));

      }) 
}, void 0, false
    ));

}

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState("credentials");
  const [challengeToken, setChallengeToken] = useState("");
  const [loginToken, setLoginToken] = useState("");
  const [code, setCode] = useState("");
  const [useRecovery, setUseRecovery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const { login } = useAuthContext();
  const { show } = useToast();
  const navigate = useNavigate();

  function handleLoginResult(
  data)
  {
    if ("twoFactorRequired" in data) {
      setChallengeToken(data.challengeToken);
      setStep("2fa");
      return;
    }

    if ("biometricLoginRequired" in data) {
      setLoginToken(data.loginToken);
      setShowBioModal(true);
      return;
    }

    if ("kycRequired" in data) {

      sessionStorage.setItem("kycToken", data.kycToken);
      navigate("/kyc");
      return;
    }

    const resp = data;
    login(resp.user, resp.accessToken);
    navigate(resp.user.role === "admin" ? "/admin" : "/elections");
  }

  async function handleCredentials(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post(

        "/auth/login", { email, password });
      handleLoginResult(data);
    } catch (err) {
      show(formatError(err, "Invalid email or password"), "error");
    } finally {
      setLoading(false);
    }
  }

  async function handle2FA(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        "/auth/login/2fa",
        { challengeToken, code: code.trim() }
      );
      handleLoginResult(data);
    } catch (err) {
      show(formatError(err, "Invalid verification code"), "error");
      setCode("");
    } finally {
      setLoading(false);
    }
  }

  function handleBiometricSuccess(user, accessToken) {
    setShowBioModal(false);
    login(user, accessToken);
    show(`Welcome back, ${user.fullName.split(" ")[0]}!`, "success");
    navigate(user.role === "admin" ? "/admin" : "/elections");
  }

  return (
    _jsxDEV("div", {
 className: "relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 sm:px-6", children: [
      _jsxDEV("div", { className: "pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl" }, void 0, false),
      _jsxDEV("div", { className: "pointer-events-none absolute -bottom-40 -right-32 h-96 w-96 rounded-full bg-teal-200/40 blur-3xl" }, void 0, false),
      _jsxDEV("div", {
 className: "w-full max-w-md", children: [

        _jsxDEV(motion.div, {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
          className: "mb-6 flex flex-col items-center text-center sm:mb-8", children: [

          _jsxDEV("span", {
 className: "mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-600/25", children:
            _jsxDEV(ShieldCheck, { className: "h-7 w-7" }, void 0, false) 
}, void 0, false
          ),
          _jsxDEV("h1", { className: "text-2xl font-extrabold text-navy-900", children: "Sign in to Civic Ledger" }, void 0, false),
          _jsxDEV("p", { className: "mt-1.5 text-sm text-navy-500", children: "Secure, verifiable, transparent voting" }, void 0, false)] 
}, void 0, true
        ),

        step === "2fa" && _jsxDEV(StepDots, { step: step }, void 0, false),

        _jsxDEV(AnimatePresence, {
 mode: "wait", children: [

          step === "credentials" &&
          _jsxDEV(motion.div, {

            initial: { opacity: 0, x: -20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: 20 },
            transition: { duration: 0.3 }, children: [

            _jsxDEV("div", {
 className: "px-1 py-2 sm:px-3 sm:py-4", children:
              _jsxDEV("form", {
 onSubmit: handleCredentials, className: "flex flex-col gap-4", children: [
                _jsxDEV(TextField, {
                  label: "Email address",
                  type: "email",
                  autoComplete: "email",
                  required: true,
                  value: email,
                  onChange: (e) => {return setEmail(e.target.value);},
                  placeholder: "you@example.com" 
}, void 0, false
                ),

                _jsxDEV("div", {
 className: "flex flex-col gap-1.5", children: [
                  _jsxDEV("label", { className: "text-sm font-medium text-navy-700", children: "Password" }, void 0, false),
                  _jsxDEV("div", {
 className: "relative", children: [
                    _jsxDEV("input", {
                      type: showPassword ? "text" : "password",
                      autoComplete: "current-password",
                      required: true,
                      value: password,
                      onChange: (e) => {return setPassword(e.target.value);},
                      placeholder: "Your password",
                      className: "focus-ring w-full rounded-xl border border-navy-200 bg-white px-3.5 py-3 pr-10 text-sm text-navy-900 placeholder:text-navy-300 shadow-sm" 
}, void 0, false
                    ),
                    _jsxDEV("button", {
                      type: "button",
                      onClick: () => {return setShowPassword((v) => {return !v;});},
                      className: "absolute inset-y-0 right-0 flex items-center pr-3 text-navy-400 hover:text-navy-600 transition-colors",
                      "aria-label": showPassword ? "Hide password" : "Show password", children:

                      showPassword ? _jsxDEV(EyeOff, { className: "h-4 w-4" }, void 0, false) : _jsxDEV(Eye, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
                    )] 
}, void 0, true
                  )] 
}, void 0, true
                ),

                _jsxDEV("div", {
 className: "flex justify-end", children:
                  _jsxDEV(Link, {
                    to: "/forgot-password",
                    className: "text-xs font-medium text-navy-400 hover:text-gold-400 transition-colors", children:
                    "Forgot password?" 
}, void 0, false

                  ) 
}, void 0, false
                ),

                _jsxDEV(Button, { type: "submit", loading: loading, fullWidth: true, children: "Continue" }, void 0, false

                )] 
}, void 0, true
              ) 
}, void 0, false
            ),

            _jsxDEV("div", {
 className: "mt-4 px-2 py-2", children:
              _jsxDEV("p", {
 className: "text-center text-xs leading-5 text-navy-500", children: [
                _jsxDEV("span", { className: "font-bold text-indigo-700", children: "First sign-in?" }, void 0, false), " You'll verify your phone number and date of birth, then confirm the phone OTP to finish setup."] 
}, void 0, true

              ) 
}, void 0, false
            ),

            _jsxDEV("p", {
 className: "mt-4 text-center text-sm text-navy-400", children: ["Don't have an account?",
              " ",
              _jsxDEV(Link, { to: "/register", className: "font-semibold text-gold-400 hover:text-gold-300 transition-colors", children: "Register to vote" }, void 0, false

              )] 
}, void 0, true
            )] 
}, "credentials", true
          ),

          step === "2fa" &&
          _jsxDEV(motion.div, {

            initial: { opacity: 0, x: 20 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: -20 },
            transition: { duration: 0.3 }, children:

            _jsxDEV("div", {
 className: "px-1 py-2 sm:px-3 sm:py-4", children: [
              _jsxDEV("div", {
 className: "mb-5 text-center", children: [
                _jsxDEV("h2", { className: "text-base font-semibold text-navy-900", children: "Two-factor authentication" }, void 0, false),
                _jsxDEV("p", {
 className: "mt-1 text-sm text-navy-500", children:
                  useRecovery ?
                  "Enter one of your saved recovery codes" :
                  "Enter the 6-digit code from your authenticator app" 
}, void 0, false
                )] 
}, void 0, true
              ),

              _jsxDEV("form", {
 onSubmit: handle2FA, className: "flex flex-col gap-4", children: [
                _jsxDEV(TextField, {
                  label: useRecovery ? "Recovery code" : "Authentication code",
                  autoComplete: "one-time-code",
                  inputMode: useRecovery ? "text" : "numeric",
                  maxLength: useRecovery ? 32 : 6,
                  required: true,
                  value: code,
                  onChange: (e) =>
                  {return setCode(useRecovery ? e.target.value : e.target.value.replace(/\D/g, ""));},

                  placeholder: useRecovery ? "xxxxxxxx-xxxx" : "000000" 
}, void 0, false
                ),
                _jsxDEV(Button, { type: "submit", loading: loading, fullWidth: true, children: "Verify and continue" }, void 0, false

                )] 
}, void 0, true
              ),

              _jsxDEV("div", {
 className: "mt-5 flex flex-col items-center gap-2", children: [
                _jsxDEV("button", {
                  type: "button",
                  onClick: () => {setUseRecovery((v) => {return !v;});setCode("");},
                  className: "text-xs font-medium text-navy-400 hover:text-gold-400 transition-colors", children:

                  useRecovery ? "Use authenticator app instead" : "Use a recovery code instead" 
}, void 0, false
                ),
                _jsxDEV("button", {
                  type: "button",
                  onClick: () => {setStep("credentials");setCode("");setChallengeToken("");},
                  className: "text-xs text-navy-500 hover:text-navy-400 transition-colors", children:
                  "← Back to sign in" 
}, void 0, false

                )] 
}, void 0, true
              )] 
}, void 0, true
            ) 
}, "2fa", false
          )] 
}, void 0, true

        ),

        _jsxDEV(motion.div, {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: 0.4 },
          className: "mt-6 flex items-center justify-center gap-2 text-xs text-navy-500", children: [

          _jsxDEV(ShieldCheck, { className: "h-3.5 w-3.5 text-gold-400" }, void 0, false),
          _jsxDEV("span", { children: "Protected by end-to-end encryption" }, void 0, false)] 
}, void 0, true
        )] 
}, void 0, true
      ),

      showBioModal &&
      _jsxDEV(BiometricLoginModal, {
        loginToken: loginToken,
        onSuccess: handleBiometricSuccess,
        onCancel: () => {return setShowBioModal(false);} 
}, void 0, false
      )] 
}, void 0, true

    ));

}