import { adminApi } from "@/lib/api/client";

export function getOrders(options = {}) {
    return adminApi.get("/Orders", { ...options, cache: "no-store" });
}

export function getOrderById(id, options = {}) {
    return adminApi.get(`/Orders/${id}`, options);
}

export function getOrderInvoicePreparation(id, options = {}) {
    return adminApi.get(`/Faturaport/orders/${id}/preparation`, options);
}

export function getTestInvoicePreparation(options = {}) {
    return adminApi.post("/Faturaport/test-scenario/preparation", null, options);
}

export function getOrderInvoiceState(id, options = {}) {
    return adminApi.get(`/Faturaport/orders/${id}/invoice`, options);
}
export function createOrderInvoiceDraft(id, options = {}) {
    return adminApi.post(`/Faturaport/orders/${id}/invoice/draft`, null, options);
}
export function finalizeOrderInvoice(id, options = {}) {
    return adminApi.post(`/Faturaport/orders/${id}/invoice/finalize`, null, options);
}
export function refreshOrderInvoice(id, options = {}) {
    return adminApi.post(`/Faturaport/orders/${id}/invoice/refresh`, null, options);
}
export function getOrderInvoiceFile(id, xml = false, options = {}) {
    return adminApi.get(`/Faturaport/orders/${id}/invoice/file`, {
        ...options, params: { xml }, responseType: "blob",
    });
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
