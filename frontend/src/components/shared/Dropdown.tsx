import { useEffect, useRef, useState, ReactNode } from "react";
import { MoreVertical } from "lucide-react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function Dropdown({ icon, label, align = "right", children }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {return;}

    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function handleEscape(e) {
      if (e.key === "Escape") {setOpen(false);}
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    _jsxDEV("div", {
 className: "relative", ref: containerRef, children: [
      _jsxDEV("button", {
        type: "button",
        onClick: () => {return setOpen((v) => {return !v;});},
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-label": label ?? "Open menu",
        title: label,
        className: "focus-ring flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-navy-400 hover:bg-navy-100 hover:text-navy-700 dark:text-navy-500 dark:hover:bg-navy-800 dark:hover:text-navy-200", children:

        icon ?? _jsxDEV(MoreVertical, { className: "h-4.5 w-4.5" }, void 0, false) 
}, void 0, false
      ),

      open &&
      _jsxDEV("div", {
        role: "menu",
        className: `absolute z-20 mt-1 w-80 max-w-[90vw] rounded-xl border border-navy-100 bg-white p-3 shadow-elevated dark:border-navy-700 dark:bg-navy-900 ${
        align === "right" ? "right-0" : "left-0"}`, children:

        children(() => {return setOpen(false);}) 
}, void 0, false
      )] 
}, void 0, true

    ));

}