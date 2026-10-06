const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
const ADMIN_API_BASE_URL = process.env.NEXT_PUBLIC_ADMIN_API_BASE_URL?.replace(/\/$/, "");

if (!API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_API_BASE_URL environment variable is not defined.");
}

if (!ADMIN_API_BASE_URL) {
  throw new Error("NEXT_PUBLIC_ADMIN_API_BASE_URL environment variable is not defined.");
}

export { API_BASE_URL, ADMIN_API_BASE_URL };