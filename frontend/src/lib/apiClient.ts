import axios from "axios";

// SECURITY: the access token lives ONLY in memory, never in localStorage or
// sessionStorage. Web storage is readable by any JS running on the page, so
// a single XSS bug anywhere in the app (a dependency, a future feature)
// would let an attacker read a stored token and hijack the session.
// Keeping it in a module-level variable means it disappears on page reload;
// that's expected and handled: AuthContext calls GET /auth/me on mount,
// which 401s, which triggers the refresh interceptor below to silently
// reissue an access token from the httpOnly refreshToken cookie.
let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (!token) {
    // Notify React that the session has ended so AuthContext can clear user
    // state and redirect to login. We use a CustomEvent rather than importing
    // AuthContext directly to avoid a circular-dependency.
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }
}

// In local dev, Vite's proxy (see vite.config.ts) forwards "/api" to the
// backend on 127.0.0.1:5000, so a relative path works. In production there
// is no such proxy — the frontend is a static build with no server behind
// it — so we need the real backend origin. Set VITE_API_URL on whatever
// platform hosts the frontend (e.g. https://civic-ledger-g51u.onrender.com/api).
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  // FIX: increased from 15 s to 30 s.
  // Email-sending endpoints (identity verify, resend OTP) now fire-and-forget
  // so they should return in < 1 s, but 30 s gives headroom for slow DB or
  // bcrypt operations without frustrating the user with premature timeouts.
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Token-refresh interceptor ────────────────────────────────────────────────
//
// On 401:
//   1. Attempt a silent refresh via POST /api/auth/refresh (uses the httpOnly
//      refreshToken cookie set at login).
//   2. If refresh succeeds, store the new access token and replay the original
//      request once.
//   3. If refresh fails (cookie missing / expired), clear the access token and
//      dispatch "auth:session-expired" so AuthContext clears user state.
//
// Concurrent 401s that arrive while a refresh is in-flight are queued and
// replayed together once the refresh resolves, preventing a storm of parallel
// refresh calls.

let _isRefreshing = false;
let _refreshQueue: Array<(token: string | null) => void> = [];

function processRefreshQueue(token: string | null) {
  _refreshQueue.forEach((cb) => cb(token));
  _refreshQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config;

    // Only attempt refresh on 401, and never for the refresh endpoint itself
    // (to avoid an infinite retry loop) or requests already retried once.
    if (
      err.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(err);
    }

    // Another request is already refreshing — queue this one.
    if (_isRefreshing) {
      return new Promise((resolve, reject) => {
        _refreshQueue.push((token) => {
          if (token) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(originalRequest));
          } else {
            reject(err);
          }
        });
      });
    }

    originalRequest._retry = true;
    _isRefreshing = true;

    try {
      const { data } = await apiClient.post<{ accessToken: string }>("/auth/refresh");
      const newToken = data.accessToken;
      setAccessToken(newToken);
      processRefreshQueue(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch {
      // Refresh itself failed — the session is truly expired. Clear the token
      // so AuthContext detects the logged-out state and redirects to login.
      // setAccessToken(null) also fires the "auth:session-expired" event.
      setAccessToken(null);
      processRefreshQueue(null);
      return Promise.reject(err);
    } finally {
      _isRefreshing = false;
    }
  }
);
