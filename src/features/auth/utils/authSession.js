let accessToken = null;
let refreshHandler = null;
let refreshPromise = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token ?? null;
}

export function clearAccessToken() {
  accessToken = null;
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

  refreshPromise = (async () => {
    try {
      const tokenData = await refreshHandler();
      const nextAccessToken = tokenData?.accessToken ?? null;

      setAccessToken(nextAccessToken);

      return nextAccessToken;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}