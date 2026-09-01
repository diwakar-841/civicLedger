import { useState } from "react";
import { apiClient } from "../lib/apiClient";

export function useCastVote() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "submitting" | "confirming">(
    "idle",
  );

  async function castVote(
    electionId: string,
    candidateId: string,
    voteToken: string,
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
