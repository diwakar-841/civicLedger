import { ShieldCheck, Wallet, Loader2 } from "lucide-react";
import { useWalletBinding } from "../../hooks/useWalletBinding";
import { useAuthContext } from "../../contexts/AuthContext";
import { Button } from "../shared/Button";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function WalletConnectPanel() {
  const { user, setWalletAddress } = useAuthContext();
  const { bind, loading } = useWalletBinding();
  const { show } = useToast();

  if (user?.walletAddress) {
    return (
      _jsxDEV("div", {
 className: "flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4", children: [
        _jsxDEV(ShieldCheck, { className: "h-5 w-5 flex-shrink-0 text-emerald-600" }, void 0, false),
        _jsxDEV("div", {
 children: [
          _jsxDEV("p", { className: "text-sm font-semibold text-emerald-900", children: "Wallet ready" }, void 0, false),
          _jsxDEV("p", { className: "font-mono text-xs text-emerald-700 break-all", children: user.walletAddress }, void 0, false)] 
}, void 0, true
        )] 
}, void 0, true
      ));

  }

  async function handleGenerate() {
    try {
      const result = await bind();
      setWalletAddress(result.walletAddress);
      show("Wallet created — you can now cast your vote", "success");
    } catch (err) {
      show(formatError(err, "Could not create your wallet — please try again"), "error");
    }
  }

  return (
    _jsxDEV("div", {
 className: "rounded-xl border border-navy-200 bg-white p-4", children: [
      _jsxDEV("div", {
 className: "mb-3 flex items-center gap-2", children: [
        _jsxDEV(Wallet, { className: "h-5 w-5 text-navy-500" }, void 0, false),
        _jsxDEV("p", { className: "text-sm font-semibold text-navy-800", children: "Set up your voting wallet" }, void 0, false)] 
}, void 0, true
      ),

      _jsxDEV("p", { className: "mb-4 text-sm text-navy-500", children: "Before you can vote, we create a secure blockchain wallet for you automatically. No wallet app or seed phrase needed — it takes just one tap." }, void 0, false

      ),

      _jsxDEV(Button, {
 onClick: handleGenerate, loading: loading, fullWidth: true, children:
        loading ?
        _jsxDEV("span", {
 className: "flex items-center justify-center gap-2", children: [
          _jsxDEV(Loader2, { className: "h-4 w-4 animate-spin" }, void 0, false), "Setting up wallet…"] 
}, void 0, true

        ) :

        "Set Up Wallet" 
}, void 0, false

      )] 
}, void 0, true
    ));

}