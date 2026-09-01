import { useState, FormEvent } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { TextField } from "../components/shared/Input";
import { apiClient } from "../lib/apiClient";
import { useToast } from "../contexts/ToastContext";
import { formatError } from "../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function ResetPasswordPage() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const { show } = useToast();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (password !== confirm) {
      show("Passwords do not match", "error");
      return;
    }
    setLoading(true);
    try {
      await apiClient.post("/auth/reset-password", { token, password });
      show("Password reset successfully. Please sign in.", "success");
      navigate("/login");
    } catch (err) {
      show(formatError(err, "Could not reset password. The link may have expired."), "error");
    } finally {
      setLoading(false);
    }
  }

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
 className: "mb-6 flex flex-col items-center text-center sm:mb-8", children: [
            _jsxDEV("span", {
 className: "mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gold-400 text-navy-950 sm:h-14 sm:w-14", children:
              _jsxDEV(ShieldCheck, { className: "h-6 w-6 sm:h-7 sm:w-7" }, void 0, false) 
}, void 0, false
            ),
            _jsxDEV("h1", { className: "text-xl font-bold text-white sm:text-2xl", children: "Choose a new password" }, void 0, false),
            _jsxDEV("p", { className: "mt-1 text-sm text-navy-300", children: "Must be at least 10 characters with upper, lower and a number" }, void 0, false)] 
}, void 0, true
          ),

          _jsxDEV(Card, {
 className: "p-6 sm:p-8", children:
            _jsxDEV("form", {
 onSubmit: handleSubmit, className: "flex flex-col gap-4", children: [
              _jsxDEV(TextField, {
                label: "New password",
                type: "password",
                autoComplete: "new-password",
                required: true,
                value: password,
                onChange: (e) => {return setPassword(e.target.value);} 
}, void 0, false
              ),
              _jsxDEV(TextField, {
                label: "Confirm password",
                type: "password",
                autoComplete: "new-password",
                required: true,
                value: confirm,
                onChange: (e) => {return setConfirm(e.target.value);} 
}, void 0, false
              ),
              _jsxDEV(Button, { type: "submit", loading: loading, fullWidth: true, className: "mt-1", children: "Set new password" }, void 0, false

              )] 
}, void 0, true
            ) 
}, void 0, false
          ),

          _jsxDEV("p", {
 className: "mt-6 text-center text-sm text-navy-300", children:
            _jsxDEV(Link, { to: "/login", className: "font-semibold text-gold-400 hover:text-gold-300", children: "Back to sign in" }, void 0, false

            ) 
}, void 0, false
          )] 
}, void 0, true
        ) 
}, void 0, false
      ) 
}, void 0, false
    ));

}