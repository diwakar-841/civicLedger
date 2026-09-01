import { HTMLAttributes, ReactNode } from "react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function Card({ className = "", children, ...rest }) {
  return (
    _jsxDEV("div", {
 className: `rounded-2xl border border-navy-100/90 bg-white shadow-card transition-all duration-200 dark:border-navy-800 dark:bg-navy-900 ${className}`, ...rest, children:
      children 
}, void 0, false
    ));

}