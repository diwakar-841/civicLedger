import { createContext, useContext, ReactNode } from "react";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const WalletContext = createContext({});

export function WalletProvider({ children }) {
  return _jsxDEV(WalletContext.Provider, { value: {}, children: children }, void 0, false);
}

export function useWallet() {
  return useContext(WalletContext);
}