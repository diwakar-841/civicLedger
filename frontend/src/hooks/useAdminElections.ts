import { useState, useCallback, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

export function useCreateElection() {
  const [loading, setLoading] = useState(false);

  async function createElection(input) {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/elections", input);
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { createElection, loading };
}

export function useScheduleElection() {
  const [loading, setLoading] = useState(false);

  async function scheduleElection(
  electionId,
  input)

  {
    setLoading(true);
    try {
      const body: Record<string, unknown> = {};
      if (input.startTime) {body.startTime = input.startTime;}
      if (input.endTime) {body.endTime = input.endTime;}

      if (input.nominationDeadline) {
        body.nominationDeadline = input.nominationDeadline;
      }
      const { data } = await apiClient.post(`/elections/${electionId}/schedule`, body);
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { scheduleElection, loading };
}

export function useCreateNominationRequest() {
  const [loading, setLoading] = useState(false);

  async function createRequest(electionId, userId) {
    setLoading(true);
    try {
      const { data } = await apiClient.post("/candidate-requests", {
        electionId,
        userId
      });
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { createRequest, loading };
}

export function useSetNominationDeadline() {
  const [loading, setLoading] = useState(false);

  async function setNominationDeadline(electionId, deadline) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/admin/elections/${electionId}/set-nomination-deadline`, { deadline });
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { setNominationDeadline, loading };
}

export function useElectionNominationRequests(electionId) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!electionId) {
      setRequests([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(
        `/candidate-requests/election/${electionId}`
      );
      setRequests(Array.isArray(data) ? data : []);
    } catch {
      setError("Could not load nomination requests.");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { requests, loading, error, refetch };
}

export function useSetElectionVisibility() {
  const [loading, setLoading] = useState(false);

  async function setVisibility(electionId, hidden) {
    setLoading(true);
    try {
      const { data } = await apiClient.patch(`/elections/${electionId}/visibility`, { hidden });
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { setVisibility, loading };
}

export function useDeleteElection() {
  const [loading, setLoading] = useState(false);

  async function deleteElection(electionId, password, code) {
    setLoading(true);
    try {
      const { data } = await apiClient.delete(`/elections/${electionId}`, { data: { password, code } });
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { deleteElection, loading };
}

export function useVoterSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const { data } = await apiClient.get(
        `/elections/search-voters?q=${encodeURIComponent(query.trim())}`
      );
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
  }, []);

  return { results, loading, search, clear };
}

export function useNominationStatus(electionId) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!electionId) {
      setStatus(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(
        `/admin/elections/${electionId}/nomination-status`
      );
      setStatus(data);
    } catch {
      setError("Could not load the election status.");
    } finally {
      setLoading(false);
    }
  }, [electionId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { status, loading, error, refetch };
}

export function useStartVoting() {
  const [loading, setLoading] = useState(false);

  async function startVoting(
  electionId,
  input)

  {
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/admin/elections/${electionId}/start-voting`, input);
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { startVoting, loading };
}

export function useUpdateResultsSettings() {
  const [loading, setLoading] = useState(false);

  async function updateResultsSettings(
  electionId,
  input)
  {
    setLoading(true);
    try {
      const { data } = await apiClient.post(
        `/admin/elections/${electionId}/results-settings`,
        input
      );
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { updateResultsSettings, loading };
}

export function useExtendAllowance() {
  const [loading, setLoading] = useState(false);

  async function extendAllowance(electionId, minutes) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/admin/elections/${electionId}/extend-allowance`, { minutes });
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { extendAllowance, loading };
}

export function useCloseDraftElection() {
  const [loading, setLoading] = useState(false);

  async function closeDraft(electionId) {
    setLoading(true);
    try {
      const { data } = await apiClient.post(`/admin/elections/${electionId}/close-draft`, {});
      return data;
    } finally {
      setLoading(false);
    }
  }

  return { closeDraft, loading };
}