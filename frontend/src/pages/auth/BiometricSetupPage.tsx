import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Fingerprint, ShieldCheck, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { runBiometricSetup, checkWebAuthnSupport } from "../../lib/webauthn";
import { useAuthContext } from "../../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function BiometricSetupPage() {
  const [phase, setPhase] = useState("biometric");
  const [setupToken, setSetupToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [webAuthnError, setWebAuthnError] = useState("");
  const { login } = useAuthContext();
  const { show } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem("setupToken");
    if (!token) {navigate("/login", { replace: true });return;}
    setSetupToken(token);

    try {
      checkWebAuthnSupport();
    } catch (err) {
      setWebAuthnError(err instanceof Error ? err.message : String(err));
    }
  }, [navigate]);

  async function handleRegister() {
    setLoading(true);
    try {
      const result = await runBiometricSetup(setupToken);
      sessionStorage.removeItem("setupToken");

      login(result.user, result.accessToken);
      setPhase("done");
      show("Biometric registered! Now set up your PINs.", "success");
      setTimeout(() => {return navigate("/pin-setup", { replace: true });}, 1000);
    } catch (err) {
      show(formatError(err, "Biometric registration failed — please try again"), "error");
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
              phase === "done" ?
              _jsxDEV(ShieldCheck, { className: "h-6 w-6 sm:h-7 sm:w-7" }, void 0, false) :
              _jsxDEV(Fingerprint, { className: "h-6 w-6 sm:h-7 sm:w-7" }, void 0, false) 
}, void 0, false

            ),
            _jsxDEV("h1", { className: "text-xl font-bold text-white sm:text-2xl", children: "Set up biometric auth" }, void 0, false),
            _jsxDEV("p", { className: "mt-1 text-sm text-navy-300", children: "Register your fingerprint or face ID — either can be used to sign in and vote" }, void 0, false

            )] 
}, void 0, true
          ),

          _jsxDEV("div", {
 className: "mb-6 flex items-center justify-center gap-1.5", children: [
            _jsxDEV("div", { className: `h-2 w-2 rounded-full transition-colors ${phase === "biometric" ? "bg-gold-400" : "bg-green-500"}` }, void 0, false),
            _jsxDEV("div", { className: "h-px w-6 bg-navy-700" }, void 0, false),
            _jsxDEV("div", { className: "h-2 w-2 rounded-full bg-navy-700" }, void 0, false),
            _jsxDEV("div", { className: "h-px w-6 bg-navy-700" }, void 0, false),
            _jsxDEV("div", { className: "h-2 w-2 rounded-full bg-navy-700" }, void 0, false)] 
}, void 0, true
          ),

          webAuthnError && phase !== "done" &&
          _jsxDEV(Card, {
 className: "p-6 sm:p-8", children:
            _jsxDEV("div", {
 className: "flex flex-col items-center gap-4 text-center", children: [
              _jsxDEV(AlertTriangle, { className: "h-10 w-10 text-amber-500" }, void 0, false),
              _jsxDEV("div", {
 children: [
                _jsxDEV("p", { className: "mb-2 text-sm font-semibold text-navy-800", children: "Biometric authentication unavailable" }, void 0, false

                ),
                _jsxDEV("p", { className: "text-xs text-navy-500", children: webAuthnError }, void 0, false)] 
}, void 0, true
              ),
              _jsxDEV("div", {
 className: "w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-xs text-amber-800", children: [
                _jsxDEV("strong", { children: "How to fix:" }, void 0, false), " The app must be served over ", _jsxDEV("code", { children: "https://" }, void 0, false), ". Make sure you are accessing it via ",
                _jsxDEV("strong", { children: "https://" }, void 0, false), "<your-IP>:5173 — not http://. If you see a browser security warning, tap ",
                _jsxDEV("em", { children: "Advanced → Proceed" }, void 0, false), "."] 
}, void 0, true
              )] 
}, void 0, true
            ) 
}, void 0, false
          ),

          !webAuthnError && phase === "biometric" &&
          _jsxDEV(Card, {
 className: "p-6 sm:p-8", children: [
            _jsxDEV("h2", { className: "mb-1 text-sm font-semibold text-navy-700", children: "Register your biometric" }, void 0, false),
            _jsxDEV("p", { className: "mb-5 text-xs text-navy-400", children: "Tap the button below. Your device will ask for your fingerprint or face ID — use whichever your phone supports." }, void 0, false

            ),
            _jsxDEV("div", {
 className: "mb-6 flex flex-col items-center gap-3 rounded-xl border border-navy-100 bg-navy-50 p-6", children: [
              _jsxDEV(Fingerprint, { className: "h-14 w-14 text-navy-400" }, void 0, false),
              _jsxDEV("p", {
 className: "text-center text-sm text-navy-600", children: ["Your device will prompt for ",
                _jsxDEV("strong", { children: "fingerprint or face ID" }, void 0, false), " — the app works with whichever your phone uses."] 
}, void 0, true
              )] 
}, void 0, true
            ),
            _jsxDEV(Button, {
 fullWidth: true, loading: loading, onClick: handleRegister, children:
              loading ? "Waiting for biometric…" : "Register biometric" 
}, void 0, false
            )] 
}, void 0, true
          ),

          phase === "done" &&
          _jsxDEV(Card, {
 className: "flex flex-col items-center gap-4 p-8", children: [
            _jsxDEV(ShieldCheck, { className: "h-14 w-14 text-green-500" }, void 0, false),
            _jsxDEV("p", { className: "text-center text-sm font-medium text-navy-700", children: "Biometric registered successfully!" }, void 0, false

            ),
            _jsxDEV("p", { className: "text-center text-xs text-navy-400", children: "Setting up your PINs next…" }, void 0, false)] 
}, void 0, true
          )] 
}, void 0, true

        ) 
}, void 0, false
      ) 
}, void 0, false
    ));

}