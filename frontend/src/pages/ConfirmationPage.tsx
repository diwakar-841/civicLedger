import { useLocation, useParams, Link } from "react-router-dom";
import { CheckCircle2, BarChart3, ArrowLeft, Copy, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { Layout } from "../components/layout/Layout";
import { Card } from "../components/shared/Card";
import { Button } from "../components/shared/Button";
import { useState } from "react";import { jsxDEV as _jsxDEV, Fragment as _Fragment } from "react/jsx-dev-runtime";

export function ConfirmationPage() {
  const { id } = useParams();
  const location = useLocation();
  const state = location.state ?? {};
  const { candidateName, txHash, electionTitle, blockNumber, timestamp } = state;
  const [copied, setCopied] = useState(false);

  function copyTxHash() {
    if (!txHash) {return;}
    navigator.clipboard.writeText(txHash);
    setCopied(true);
    setTimeout(() => {return setCopied(false);}, 2000);
  }

  const voteTime = timestamp ? new Date(timestamp).toLocaleString() : new Date().toLocaleString();

  return (
    _jsxDEV(Layout, {
 children:
      _jsxDEV("div", {
 className: "mx-auto max-w-lg", children:
        _jsxDEV(motion.div, {
          initial: { opacity: 0, scale: 0.95 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] }, children:

          _jsxDEV(Card, {
 className: "flex flex-col items-center gap-6 p-8 sm:p-10 dark:bg-navy-900 dark:border-navy-700", children: [

            _jsxDEV(motion.span, {
              initial: { scale: 0 },
              animate: { scale: 1 },
              transition: { delay: 0.15, duration: 0.4, type: "spring", stiffness: 200 },
              className: "flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400", children:

              _jsxDEV(CheckCircle2, { className: "h-10 w-10" }, void 0, false) 
}, void 0, false
            ),

            _jsxDEV("div", {
 className: "text-center", children: [
              _jsxDEV(motion.h1, {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.25 },
                className: "text-2xl font-bold text-navy-900 dark:text-navy-50", children:
                "Vote recorded" 
}, void 0, false

              ),
              _jsxDEV(motion.p, {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                transition: { delay: 0.32 },
                className: "mt-2 text-navy-500 dark:text-navy-400", children: [

                candidateName ?
                _jsxDEV(_Fragment, { children: ["Your vote for ", _jsxDEV("span", { className: "font-semibold text-navy-800 dark:text-navy-200", children: candidateName }, void 0, false), " has been verified on-chain."] }, void 0, true) :

                "Your vote has been verified on-chain.",
                " ", "It is permanent, tamper-proof, and anonymously counted."] 
}, void 0, true

              )] 
}, void 0, true
            ),

            _jsxDEV(motion.div, {
              initial: { opacity: 0, y: 12 },
              animate: { opacity: 1, y: 0 },
              transition: { delay: 0.4 },
              className: "w-full", children: [

              _jsxDEV("div", {
 className: "rounded-xl border border-navy-200 dark:border-navy-700 bg-navy-50 dark:bg-navy-800 px-5 py-4", children: [
                _jsxDEV("div", {
 className: "mb-3 flex items-center gap-2 border-b border-navy-200 dark:border-navy-700 pb-3", children: [
                  _jsxDEV(Hash, { className: "h-4 w-4 text-gold-500" }, void 0, false),
                  _jsxDEV("span", { className: "text-xs font-semibold uppercase tracking-wide text-navy-500 dark:text-navy-400", children: "Vote Receipt" }, void 0, false)] 
}, void 0, true
                ),
                _jsxDEV("dl", {
 className: "flex flex-col gap-2 text-sm", children: [
                  electionTitle &&
                  _jsxDEV("div", {
 className: "flex justify-between gap-4", children: [
                    _jsxDEV("dt", { className: "text-navy-500 dark:text-navy-400", children: "Election" }, void 0, false),
                    _jsxDEV("dd", { className: "font-medium text-navy-800 dark:text-navy-200 text-right", children: electionTitle }, void 0, false)] 
}, void 0, true
                  ),

                  candidateName &&
                  _jsxDEV("div", {
 className: "flex justify-between gap-4", children: [
                    _jsxDEV("dt", { className: "text-navy-500 dark:text-navy-400", children: "Candidate" }, void 0, false),
                    _jsxDEV("dd", { className: "font-medium text-navy-800 dark:text-navy-200 text-right", children: candidateName }, void 0, false)] 
}, void 0, true
                  ),

                  _jsxDEV("div", {
 className: "flex justify-between gap-4", children: [
                    _jsxDEV("dt", { className: "text-navy-500 dark:text-navy-400", children: "Recorded at" }, void 0, false),
                    _jsxDEV("dd", { className: "font-medium text-navy-800 dark:text-navy-200 text-right", children: voteTime }, void 0, false)] 
}, void 0, true
                  ),
                  blockNumber !== undefined &&
                  _jsxDEV("div", {
 className: "flex justify-between gap-4", children: [
                    _jsxDEV("dt", { className: "text-navy-500 dark:text-navy-400", children: "Block" }, void 0, false),
                    _jsxDEV("dd", { className: "font-mono text-navy-800 dark:text-navy-200", children: ["#", blockNumber] }, void 0, true)] 
}, void 0, true
                  ),

                  txHash &&
                  _jsxDEV("div", {
 className: "mt-1 border-t border-navy-200 dark:border-navy-700 pt-2", children: [
                    _jsxDEV("dt", { className: "mb-1 text-xs text-navy-500 dark:text-navy-400", children: "Transaction hash" }, void 0, false),
                    _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
                      _jsxDEV("dd", {
 className: "min-w-0 flex-1 truncate rounded bg-white dark:bg-navy-700 px-2.5 py-1.5 font-mono text-xs text-navy-700 dark:text-navy-200", children:
                        txHash 
}, void 0, false
                      ),
                      _jsxDEV("button", {
                        type: "button",
                        onClick: copyTxHash,
                        className: "flex-shrink-0 rounded p-1.5 text-navy-400 hover:bg-white dark:hover:bg-navy-700 hover:text-navy-700 focus-ring",
                        title: "Copy transaction hash", children:

                        _jsxDEV(Copy, { className: "h-3.5 w-3.5" }, void 0, false) 
}, void 0, false
                      )] 
}, void 0, true
                    ),
                    copied && _jsxDEV("p", { className: "mt-1 text-xs text-emerald-600 dark:text-emerald-400", children: "Copied to clipboard" }, void 0, false)] 
}, void 0, true
                  )] 
}, void 0, true

                )] 
}, void 0, true
              ),
              _jsxDEV("p", { className: "mt-2 text-center text-xs text-navy-400 dark:text-navy-500", children: "This transaction is permanently recorded on the blockchain and cannot be altered." }, void 0, false

              )] 
}, void 0, true
            ),

            _jsxDEV(motion.div, {
              initial: { opacity: 0 },
              animate: { opacity: 1 },
              transition: { delay: 0.5 },
              className: "flex w-full flex-col gap-3 sm:flex-row", children: [

              _jsxDEV(Link, {
 to: `/elections/${id}/results`, className: "flex-1", children:
                _jsxDEV(Button, {
 variant: "secondary", fullWidth: true, children: [
                  _jsxDEV(BarChart3, { className: "h-4 w-4" }, void 0, false), "View live results"] 
}, void 0, true

                ) 
}, void 0, false
              ),
              _jsxDEV(Link, {
 to: "/elections", className: "flex-1", children:
                _jsxDEV(Button, {
 variant: "ghost", fullWidth: true, children: [
                  _jsxDEV(ArrowLeft, { className: "h-4 w-4" }, void 0, false), "Back to elections"] 
}, void 0, true

                ) 
}, void 0, false
              )] 
}, void 0, true
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