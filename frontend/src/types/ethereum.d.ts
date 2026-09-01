export interface EthereumProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener: (
    event: string,
    handler: (...args: unknown[]) => void,
  ) => void;
  isMetaMask?: boolean;
  isOKExWallet?: boolean;
  isOKX?: boolean;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;

    okxwallet?: EthereumProvider;

    OKExChain?: EthereumProvider;
  }
}
