import { useState, useCallback, useEffect } from "react";
import { apiClient } from "../lib/apiClient";
import { runCandidateRequestBiometric } from "../lib/webauthn";

export interface CandidateRequest {
  id: string;
  electionId: string;
  electionTitle: string;
  electionDescription?: string | null;
  nominatedByName?: string;
  userId?: string;
  candidateName?: string;
  candidatePhotoUrl?: string | null;
  candidateWalletLinked?: boolean;
  electionStatus?: string;
  createdAt?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  expiresAt: string;
  respondedAt?: string;
  profileCompletedAt?: string;
  profileCompleted?: boolean;
}

export function useCandidateRequests() {
  const [requests, setRequests] = useState<CandidateRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get<CandidateRequest[]>(
        "/candidate-requests",
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to load requests",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptRequest = useCallback(
    async (requestId: string, method: "biometric" | "pin", pin?: string) => {
      try {
        let authToken: string;
        if (method === "biometric") {
          authToken = await runCandidateRequestBiometric(requestId);
        } else {
          if (!pin || !/^\d{6}$/.test(pin))
            throw new Error("Login PIN must be exactly 6 digits");
          const { data } = await apiClient.post<{ authToken: string }>(
            "/auth/candidate-request/verify-pin",
            {
              requestId,
              pin,
            },
          );
          authToken = data.authToken;
        }
        await apiClient.put(`/candidate-requests/${requestId}/accept`, {
          authToken,
        });
        await fetchRequests();
        return authToken;
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to accept request");
        throw err;
      }
    },
    [fetchRequests],
  );

  const rejectRequest = useCallback(
    async (requestId: string, reason?: string) => {
      try {
        await apiClient.put(`/candidate-requests/${requestId}/reject`, {
          reason,
        });
        await fetchRequests();
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to reject request");
        throw err;
      }
    },
    [fetchRequests],
  );

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    error,
    acceptRequest,
    rejectRequest,
    refetch: fetchRequests,
  };
}
