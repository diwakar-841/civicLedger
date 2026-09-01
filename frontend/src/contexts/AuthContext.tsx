import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiClient, setAccessToken, getAccessToken } from "../lib/apiClient";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {return getAccessToken();});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    function handleSessionExpired() {
      setToken(null);
      setUser(null);
    }
    window.addEventListener("auth:session-expired", handleSessionExpired);
    return () => {return window.removeEventListener("auth:session-expired", handleSessionExpired);};
  }, []);

  useEffect(() => {
    apiClient.
    get("/auth/me").
    then(({ data }) => {
      setToken(getAccessToken());
      setUser(data);
    }).
    catch(() => {
      setAccessToken(null);
      setToken(null);
      setUser(null);
    }).
    finally(() => {return setIsLoading(false);});
  }, []);

  function login(nextUser, nextToken) {
    setAccessToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
  }

  async function logout() {
    try {
      await apiClient.post("/auth/logout");
    } catch {

    }

    sessionStorage.clear();
    setAccessToken(null);
    setToken(null);
    setUser(null);
  }

  async function refreshUser() {
    try {
      const { data } = await apiClient.get("/auth/me");
      setUser(data);
    } catch {

    }
  }

  function setWalletAddress(address) {
    setUser((prev) => {return prev ? { ...prev, walletAddress: address } : prev;});
  }

  return (
    _jsxDEV(AuthContext.Provider, {
      value: {
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isAdmin: user?.role === "admin",
        isLoading,
        login,
        logout,
        refreshUser,
        setWalletAddress
      }, children:

      children 
}, void 0, false
    ));

}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {throw new Error("useAuthContext must be used within AuthProvider");}
  return ctx;
}