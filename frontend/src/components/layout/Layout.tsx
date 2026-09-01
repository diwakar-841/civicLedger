import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { AdminBottomNav } from "../admin/AdminBottomNav";
import { UserBottomNav } from "../user/UserBottomNav";
import { useAuthContext } from "../../contexts/AuthContext";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function Layout({ children }) {
  const { isAdmin, isAuthenticated } = useAuthContext();
  const showBottomNav = isAuthenticated;

  return (
    _jsxDEV("div", {
 className: "flex min-h-screen flex-col bg-transparent dark:bg-navy-950 transition-colors duration-200", children: [
      _jsxDEV(Navbar, {}, void 0, false),

      _jsxDEV("main", {
 className: "relative flex-1 overflow-hidden", children: [
        _jsxDEV("div", { className: "pointer-events-none absolute left-[-12rem] top-24 h-80 w-80 rounded-full bg-indigo-100/40 blur-3xl" }, void 0, false),

        _jsxDEV("div", {
          className: `mx-auto w-full max-w-7xl px-4 py-7 sm:px-6 sm:py-10 lg:px-10 ${
          showBottomNav ? "pb-28" : ""}`, children:

          children 
}, void 0, false
        )] 
}, void 0, true
      ),

      _jsxDEV("footer", { className: "border-t border-navy-100/80 px-4 py-6 text-center text-xs text-navy-400 dark:border-navy-800 dark:text-navy-500", children: "Every vote is verified on-chain and independently auditable. Civic Ledger never stores or transmits your wallet's private key." }, void 0, false

      ),

      isAdmin ? _jsxDEV(AdminBottomNav, {}, void 0, false) : isAuthenticated && _jsxDEV(UserBottomNav, {}, void 0, false)] 
}, void 0, true
    ));

}