import { useState } from "react";
import { ShieldCheck, Fingerprint, KeyRound, X, AlertCircle } from "lucide-react";
import { runAdminBiometricAuth } from "../../lib/webauthn";
import { apiClient } from "../../lib/apiClient";
import { formatError } from "../../lib/formatError";
import { Button } from "../shared/Button";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function AdminAuthModal({
  open,
  title = "Confirm action",
  description,
  onConfirm,
  onClose
}) {
  const [tab, setTab] = useState("biometric");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!open) {return null;}

  function reset() {
    setPin("");
    setError(null);
    setLoading(false);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleBiometric() {
    setError(null);
    setLoading(true);
    try {

      await runAdminBiometricAuth();
      await onConfirm();
      handleClose();
    } catch (err) {
      const msg = formatError(err, "Biometric authentication failed");

      if (
      msg.includes("NotAllowedError") ||
      msg.toLowerCase().includes("cancelled") ||
      msg.toLowerCase().includes("not allowed"))
      {
        setError("Authentication cancelled — please try again.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handlePin() {
    if (!/^\d{6}$/.test(pin)) {
      setError("PIN must be exactly 6 digits");
      return;
    }
    setError(null);
    setLoading(true);
    try {

      await apiClient.post("/auth/session-pin", { pin });
      await onConfirm();
      handleClose();
    } catch (err) {
      setError(formatError(err, "PIN verification failed"));
    } finally {
      setLoading(false);
    }
  }

  return (

    _jsxDEV("div", {
      className: "fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center",
      onClick: (e) => {if (e.target === e.currentTarget) {handleClose();}}, children:

      _jsxDEV("div", {
 className: "relative max-h-[85dvh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-xl dark:bg-navy-900 sm:rounded-2xl", children: [

        _jsxDEV("button", {
          type: "button",
          onClick: handleClose,
          className: "absolute right-4 top-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-white",
          "aria-label": "Close", children:

          _jsxDEV(X, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
        ),

        _jsxDEV("div", {
 className: "mb-5 flex items-start gap-3", children: [
          _jsxDEV("span", {
 className: "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-500 dark:bg-gold-400/10", children:
            _jsxDEV(ShieldCheck, { className: "h-5 w-5" }, void 0, false) 
}, void 0, false
          ),
          _jsxDEV("div", {
 children: [
            _jsxDEV("h2", { className: "text-base font-semibold text-gray-900 dark:text-white", children: title }, void 0, false),
            description &&
            _jsxDEV("p", { className: "mt-0.5 text-sm text-gray-500 dark:text-navy-300", children: description }, void 0, false)] 
}, void 0, true

          )] 
}, void 0, true
        ),

        _jsxDEV("div", {
 className: "mb-5 flex rounded-xl border border-gray-200 p-1 dark:border-navy-700", children: [
          _jsxDEV(TabBtn, {
            icon: _jsxDEV(Fingerprint, { className: "h-4 w-4" }, void 0, false),
            label: "Biometric",
            active: tab === "biometric",
            onClick: () => {setTab("biometric");reset();} 
}, void 0, false
          ),
          _jsxDEV(TabBtn, {
            icon: _jsxDEV(KeyRound, { className: "h-4 w-4" }, void 0, false),
            label: "Login PIN",
            active: tab === "pin",
            onClick: () => {setTab("pin");reset();} 
}, void 0, false
          )] 
}, void 0, true
        ),

        tab === "biometric" &&
        _jsxDEV("div", {
 className: "flex flex-col gap-4", children: [
          _jsxDEV("div", {
 className: "flex flex-col items-center justify-center gap-3 rounded-xl bg-gray-50 py-8 dark:bg-navy-800", children: [
            _jsxDEV(Fingerprint, { className: "h-14 w-14 text-navy-400 dark:text-navy-300", strokeWidth: 1.25 }, void 0, false),
            _jsxDEV("p", {
 className: "text-center text-sm text-gray-500 dark:text-navy-300", children: ["Tap below — your device will prompt for",
              " ",
              _jsxDEV("strong", { className: "text-gray-700 dark:text-white", children: "fingerprint or face ID" }, void 0, false)] 
}, void 0, true
            )] 
}, void 0, true
          ),

          error && _jsxDEV(ErrorBanner, { message: error }, void 0, false),

          _jsxDEV(Button, {
            onClick: handleBiometric,
            disabled: loading,
            className: "w-full", children:

            loading ? "Waiting for biometric…" : "Confirm with biometric" 
}, void 0, false
          ),
          _jsxDEV("button", {
            type: "button",
            onClick: handleClose,
            className: "text-center text-sm text-gray-500 hover:text-gray-700 dark:text-navy-400 dark:hover:text-white", children:
            "Cancel" 
}, void 0, false

          )] 
}, void 0, true
        ),

        tab === "pin" &&
        _jsxDEV("div", {
 className: "flex flex-col gap-4", children: [
          _jsxDEV("div", {
 children: [
            _jsxDEV("label", { className: "mb-1.5 block text-sm font-medium text-gray-700 dark:text-navy-200", children: "Enter your 6-digit Login PIN" }, void 0, false

            ),
            _jsxDEV("input", {
              type: "password",
              inputMode: "numeric",
              maxLength: 6,
              value: pin,
              onChange: (e) => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPin(v);
                setError(null);
              },
              onKeyDown: (e) => {if (e.key === "Enter" && pin.length === 6) {handlePin();}},
              placeholder: "••••••",
              className: "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center text-2xl tracking-widest text-gray-900 shadow-sm outline-none focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 dark:border-navy-600 dark:bg-navy-800 dark:text-white dark:placeholder-navy-400",
              autoFocus: true,
              disabled: loading 
}, void 0, false
            ),
            _jsxDEV("p", { className: "mt-1.5 text-xs text-gray-400 dark:text-navy-400", children: "This is the same PIN you use to log in." }, void 0, false

            )] 
}, void 0, true
          ),

          error && _jsxDEV(ErrorBanner, { message: error }, void 0, false),

          _jsxDEV(Button, {
            onClick: handlePin,
            disabled: loading || pin.length !== 6,
            className: "w-full", children:

            loading ? "Verifying…" : "Confirm with PIN" 
}, void 0, false
          ),
          _jsxDEV("button", {
            type: "button",
            onClick: handleClose,
            className: "text-center text-sm text-gray-500 hover:text-gray-700 dark:text-navy-400 dark:hover:text-white", children:
            "Cancel" 
}, void 0, false

          )] 
}, void 0, true
        )] 
}, void 0, true

      ) 
}, void 0, false
    ));

}

function TabBtn({ icon, label, active, onClick }) {
  return (
    _jsxDEV("button", {
      type: "button",
      onClick: onClick,
      className: `flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition-colors ${
      active ?
      "bg-gold-400 text-navy-950 shadow-sm" :
      "text-gray-500 hover:text-gray-700 dark:text-navy-400 dark:hover:text-white"}`, children: [

      icon,
      label] 
}, void 0, true
    ));

}

function ErrorBanner({ message }) {
  return (
    _jsxDEV("div", {
 className: "flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400", children: [
      _jsxDEV(AlertCircle, { className: "mt-0.5 h-4 w-4 flex-shrink-0" }, void 0, false),
      _jsxDEV("span", { children: message }, void 0, false)] 
}, void 0, true
    ));

}