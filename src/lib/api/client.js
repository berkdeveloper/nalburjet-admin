import { ADMIN_API_BASE_URL, API_BASE_URL } from "./config";
import { ApiError } from "./errors";
import {
  getAccessToken,
  refreshAccessToken,
} from "@/features/auth/utils/authSession";

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
  return {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(accessToken
      ? {
        Authorization: `Bearer ${accessToken}`,
      }
      : {}),
    ...headers,
  };
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
  return fetch(url, {
    ...requestOptions,
    credentials: "include",
    headers: buildHeaders(
      requestOptions.headers,
      accessToken,
      isFormData,
    ),
  });
}

async function apiRequest(baseUrl, endpoint, options = {}) {
  const {
    params,
    skipAuth = false,
    skipRefresh = false,
    isFormData = false,
    ...requestOptions
  } = options;

  const url = buildUrl(baseUrl, endpoint, params);
  const currentAccessToken = skipAuth ? null : getAccessToken();

  let response = await executeRequest(
    url,
    requestOptions,
    currentAccessToken,
    isFormData,
  );

  if (response.status === 401 && !skipRefresh) {
    try {
      const newAccessToken = await refreshAccessToken();

      if (newAccessToken) {
        response = await executeRequest(
          url,
          requestOptions,
          newAccessToken,
          isFormData,
        );
      }
    } catch {
      // Refresh başarısız olduğunda orijinal 401 response'u işlenir.
    }
  }

  const data = await parseResponse(response);

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