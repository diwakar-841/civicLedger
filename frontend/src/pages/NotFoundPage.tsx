import { Link } from "react-router-dom";
import { Compass } from "lucide-react";
import { Button } from "../components/shared/Button";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function NotFoundPage() {
  return (
    _jsxDEV("div", {
 className: "flex min-h-screen flex-col items-center justify-center gap-4 bg-navy-950 px-6 text-center text-white", children: [
      _jsxDEV(Compass, { className: "h-10 w-10 text-gold-400" }, void 0, false),
      _jsxDEV("h1", { className: "text-3xl font-bold", children: "Page not found" }, void 0, false),
      _jsxDEV("p", { className: "max-w-sm text-navy-300", children: "The page you're looking for doesn't exist or may have moved." }, void 0, false),
      _jsxDEV(Link, {
 to: "/", children:
        _jsxDEV(Button, { variant: "secondary", children: "Back to home" }, void 0, false) 
}, void 0, false
      )] 
}, void 0, true
    ));

}