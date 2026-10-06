import { adminApi } from "@/lib/api/client";

export function getShippingMethods(options = {}) {
    return adminApi.get("/ShippingMethods", options);
}

export function getShippingMethodById(id, options = {}) {
    return adminApi.get(`/ShippingMethods/${id}`, options);
}

export function createShippingMethod(data, options = {}) {
    return adminApi.post("/ShippingMethods", data, options);
}

export function updateShippingMethod(data, options = {}) {
    return adminApi.put("/ShippingMethods", data, options);
}

export function deleteShippingMethod(id, options = {}) {
    return adminApi.del(`/ShippingMethods/${id}`, options);
}

export function activateShippingMethod(id, options = {}) {
    return adminApi.patch(`/ShippingMethods/${id}/activate`, undefined, options);
}

export function deactivateShippingMethod(id, options = {}) {
    return adminApi.patch(`/ShippingMethods/${id}/deactivate`, undefined, options);
}