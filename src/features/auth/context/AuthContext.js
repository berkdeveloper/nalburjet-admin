"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
    setContextAccessToken(null);
    setUser(null);
    clearAccessToken();
  }, []);

  const refresh = useCallback(async () => {
    try {
      const response = await adminRefreshTokenRequest();
      const tokenData = response?.data ?? null;

      if (!setAuthentication(tokenData)) {
        clearAuthentication();
        return null;
      }

      return tokenData;
    } catch (error) {
      clearAuthentication();
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
      const response = await validateTokenRequest(accessToken);

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

      await adminLogoutRequest(accessToken);
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
      } catch {
        if (isCancelled) {
          return;
        }

        clearAuthentication();
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