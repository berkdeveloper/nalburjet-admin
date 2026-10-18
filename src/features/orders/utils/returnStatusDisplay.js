const numericStatuses = [
    "Draft", "Pending", "Rejected", "Approved", "RefundProcessing",
    "RefundVerificationRequired", "RefundFailed", "ManualRefundPending",
    "Refunded", "CompletedWithoutRefund",
];

export function getReturnStatusNotice(request, orderStatus = null) {
    if (!request) return null;
    const status = typeof request.status === "number" ? numericStatuses[request.status] : request.status;
    const isCancellation = request.requestType === "Cancellation" || request.requestType === 1;
    const prefix = isCancellation ? "İptal" : "İade";
    // Ana siparis gercekten iptal edilmis ise ayni rozeti iki kez gosterme.
    if (isCancellation && status === "Refunded" && orderStatus === "Cancelled") return null;

    const labels = {
        Draft: "Taslak",
        Pending: "İnceleniyor",
        Rejected: "Talebi Reddedildi",
        Approved: "Onaylandı - Ücret İadesi Bekleniyor",
        RefundProcessing: "Ücret İadesi İşleniyor",
        RefundVerificationRequired: "İade Doğrulanıyor",
        RefundFailed: "Ücret İadesinde Sorun Var",
        ManualRefundPending: "Manuel İade Bekleniyor",
        Refunded: isCancellation ? "İptal Talebinde İade Tamamlandı" : "İade Edildi",
        CompletedWithoutRefund: "İadesiz Tamamlandı",
    };
    const label = status === "Rejected" ? `${prefix} ${labels.Rejected}` :
        status === "Refunded" ? labels.Refunded : `${prefix}: ${labels[status] ?? "İnceleniyor"}`;

    const className = status === "Refunded" ? "bg-green-50 text-green-800 border-green-200" :
        status === "Rejected" || status === "RefundFailed" ? "bg-red-50 text-red-800 border-red-200" :
            status === "Approved" || status === "RefundProcessing" || status === "RefundVerificationRequired" || status === "ManualRefundPending"
                ? "bg-amber-50 text-amber-800 border-amber-200"
                : "bg-blue-50 text-blue-800 border-blue-200";

    return { label, className, status };
}
