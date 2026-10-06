import { adminApi } from "@/lib/api/client";

export function getCategories(options = {}) {
  return adminApi.get("/Categories", options);
}

export function createCategory(data, options = {}) {
  return adminApi.post("/Categories", data, options);
}

export function updateCategory(data, options = {}) {
  return adminApi.put("/Categories", data, options);
}

export function deleteCategory(id, options = {}) {
  return adminApi.del(`/Categories/${id}`, options);
}

export function activateCategory(id, options = {}) {
  return adminApi.patch(`/Categories/${id}/activate`, undefined, options);
}

export function deactivateCategory(id, options = {}) {
  return adminApi.patch(`/Categories/${id}/deactivate`, undefined, options);
}