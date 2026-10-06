import { adminApi } from "@/lib/api/client";

export function getRoles(options = {}) {
    return adminApi.get("/Roles", options);
}

export function getRoleById(id, options = {}) {
    return adminApi.get(`/Roles/${id}`, options);
}

export function createRole(data, options = {}) {
    return adminApi.post("/Roles", data, options);
}

export function updateRole(data, options = {}) {
    return adminApi.put("/Roles", data, options);
}

export function deleteRole(id, options = {}) {
    return adminApi.del(`/Roles/${id}`, options);
}