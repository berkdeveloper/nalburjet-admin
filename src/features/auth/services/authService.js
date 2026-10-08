import { api } from "@/lib/api/client";

export function login(email, password, options = {}) {
  return api.post(
    "/api/Authentications/login",
    {
      email,
      password,
    },
    options,
  );
}

export function adminLogin(email, password, options = {}) {
  return api.post(
    "/api/AdminAuthentications/login",
    {
      email,
      password,
    },
    options,
  );
}

export function refreshToken(options = {}) {
  return api.post("/api/Authentications/refresh-token", undefined, {
    ...options,
    skipAuth: true,
    skipRefresh: true,
  });
}

export function adminRefreshToken(options = {}) {
  return api.post("/api/AdminAuthentications/refresh-token", undefined, {
    ...options,
    skipAuth: true,
    skipRefresh: true,
  });
}

export function validateToken(accessToken, options = {}) {
  return api.post(
    "/api/Authentications/validate-token",
    {
      accessToken,
    },
    options,
  );
}

export function logout(accessToken, options = {}) {
  return api.post("/api/Authentications/logout", undefined, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}

export function adminLogout(accessToken, options = {}) {
  return api.post("/api/AdminAuthentications/logout", undefined, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${accessToken}`,
    },
  });
}