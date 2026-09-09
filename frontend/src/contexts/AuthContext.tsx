import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
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

  useEffect(() => {
    function handleSessionExpired() {
      setToken(null);
      setUser(null);
    }
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () =>
      window.removeEventListener("auth:session-expired", handleSessionExpired);
  }, []);

  useEffect(() => {
    // The default apiClient timeout is 30s, which is meant for user-triggered
    // actions. On first load that timeout would leave the whole app stuck
    // behind a loading screen for up to 30s whenever the backend is slow to
    // respond (e.g. a cold start on the API host). Cap this specific check
    // to a much shorter window so the UI reliably unblocks and falls back to
    // the login page instead of hanging.
    const controller = new AbortController();
    const fastTimeout = setTimeout(() => controller.abort(), 6_000);

    apiClient
      .get<User>("/auth/me", { signal: controller.signal })
      .then(({ data }) => {
        setToken(getAccessToken());
        setUser(data);
      })
      .catch(() => {
        setAccessToken(null);
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        clearTimeout(fastTimeout);
        setIsLoading(false);
      });

    return () => {
      clearTimeout(fastTimeout);
      controller.abort();
    };
  }, []);

  function login(nextUser: User, nextToken: string) {
    setAccessToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  async function logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch {}

    sessionStorage.clear();
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    try {
      const { data } = await apiClient.get<User>("/auth/me");
      setUser(data);
    } catch {}
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

export type { User };
