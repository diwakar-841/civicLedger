import { useState } from "react";
import { apiClient } from "../lib/apiClient";

export function useCastVote() {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("idle");

  async function castVote(
  electionId,
  candidateId,
  voteToken)
  {
    setLoading(true);
    setStep("submitting");
    try {
      setStep("confirming");
      const { data } = await apiClient.post("/votes", {
        electionId,
        candidateId,
        voteToken
      });
      return data;
    } finally {
      setLoading(false);
      setStep("idle");
    }
  }

  return { castVote, loading, step };
}