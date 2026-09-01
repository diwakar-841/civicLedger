import { useState } from "react";
import { apiClient } from "../lib/apiClient";

export function useWalletBinding() {
  const [loading, setLoading] = useState(false);

  async function bind() {
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        "/wallet/generate"
      );
      return { walletAddress: data.walletAddress };
    } finally {
      setLoading(false);
    }
  }

  return { bind, loading };
}