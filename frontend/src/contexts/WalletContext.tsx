/**
 * WalletContext — simplified for server-managed wallets.
 *
 * The previous version required users to connect an external wallet app
 * (OKX Wallet, MetaMask) via window.ethereum / window.okxwallet, sign a
 * nonce, and broadcast their own transactions. All of that is gone.
 *
 * Now the backend generates, stores, and signs everything server-side.
 * This context is kept as a lightweight stub so any remaining imports
 * compile without changes, but the real wallet work happens in:
 *   - useWalletBinding  →  POST /wallet/generate
 *   - useCastVote       →  POST /votes  (no txHash, no getSigner)
 */
import { createContext, useContext, ReactNode } from "react";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface WalletContextValue {}

const WalletContext = createContext<WalletContextValue>({});

export function WalletProvider({ children }: { children: ReactNode }) {
  return <WalletContext.Provider value={{}}>{children}</WalletContext.Provider>;
}

/** @deprecated No longer needed — the server manages wallets. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useWallet(): WalletContextValue {
  return useContext(WalletContext);
}
