import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField({ label, error, hint, id, type = "text", className = "", ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    const isPassword = type === "password";
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      _jsxDEV("div", {
 className: "flex flex-col gap-1.5", children: [
        _jsxDEV("label", {
 htmlFor: fieldId, className: "text-xs font-bold uppercase tracking-wide text-navy-500", children:
          label 
}, void 0, false
        ),
        _jsxDEV("div", {
 className: "relative", children: [
          _jsxDEV("input", {
            ref: ref,
            id: fieldId,
            type: isPassword && visible ? "text" : type,
            className: `focus-ring w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-navy-900 placeholder:text-navy-300 shadow-sm transition-shadow ${
            error ? "border-red-400" : "border-navy-200"} ${
            isPassword ? "pr-10" : ""} ${className}`,
            "aria-invalid": Boolean(error), ...
            rest 
}, void 0, false
          ),
          isPassword &&
          _jsxDEV("button", {
            type: "button",
            onClick: () => {return setVisible((v) => {return !v;});},
            className: "absolute inset-y-0 right-0 flex items-center pr-3 text-navy-400 hover:text-navy-600",
            "aria-label": visible ? "Hide password" : "Show password", children:

            visible ? _jsxDEV(EyeOff, { className: "h-4 w-4" }, void 0, false) : _jsxDEV(Eye, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
          )] 
}, void 0, true

        ),
        hint && !error && _jsxDEV("p", { className: "text-xs text-navy-400", children: hint }, void 0, false),
        error && _jsxDEV("p", { className: "text-xs font-medium text-red-600", children: error }, void 0, false)] 
}, void 0, true
      ));

  }
);

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const TextAreaField = forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(

  function TextAreaField({ label, error, hint, id, className = "", ...rest }, ref) {
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      _jsxDEV("div", {
 className: "flex flex-col gap-1.5", children: [
        _jsxDEV("label", {
 htmlFor: fieldId, className: "text-xs font-bold uppercase tracking-wide text-navy-500", children:
          label 
}, void 0, false
        ),
        _jsxDEV("textarea", {
          ref: ref,
          id: fieldId,
          className: `focus-ring w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-navy-900 placeholder:text-navy-300 shadow-sm transition-shadow ${
          error ? "border-red-400" : "border-navy-200"} ${
          className}`, ...
          rest 
}, void 0, false
        ),
        hint && !error && _jsxDEV("p", { className: "text-xs text-navy-400", children: hint }, void 0, false),
        error && _jsxDEV("p", { className: "text-xs font-medium text-red-600", children: error }, void 0, false)] 
}, void 0, true
      ));

  });