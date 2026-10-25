import { isTokenExpired } from "./token";

let accessToken = null;
let refreshHandler = null;
let refreshPromise = null;
let sessionGeneration = 0;

export function getSessionGeneration() {
  return sessionGeneration;
}

export function isAuthenticationFailure(error) {
  return error?.status === 401 || error?.status === 403;
}

export function withAdminSessionLock(action) {
  if (typeof navigator !== "undefined" && navigator.locks?.request) {
    return navigator.locks.request("nalburjet-admin-session", action);
  }

  return action();
}

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token ?? null;
}

export function clearAccessToken() {
  accessToken = null;
  sessionGeneration++;
}

export function setRefreshHandler(handler) {
  refreshHandler = handler;
}

export function clearRefreshHandler() {
  refreshHandler = null;
}

export async function refreshAccessToken() {
  if (!refreshHandler) {
    return null;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  const generation = sessionGeneration;
  const handler = refreshHandler;
  const operation = Promise.resolve().then(async () => {
    const tokenData = await handler();
    if (generation !== sessionGeneration) return null;

    const nextAccessToken = tokenData?.accessToken ?? null;
    setAccessToken(nextAccessToken);
    return nextAccessToken;
  });

  refreshPromise = operation;
  try {
    return await operation;
  } finally {
    if (refreshPromise === operation) {
      refreshPromise = null;
    }
  }
}

export async function ensureAccessToken() {
  if (accessToken && !isTokenExpired(accessToken, 60_000)) return accessToken;

  try {
    return await refreshAccessToken();
  } catch (error) {
    // A temporary refresh failure must not discard an access token that is still valid.
    if (!isAuthenticationFailure(error) && accessToken && !isTokenExpired(accessToken)) {
      return accessToken;
    }
    throw error;
  }
}
