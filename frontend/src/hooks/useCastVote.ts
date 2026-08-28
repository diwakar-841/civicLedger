import { useState } from "react";
import { apiClient } from "../lib/apiClient";

/**
 * Cast a vote via the backend — no wallet app, no client-side signing.
 *
 * Old flow (broken on Android):
 *   1. getSigner() from OKX / MetaMask via window.ethereum
 *   2. contract.castVote(onChainCandidateId) — user signs tx in wallet popup
 *   3. tx.wait(1) — wait for blockchain confirmation
 *   4. POST /votes { electionId, candidateId, txHash, voteToken }
 *
 * New flow (works everywhere):
 *   1. POST /votes { electionId, candidateId, voteToken }
 *      → The server decrypts the user's stored private key, signs the
 *        castVote() transaction, broadcasts it, and caches the result.
 *
 * The voteToken (a short-lived JWT) is still required — it proves the user
 * authenticated with biometric or PIN immediately before voting. The server
 * rejects votes without a valid, unexpired voteToken.
 */
export function useCastVote() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "submitting" | "confirming">("idle");

  async function castVote(
    electionId: string,
    candidateId: string,
    voteToken: string
  ) {
    setLoading(true);
    setStep("submitting");
    try {
      setStep("confirming");
      const { data } = await apiClient.post("/votes", {
        electionId,
        candidateId,
        voteToken,
      });
      return data;
    } finally {
      setLoading(false);
      setStep("idle");
    }
  }

  return { castVote, loading, step };
}
