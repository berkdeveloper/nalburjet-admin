"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  adminLogin as adminLoginRequest,
  adminLogout as adminLogoutRequest,
  adminRefreshToken as adminRefreshTokenRequest,
  validateToken as validateTokenRequest,
} from "@/features/auth/services/authService";
import {
  clearAccessToken,
  clearRefreshHandler,
  ensureAccessToken,
  getAccessToken,
  getSessionGeneration,
  isAuthenticationFailure,
  refreshAccessToken,
  setAccessToken,
  setRefreshHandler,
} from "@/features/auth/utils/authSession";
import { getUserFromAccessToken } from "@/features/auth/utils/token";

const AuthContext = createContext(null);

function isAdminUser(user) {
  return user?.role === "Admin";
}

export function AuthProvider({ children }) {
  const [accessToken, setContextAccessToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const restorePendingRef = useRef(false);

  const setAuthentication = useCallback((tokenData) => {
    const nextAccessToken = tokenData?.accessToken ?? null;
    const nextUser = getUserFromAccessToken(nextAccessToken);

    if (!nextAccessToken || !isAdminUser(nextUser)) {
      setContextAccessToken(null);
      setUser(null);
      clearAccessToken();

      return false;
    }

    setContextAccessToken(nextAccessToken);
    setAccessToken(nextAccessToken);
    setUser(nextUser);

    return true;
  }, []);

  const clearAuthentication = useCallback(() => {
    restorePendingRef.current = false;
    setContextAccessToken(null);
    setUser(null);
    clearAccessToken();
  }, []);

  const refresh = useCallback(async () => {
    const generation = getSessionGeneration();
    try {
      const response = await adminRefreshTokenRequest();
      if (generation !== getSessionGeneration()) return null;
      const tokenData = response?.data ?? null;

      if (!setAuthentication(tokenData)) {
        clearAuthentication();
        return null;
      }

      restorePendingRef.current = false;
      return tokenData;
    } catch (error) {
      if (generation === getSessionGeneration() && isAuthenticationFailure(error)) {
        clearAuthentication();
      }
      throw error;
    }
  }, [clearAuthentication, setAuthentication]);

  useEffect(() => {
    setRefreshHandler(refresh);

    return () => {
      clearRefreshHandler();
    };
  }, [refresh]);

  const login = useCallback(
    async (email, password) => {
      try {
        setError(null);
        setIsLoading(true);
        clearAuthentication();

        const response = await adminLoginRequest(email, password);
        const tokenData = response?.data ?? null;

        if (!setAuthentication(tokenData)) {
          const authorizationError = new Error(
            "Bu hesap yönetim paneline erişim yetkisine sahip değil.",
          );

          setError(authorizationError);
          clearAuthentication();

          return null;
        }

        return tokenData;
      } catch (error) {
        setError(error);
        clearAuthentication();

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthentication, setAuthentication],
  );

  const validate = useCallback(async () => {
    if (!accessToken || !isAdminUser(user)) {
      return false;
    }

    try {
      const currentAccessToken = await ensureAccessToken();
      if (!currentAccessToken) return false;
      const response = await validateTokenRequest(currentAccessToken);

      return response?.data?.isValid === true;
    } catch {
      return false;
    }
  }, [accessToken, user]);

  const logout = useCallback(async () => {
    if (!accessToken) {
      clearAuthentication();
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const currentAccessToken = await ensureAccessToken();
      if (currentAccessToken) await adminLogoutRequest(currentAccessToken);
    } catch (error) {
      setError(error);
      throw error;
    } finally {
      clearAuthentication();
      setIsLoading(false);
    }
  }, [accessToken, clearAuthentication]);

  useEffect(() => {
    let isCancelled = false;

    async function restoreAuthentication() {
      try {
        const nextAccessToken = await refreshAccessToken();

        if (isCancelled) {
          return;
        }

        if (nextAccessToken) {
          const nextUser = getUserFromAccessToken(nextAccessToken);

          if (!isAdminUser(nextUser)) {
            clearAuthentication();
          }
        } else {
          clearAuthentication();
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }

        if (isAuthenticationFailure(error)) {
          clearAuthentication();
        } else {
          restorePendingRef.current = true;
          setError(error);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    restoreAuthentication();

    return () => {
      isCancelled = true;
    };
  }, [clearAuthentication]);

  useEffect(() => {
    async function keepSessionAlive() {
      if (document.visibilityState === "hidden") return;
      if (!getAccessToken() && !restorePendingRef.current) return;

      try {
        await ensureAccessToken();
      } catch {
        // Keep the current session on temporary failures; retry on focus/online or the next interval.
      }
    }

    const interval = window.setInterval(keepSessionAlive, 60_000);
    window.addEventListener("focus", keepSessionAlive);
    window.addEventListener("online", keepSessionAlive);
    document.addEventListener("visibilitychange", keepSessionAlive);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", keepSessionAlive);
      window.removeEventListener("online", keepSessionAlive);
      document.removeEventListener("visibilitychange", keepSessionAlive);
    };
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      user,
      isAuthenticated: Boolean(accessToken && isAdminUser(user)),
      isLoading,
      error,
      login,
      refresh,
      validate,
      logout,
    }),
    [
      accessToken,
      user,
      isLoading,
      error,
      login,
      refresh,
      validate,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
