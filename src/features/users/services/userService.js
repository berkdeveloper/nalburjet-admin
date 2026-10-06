import { adminApi } from "@/lib/api/client";

export function getUsers(options = {}) {
    return adminApi.get("/Users", options);
}

export function getUserById(id, options = {}) {
    return adminApi.get(`/Users/${id}`, options);
}

export function changeUserRole(data, options = {}) {
    return adminApi.put("/Users/change-role", data, options);
}

export function deleteUser(id, options = {}) {
    return adminApi.del(`/Users/${id}`, options);
}