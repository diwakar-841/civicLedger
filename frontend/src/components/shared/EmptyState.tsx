import { ReactNode } from "react";
import { Inbox } from "lucide-react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function EmptyState({
  title,
  description,
  icon,
  action

}) {
  return (
    _jsxDEV("div", {
 className: "flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-indigo-200 bg-white/80 px-6 py-20 text-center shadow-sm", children: [
      _jsxDEV("div", {
 className: "flex h-12 w-12 items-center justify-center rounded-full bg-navy-100 text-navy-400", children:
        icon ?? _jsxDEV(Inbox, { className: "h-6 w-6" }, void 0, false) 
}, void 0, false
      ),
      _jsxDEV("h3", { className: "text-base font-semibold text-navy-800", children: title }, void 0, false),
      description && _jsxDEV("p", { className: "max-w-sm text-sm text-navy-500", children: description }, void 0, false),
      action] 
}, void 0, true
    ));

}