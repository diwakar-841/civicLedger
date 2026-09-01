import { useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

export function useVoteStatus(electionId) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!electionId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiClient.
    get(`/votes/my-vote/${electionId}`).
    then(({ data }) => {
      if (!cancelled) {setStatus(data);}
    }).
    catch((err) => {
      if (!cancelled) {setError(err);}
    }).
    finally(() => {
      if (!cancelled) {setLoading(false);}
    });

    return () => {
      cancelled = true;
    };
  }, [electionId]);

  return { status, loading, error };
}