import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const VARIANTS = {
  primary: "bg-indigo-600 text-white shadow-sm shadow-indigo-600/20 hover:bg-indigo-700 hover:shadow-md disabled:bg-navy-300",
  secondary: "bg-teal-400 text-slate-950 shadow-sm shadow-teal-400/20 hover:bg-teal-300 disabled:bg-teal-100 disabled:text-navy-500",
  ghost: "bg-transparent text-navy-700 hover:bg-indigo-50 hover:text-indigo-700 disabled:text-navy-300 dark:text-navy-200 dark:hover:bg-navy-800",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300"
};

const SIZES = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-base"
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
{ variant = "primary", size = "md", loading, fullWidth, className = "", disabled, children, ...rest },
ref)
{
  return (
    _jsxDEV("button", {
      ref: ref,
      disabled: disabled || loading,
      className: `focus-ring inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`, ...
      rest, children: [

      loading && _jsxDEV(Loader2, { className: "h-4 w-4 animate-spin" }, void 0, false),
      children] 
}, void 0, true
    ));

});