import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../components/shared/Card";
import { Spinner } from "../components/shared/Spinner";
import { apiClient } from "../lib/apiClient";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function VerifyEmailPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("loading");
  const [setPasswordToken, setSetPasswordToken] = useState("");
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) {return;}
    hasStarted.current = true;
    if (!token) {setStatus("error");return;}
    let redirectTimer;
    apiClient.
    get(`/auth/verify-email/${token}`).
    then(({ data }) => {
      setSetPasswordToken(data.setPasswordToken);
      setStatus("success");
      redirectTimer = window.setTimeout(() => {
        navigate(`/register/complete?token=${encodeURIComponent(data.setPasswordToken)}`, { replace: true });
      }, 900);
    }).
    catch(() => {return setStatus("error");});
    return () => {
      if (redirectTimer) {window.clearTimeout(redirectTimer);}
    };
  }, [navigate, token]);

  return (
    _jsxDEV("div", {
 className: "flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10 sm:px-6", children:
      _jsxDEV("div", {
 className: "w-full max-w-md", children:
        _jsxDEV(motion.div, {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }, children: [

          _jsxDEV("div", {
 className: "mb-6 flex flex-col items-center text-center", children: [
            _jsxDEV("span", {
 className: "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 text-navy-950", children:
              _jsxDEV(ShieldCheck, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
            ),
            _jsxDEV("h1", { className: "text-xl font-bold text-white sm:text-2xl", children: "Email Verification" }, void 0, false)] 
}, void 0, true
          ),

          _jsxDEV(Card, {
 className: "p-8 text-center", children: [
            status === "loading" && _jsxDEV(Spinner, { label: "Verifying your email" }, void 0, false),
            status === "success" &&
            _jsxDEV("div", {
 className: "flex flex-col items-center gap-4", children: [
              _jsxDEV("span", {
 className: "flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600", children:
                _jsxDEV(CheckCircle2, { className: "h-8 w-8" }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("h2", { className: "text-lg font-semibold text-navy-900", children: "Email verified" }, void 0, false),
              _jsxDEV("p", { className: "text-sm text-navy-500", children: "Your Gmail address is confirmed. Redirecting you to create your password…" }, void 0, false),
              _jsxDEV(Link, { to: `/register/complete?token=${encodeURIComponent(setPasswordToken)}`, className: "mt-2 text-sm font-semibold text-gold-500 hover:text-gold-600", children: "Continue" }, void 0, false

              )] 
}, void 0, true
            ),

            status === "error" &&
            _jsxDEV("div", {
 className: "flex flex-col items-center gap-4", children: [
              _jsxDEV("span", {
 className: "flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600", children:
                _jsxDEV(XCircle, { className: "h-8 w-8" }, void 0, false) 
}, void 0, false
              ),
              _jsxDEV("h2", { className: "text-lg font-semibold text-navy-900", children: "Verification failed" }, void 0, false),
              _jsxDEV("p", { className: "text-sm text-navy-500", children: "This link is invalid or has expired. Pending registrations are removed after 24 hours, after which you can start again." }, void 0, false),
              _jsxDEV(Link, { to: "/register", className: "mt-2 text-sm font-semibold text-gold-500 hover:text-gold-600", children: "Start registration again" }, void 0, false

              )] 
}, void 0, true
            )] 
}, void 0, true

          )] 
}, void 0, true
        ) 
}, void 0, false
      ) 
}, void 0, false
    ));

}