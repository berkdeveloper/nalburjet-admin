import { adminApi } from "@/lib/api/client";

export function getOrders(options = {}) {
    return adminApi.get("/Orders", options);
}

export function getOrderById(id, options = {}) {
    return adminApi.get(`/Orders/${id}`, options);
}

export function confirmOrder(id, options = {}) {
    return adminApi.post(`/Orders/${id}/confirm`, null, options);
}

export function prepareOrder(id, options = {}) {
    return adminApi.post(`/Orders/${id}/preparing`, null, options);
}

export function cancelOrder(id, options = {}) {
    return adminApi.post(`/Orders/${id}/cancel`, null, options);
}

export function markOrderPaymentAsPaid(id, options = {}) {
    return adminApi.post(`/Orders/${id}/payment/paid`, null, options);
}

export function markOrderPaymentAsFailed(id, options = {}) {
    return adminApi.post(`/Orders/${id}/payment/failed`, null, options);
}

export function shipOrder(id, options = {}) {
    return adminApi.post(`/Orders/${id}/shipped`, null, options);
}

export function deliverOrder(id, options = {}) {
    return adminApi.post(`/Orders/${id}/delivered`, null, options);
}

export function completeOrder(id, options = {}) {
    return adminApi.post(`/Orders/${id}/complete`, null, options);
}

export function updateOrderNotes(id, orderNotes, options = {}) {
    return adminApi.put(
        `/Orders/${id}/notes`,
        {
            id,
            orderNotes,
        },
        options,
    );
}