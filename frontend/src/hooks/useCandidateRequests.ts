import { useState, useCallback, useEffect } from "react";
import { apiClient } from "../lib/apiClient";
import { runCandidateRequestBiometric } from "../lib/webauthn";

export function useCandidateRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get("/candidate-requests");
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptRequest = useCallback(async (requestId, method, pin) => {
    try {
      let authToken;
      if (method === "biometric") {
        authToken = await runCandidateRequestBiometric(requestId);
      } else {
        if (!pin || !/^\d{6}$/.test(pin)) {throw new Error("Login PIN must be exactly 6 digits");}
        const { data } = await apiClient.post("/auth/candidate-request/verify-pin", {
          requestId,
          pin
        });
        authToken = data.authToken;
      }
      await apiClient.put(`/candidate-requests/${requestId}/accept`, { authToken });
      await fetchRequests();
      return authToken;
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to accept request");
      throw err;
    }
  }, [fetchRequests]);

  const rejectRequest = useCallback(
    async (requestId, reason) => {
      try {
        await apiClient.put(`/candidate-requests/${requestId}/reject`, { reason });
        await fetchRequests();
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to reject request");
        throw err;
      }
    },
    [fetchRequests]
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
    refetch: fetchRequests
  };
}