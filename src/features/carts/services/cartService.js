import { adminApi } from "@/lib/api/client";

export function getCarts(options = {}) {
    return adminApi.get("/Carts", options);
}

export function getCartById(id, options = {}) {
    return adminApi.get(`/Carts/${id}`, options);
}

export function deleteCartItems(data, options = {}) {
    return adminApi.delWithBody("/Carts/items", data, options);
}