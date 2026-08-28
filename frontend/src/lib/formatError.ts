import axios from "axios";

/**
 * Extracts a human-readable message from an error thrown by apiClient.
 *
 * Priority:
 *  1. Server JSON body (.error or .message field)
 *  2. Network-level error (ECONNREFUSED, timeout, etc.)
 *  3. Fallback string provided by the caller
 */
export function formatError(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {
    // Server responded with an error body
    const data = err.response?.data;
    if (data) {
      if (typeof data.error === "string" && data.error) return data.error;
      if (typeof data.message === "string" && data.message) return data.message;
    }

    // Network error — no response received
    if (err.code === "ECONNABORTED") {
      return "Request timed out — the server took too long to respond. Check that the backend is running.";
    }
    if (!err.response) {
      return "Cannot reach the server — make sure the backend is running on port 5000.";
    }

    // HTTP error without a body
    const status = err.response.status;
    if (status === 401) return "You are not authorised to do that";
    if (status === 403) return "Access denied";
    if (status === 404) return "Not found";
    if (status === 429) return "Too many attempts — please wait a moment and try again";
    if (status >= 500) return "Server error — check the backend logs";
  }

  if (err instanceof Error) return err.message;
  return fallback;
}
