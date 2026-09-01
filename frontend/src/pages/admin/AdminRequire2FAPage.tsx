import { Link } from "react-router-dom";
import { ShieldCheck, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { Card } from "../../components/shared/Card";
import { Button } from "../../components/shared/Button";
import { Layout } from "../../components/layout/Layout";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function AdminRequire2FAPage() {
  return (
    _jsxDEV(Layout, {
 children:
      _jsxDEV("div", {
 className: "mx-auto max-w-lg", children:
        _jsxDEV(motion.div, {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] }, children:

          _jsxDEV(Card, {
 className: "flex flex-col items-center gap-5 p-10 text-center dark:bg-navy-900 dark:border-navy-700", children: [
            _jsxDEV("span", {
 className: "flex h-16 w-16 items-center justify-center rounded-full bg-gold-100 text-gold-600 dark:bg-navy-800 dark:text-gold-400", children:
              _jsxDEV(Lock, { className: "h-8 w-8" }, void 0, false) 
}, void 0, false
            ),
            _jsxDEV("div", {
 children: [
              _jsxDEV("h1", { className: "text-xl font-bold text-navy-900 dark:text-navy-50", children: "Two-factor authentication required" }, void 0, false),
              _jsxDEV("p", { className: "mt-2 text-sm text-navy-500 dark:text-navy-400", children: "Admin access requires two-factor authentication to be enabled on your account. This protects the election system from unauthorized changes." }, void 0, false

              )] 
}, void 0, true
            ),
            _jsxDEV("div", {
 className: "flex w-full flex-col gap-2 sm:flex-row sm:justify-center", children:
              _jsxDEV(Link, {
 to: "/settings/security", children:
                _jsxDEV(Button, {
 variant: "secondary", children: [
                  _jsxDEV(ShieldCheck, { className: "h-4 w-4" }, void 0, false), "Enable 2FA in security settings"] 
}, void 0, true

                ) 
}, void 0, false
              ) 
}, void 0, false
            )] 
}, void 0, true
          ) 
}, void 0, false
        ) 
}, void 0, false
      ) 
}, void 0, false
    ));

}