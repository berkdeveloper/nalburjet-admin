import { ADMIN_API_BASE_URL, API_BASE_URL } from "./config";
import { ApiError } from "./errors";
import {
  getAccessToken,
  ensureAccessToken,
  refreshAccessToken,
} from "@/features/auth/utils/authSession";
import { isTokenExpired } from "@/features/auth/utils/token";

function buildUrl(baseUrl, endpoint, params) {
  const url = new URL(`${baseUrl}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }

  return url.toString();
}

function buildHeaders(headers = {}, accessToken = null, isFormData = false) {
  const result = new Headers(headers);
  if (!isFormData && !result.has("Content-Type")) {
    result.set("Content-Type", "application/json");
  }
  if (accessToken) result.set("Authorization", `Bearer ${accessToken}`);
  return result;
}

async function parseResponse(response) {
  const contentType = response.headers.get("content-type");

  return contentType?.includes("application/json")
    ? await response.json()
    : await response.text();
}

function getErrorMessage(data) {
  return typeof data === "object" && data?.error?.message
    ? data.error.message
    : typeof data === "object" && data?.message
      ? data.message
      : "API request failed.";
}

async function executeRequest(
  url,
  requestOptions,
  accessToken = null,
  isFormData = false,
) {
  try {
    return await fetch(url, {
      ...requestOptions,
      credentials: "include",
      headers: buildHeaders(
        requestOptions.headers,
        accessToken,
        isFormData,
      ),
    });
  } catch (error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") throw error;
    throw new ApiError("Sunucuya ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.", 0);
  }
}

async function apiRequest(baseUrl, endpoint, options = {}) {
  const {
    params,
    skipAuth = false,
    skipRefresh = false,
    isFormData = false,
    responseType,
    ...requestOptions
  } = options;

  const url = buildUrl(baseUrl, endpoint, params);
  const currentAccessToken = skipAuth ? null : await ensureAccessToken();
  if (!skipAuth && !currentAccessToken) {
    throw new ApiError("Yönetici oturumunuz sona erdi. Lütfen tekrar giriş yapın.", 401);
  }

  let response = await executeRequest(
    url,
    requestOptions,
    currentAccessToken,
    isFormData,
  );

  if (response.status === 401 && !skipAuth && !skipRefresh) {
    const latestToken = getAccessToken();
    const newAccessToken = latestToken && latestToken !== currentAccessToken && !isTokenExpired(latestToken)
      ? latestToken
      : await refreshAccessToken();

    if (newAccessToken) {
      response = await executeRequest(
        url,
        requestOptions,
        newAccessToken,
        isFormData,
      );
    }
  }

  const data = response.ok && responseType === "blob"
    ? await response.blob()
    : await parseResponse(response);

  if (!response.ok) {
    throw new ApiError(
      getErrorMessage(data),
      response.status,
      data,
    );
  }

  return data;
}

function createApi(baseUrl) {
  return {
    get(endpoint, options = {}) {
      return apiRequest(baseUrl, endpoint, {
        ...options,
        method: "GET",
      });
    },

    post(endpoint, body, options = {}) {
      return apiRequest(baseUrl, endpoint, {
        ...options,
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    postForm(endpoint, formData, options = {}) {
      return apiRequest(baseUrl, endpoint, {
        ...options,
        method: "POST",
        body: formData,
        isFormData: true,
      });
    },

    put(endpoint, body, options = {}) {
      return apiRequest(baseUrl, endpoint, {
        ...options,
        method: "PUT",
        body: JSON.stringify(body),
      });
    },

    putForm(endpoint, formData, options = {}) {
      return apiRequest(baseUrl, endpoint, {
        ...options,
        method: "PUT",
        body: formData,
        isFormData: true,
      });
    },

    patch(endpoint, body, options = {}) {
      return apiRequest(baseUrl, endpoint, {
        ...options,
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },

    del(endpoint, options = {}) {
      return apiRequest(baseUrl, endpoint, {
        ...options,
        method: "DELETE",
      });
    },

    delWithBody(endpoint, body, options = {}) {
      return apiRequest(baseUrl, endpoint, {
        ...options,
        method: "DELETE",
        body: JSON.stringify(body),
      });
    },
  };
}

export const api = createApi(API_BASE_URL);
export const adminApi = createApi(ADMIN_API_BASE_URL);
