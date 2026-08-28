import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
}

export const TextField = forwardRef<HTMLInputElement, FieldProps & InputHTMLAttributes<HTMLInputElement>>(
  function TextField({ label, error, hint, id, type = "text", className = "", ...rest }, ref) {
    const [visible, setVisible] = useState(false);
    const isPassword = type === "password";
    const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={fieldId} className="text-xs font-bold uppercase tracking-wide text-navy-500">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={fieldId}
            type={isPassword && visible ? "text" : type}
            className={`focus-ring w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-navy-900 placeholder:text-navy-300 shadow-sm transition-shadow ${
              error ? "border-red-400" : "border-navy-200"
            } ${isPassword ? "pr-10" : ""} ${className}`}
            aria-invalid={Boolean(error)}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-navy-400 hover:text-navy-600"
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {hint && !error && <p className="text-xs text-navy-400">{hint}</p>}
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }
);

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>
>(function TextAreaField({ label, error, hint, id, className = "", ...rest }, ref) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-xs font-bold uppercase tracking-wide text-navy-500">
        {label}
      </label>
      <textarea
        ref={ref}
        id={fieldId}
        className={`focus-ring w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-navy-900 placeholder:text-navy-300 shadow-sm transition-shadow ${
          error ? "border-red-400" : "border-navy-200"
        } ${className}`}
        {...rest}
      />
      {hint && !error && <p className="text-xs text-navy-400">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
});
