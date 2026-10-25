import { api } from "@/lib/api/client";
import { withAdminSessionLock } from "../utils/authSession";

export function login(email, password, options = {}) {
  return api.post(
    "/Authentications/login",
    {
      email,
      password,
    },
    options,
  );
}

export function adminLogin(email, password, options = {}) {
  return withAdminSessionLock(() => api.post(
    "/AdminAuthentications/login",
    {
      email,
      password,
    },
    { ...options, skipAuth: true, skipRefresh: true },
  ));
}

export function refreshToken(options = {}) {
  return api.post("/Authentications/refresh-token", undefined, {
    ...options,
    skipAuth: true,
    skipRefresh: true,
  });
}

export function adminRefreshToken(options = {}) {
  return withAdminSessionLock(() => api.post("/AdminAuthentications/refresh-token", undefined, {
    ...options,
    skipAuth: true,
    skipRefresh: true,
    signal: options.signal ?? AbortSignal.timeout(15_000),
  }));
}

export function validateToken(accessToken, options = {}) {
  return api.post(
    "/Authentications/validate-token",
    {
      accessToken,
    },
    options,
  );
}

export function logout(accessToken, options = {}) {
  return api.post("/Authentications/logout", undefined, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function adminLogout(accessToken, options = {}) {
  return withAdminSessionLock(() => api.post("/AdminAuthentications/logout", undefined, {
    ...options,
    skipAuth: true,
    skipRefresh: true,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  }));
}
