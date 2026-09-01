import { Loader2 } from "lucide-react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function Spinner({ label = "Loading" }) {
  return (
    _jsxDEV("div", {
 className: "flex flex-col items-center justify-center gap-3 py-16 text-navy-400", children: [
      _jsxDEV("div", { className: "relative", children: _jsxDEV(Loader2, { className: "h-8 w-8 animate-spin text-indigo-600" }, void 0, false) }, void 0, false),
      _jsxDEV("p", { className: "text-sm font-medium", children: [label, "..."] }, void 0, true)] 
}, void 0, true
    ));

}