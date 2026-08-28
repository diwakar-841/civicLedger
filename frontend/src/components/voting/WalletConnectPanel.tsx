import { ShieldCheck, Wallet, Loader2 } from "lucide-react";
import { useWalletBinding } from "../../hooks/useWalletBinding";
import { useAuthContext } from "../../contexts/AuthContext";
import { Button } from "../shared/Button";
import { useToast } from "../../contexts/ToastContext";
import { formatError } from "../../lib/formatError";

/**
 * WalletConnectPanel — server-managed wallet setup.
 *
 * The old version required users to open OKX Wallet's built-in browser,
 * navigate to a 127.0.0.1 URL, connect their wallet, and sign a nonce
 * message — which was fragile and confusing on Android.
 *
 * Now the user just taps "Set Up Wallet" and the backend generates a
 * fresh Ethereum wallet for them automatically. No wallet app needed,
 * no seed phrases, no browser restrictions — works in any browser.
 */
export function WalletConnectPanel() {
  const { user, setWalletAddress } = useAuthContext();
  const { bind, loading } = useWalletBinding();
  const { show } = useToast();

  // Already set up — show the linked address
  if (user?.walletAddress) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-semibold text-emerald-900">Wallet ready</p>
          <p className="font-mono text-xs text-emerald-700 break-all">{user.walletAddress}</p>
        </div>
      </div>
    );
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
    <div className="rounded-xl border border-navy-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Wallet className="h-5 w-5 text-navy-500" />
        <p className="text-sm font-semibold text-navy-800">Set up your voting wallet</p>
      </div>

      <p className="mb-4 text-sm text-navy-500">
        Before you can vote, we create a secure blockchain wallet for you automatically.
        No wallet app or seed phrase needed — it takes just one tap.
      </p>

      <Button onClick={handleGenerate} loading={loading} fullWidth>
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up wallet…
          </span>
        ) : (
          "Set Up Wallet"
        )}
      </Button>
    </div>
  );
}
