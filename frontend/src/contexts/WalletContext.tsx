import { createContext, useContext, ReactNode } from "react";

interface WalletContextValue {}

const WalletContext = createContext<WalletContextValue>({});

export function WalletProvider({ children }: { children: ReactNode }) {
  return <WalletContext.Provider value={{}}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  return useContext(WalletContext);
}
