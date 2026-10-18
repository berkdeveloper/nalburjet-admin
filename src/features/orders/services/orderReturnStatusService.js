import { adminApi } from "@/lib/api/client";

// Batch read: her list sayfasinda tek ek istek. Yalnizca admin erisebilir.
export function getOrderReturnStatusSummaries(orderIds, options = {}) {
    const ids = [...new Set(orderIds.filter(Boolean))];
    if (ids.length === 0) return Promise.resolve({ data: [] });

    const query = ids.map((id) => `orderIds=${encodeURIComponent(id)}`).join("&");
    return adminApi.get(`/order-return-requests/order-summaries?${query}`, options);
}
