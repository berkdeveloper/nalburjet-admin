import { API_BASE_URL } from "./config";

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export function getProductImageUrl(storageKey) {
  if (!storageKey) {
    return null;
  }

  return `${API_ORIGIN}/uploads/${storageKey}`;
}