import { adminApi } from "@/lib/api/client";

export function getOrderReturnRequests(options = {}) {
    return adminApi.get("/order-return-requests", options);
}

export function getOrderReturnRequestById(id, options = {}) {
    return adminApi.get(`/order-return-requests/${encodeURIComponent(id)}`, options);
}

export function approveOrderReturnRequest(id, approvedRefundAmount, adminNote = null, options = {}) {
    return adminApi.post(`/order-return-requests/${encodeURIComponent(id)}/approve`, {
        approvedRefundAmount, adminNote,
    }, options);
}

export function rejectOrderReturnRequest(id, reason, options = {}) {
    return adminApi.post(`/order-return-requests/${encodeURIComponent(id)}/reject`, { reason }, options);
}

// Yalnızca DB'de finansal iade kaydını hazırlar; PayTR'ye para göndermez.
export function preparePaymentRefund(requestId, options = {}) {
    return adminApi.post(`/order-return-requests/${encodeURIComponent(requestId)}/refund/prepare`, null, options);
}

// Okuma amaçlı sağlayıcı durumu sorgusu. Hazırlanmış iadede kullanılamaz.
export function verifyPaymentRefund(refundId, options = {}) {
    return adminApi.post(`/payment-refunds/${encodeURIComponent(refundId)}/verify`, null, options);
}

export function reconcilePaymentRefund(refundId, options = {}) {
    return adminApi.post(`/payment-refunds/${encodeURIComponent(refundId)}/reconcile`, null, options);
}

// İkinci Attempt'i hazırlar; PayTR'ye para göndermez.
export function preparePaymentRefundRetry(refundId, approvalReason, providerConfirmationReference, options = {}) {
    return adminApi.post(`/payment-refunds/${encodeURIComponent(refundId)}/retry/prepare`, {
        approvalReason, providerConfirmationReference,
    }, options);
}

// Iki asamali admin akisinin 2. butonu: prepare (transaction) + PayTR submit.
export function executePaymentRefund(requestId, options = {}) {
    return adminApi.post(`/order-return-requests/${encodeURIComponent(requestId)}/refund/execute`, null, options);
}

// Yalnizca kayitli finansal iadenin mevcut durumunu okur.
export function getPaymentRefundByReturnRequest(requestId, options = {}) {
    return adminApi.get(`/order-return-requests/${encodeURIComponent(requestId)}/refund`, options);
}

// Belgeli başarısız iade için retry hazırlığı + yeni Attempt üzerinden PayTR gönderimi.
// İlk gönderim endpoint'inden AYRIDIR; eski iade yeniden gönderilmez.
export function executePaymentRefundRetry(refundId, approvalReason, providerConfirmationReference, options = {}) {
    return adminApi.post(`/payment-refunds/${encodeURIComponent(refundId)}/retry/execute`, {
        approvalReason, providerConfirmationReference,
    }, options);
}

// EFT/Havale: banka uzerinden gerceklestirilmis iadenin admin tarafindan tamamlandigini kaydeder.
// Para transferi YAPMAZ. Idari onaydan once dekontun dogrulandigindan emin olun.
export function completeManualBankRefund(requestId, { bankTransferReference, transferredAtUtc, adminNote = null }, options = {}) {
    return adminApi.post(`/order-return-requests/${encodeURIComponent(requestId)}/refund/manual/complete`, {
        bankTransferReference, transferredAtUtc, adminNote,
    }, options);
}
