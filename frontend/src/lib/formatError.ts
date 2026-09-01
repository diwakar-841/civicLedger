import axios from "axios";

export function formatError(err: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(err)) {

    const data = err.response?.data;
    if (data) {
      if (typeof data.error === "string" && data.error) {return data.error;}
      if (typeof data.message === "string" && data.message) {return data.message;}
    }

    if (err.code === "ECONNABORTED") {
      return "Request timed out — the server took too long to respond. Check that the backend is running.";
    }
    if (!err.response) {
      return "Cannot reach the server — make sure the backend is running on port 5000.";
    }

    const status = err.response.status;
    if (status === 401) {return "You are not authorised to do that";}
    if (status === 403) {return "Access denied";}
    if (status === 404) {return "Not found";}
    if (status === 429) {return "Too many attempts — please wait a moment and try again";}
    if (status >= 500) {return "Server error — check the backend logs";}
  }

  if (err instanceof Error) {return err.message;}
  return fallback;
}