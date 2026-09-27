import axios from "axios";

let _accessToken: string | null = null;

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
  if (!token) {
    window.dispatchEvent(new CustomEvent("auth:session-expired"));
  }
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,

  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

    if (
      err.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(err);
    }

    if (_isRefreshing) {
      // Mark this follower request as already retried *before* queueing it.
      // Without this, if the retried request comes back with another 401,
      // it would re-enter this interceptor with `_retry` still unset and
      // could kick off a second, redundant refresh cycle instead of simply
      // failing.
      originalRequest._retry = true;
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
      const { data } = await apiClient.post<{ accessToken: string }>(
        "/auth/refresh",
      );
      const newToken = data.accessToken;
      setAccessToken(newToken);
      processRefreshQueue(newToken);
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return apiClient(originalRequest);
    } catch {
      setAccessToken(null);
      processRefreshQueue(null);
      return Promise.reject(err);
    } finally {
      _isRefreshing = false;
    }
  },
);
