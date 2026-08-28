import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient, setAccessToken, getAccessToken } from "../lib/apiClient";
import type { User } from "../types/api";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setWalletAddress: (address: string) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [isLoading, setIsLoading] = useState(true);

  // Keep React token state in sync whenever the module-level _accessToken is
  // cleared externally (e.g. the axios interceptor clears it after a failed
  // token refresh). Without this listener the context would still report
  // isAuthenticated=true while every API call fails with 401.
  useEffect(() => {
    function handleSessionExpired() {
      setToken(null);
      setUser(null);
    }
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  // No access token lives in storage anymore (see lib/apiClient.ts), so on
  // mount we always attempt GET /auth/me with no Authorization header. That
  // 401s, which the axios refresh interceptor catches: it calls
  // POST /auth/refresh (using the httpOnly refreshToken cookie), obtains a
  // fresh access token, and transparently replays /auth/me. If there's no
  // valid refresh cookie (never logged in, or it expired), refresh fails and
  // we land in the catch below with the user simply logged out.
  useEffect(() => {
    apiClient
      .get<User>("/auth/me")
      .then(({ data }) => {
        setToken(getAccessToken());
        setUser(data);
      })
      .catch(() => {
        setAccessToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  function login(nextUser: User, nextToken: string) {
    setAccessToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  async function logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    }
    // Remove any in-progress authentication/setup material as well as the
    // in-memory access token. This prevents a partially completed KYC or
    // biometric flow from surviving a sign-out.
    sessionStorage.clear();
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    try {
      const { data } = await apiClient.get<User>("/auth/me");
      setUser(data);
    } catch {
      // ignore
    }
  }

  function setWalletAddress(address: string) {
    setUser((prev) => (prev ? { ...prev, walletAddress: address } : prev));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isAdmin: user?.role === "admin",
        isLoading,
        login,
        logout,
        refreshUser,
        setWalletAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}

// Re-export User type for consumers
export type { User };
