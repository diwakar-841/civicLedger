import { createContext, useCallback, useContext, useState, ReactNode } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const ToastContext = createContext(undefined);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info
};

const STYLES = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  info: "border-navy-200 bg-white text-navy-900"
};

const ICON_COLOR = {
  success: "text-emerald-600",
  error: "text-red-600",
  info: "text-navy-500"
};

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => {return prev.filter((t) => {return t.id !== id;});});
  }, []);

  const show = useCallback(
    (message, kind = "info") => {
      const id = ++idCounter;
      setToasts((prev) => {return [...prev, { id, kind, message }];});
      setTimeout(() => {return dismiss(id);}, 5000);
    },
    [dismiss]
  );

  return (
    _jsxDEV(ToastContext.Provider, {
 value: { show }, children: [
      children,
      _jsxDEV("div", {
 className: "fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2", children:
        toasts.map((toast) => {
          const Icon = ICONS[toast.kind];
          return (
            _jsxDEV("div", {

              role: "status",
              className: `animate-slide-up flex items-start gap-3 rounded-xl border px-4 py-3 shadow-elevated ${STYLES[toast.kind]}`, children: [

              _jsxDEV(Icon, { className: `mt-0.5 h-5 w-5 flex-shrink-0 ${ICON_COLOR[toast.kind]}` }, void 0, false),
              _jsxDEV("p", { className: "flex-1 text-sm font-medium", children: toast.message }, void 0, false),
              _jsxDEV("button", {
                onClick: () => {return dismiss(toast.id);},
                className: "flex-shrink-0 rounded-md p-0.5 text-current/60 hover:text-current",
                "aria-label": "Dismiss", children:

                _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
              )] 
}, toast.id, true
            ));

        }) 
}, void 0, false
      )] 
}, void 0, true
    ));

}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {throw new Error("useToast must be used within ToastProvider");}
  return ctx;
}