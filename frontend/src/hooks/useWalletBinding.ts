import { useState } from "react";
import { apiClient } from "../lib/apiClient";

/**
 * Replaces the old nonce → sign → verify flow.
 *
 * Previously this required the user to:
 *   1. Connect OKX Wallet / MetaMask inside the wallet's built-in browser
 *   2. Sign a one-time nonce message
 *   3. Submit the signature to the backend
 *
 * Now it just calls POST /wallet/generate, which creates a fresh Ethereum
 * wallet server-side, encrypts the private key, stores it in the database,
 * and registers the address on-chain — all in one request.
 *
 * No wallet app needed. Works in any browser on any Android device.
 */
export function useWalletBinding() {
  const [loading, setLoading] = useState(false);

  async function bind(): Promise<{ walletAddress: string }> {
    setLoading(true);
    try {
      const { data } = await apiClient.post<{ walletAddress: string; message: string }>(
        "/wallet/generate"
      );
      return { walletAddress: data.walletAddress };
    } finally {
      setLoading(false);
    }
  }

  return { bind, loading };
}
