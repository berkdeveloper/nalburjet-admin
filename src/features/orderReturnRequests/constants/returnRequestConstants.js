export const REQUEST_TYPES = [
    { value: "", label: "Tüm türler" },
    { value: 1, label: "İptal" },
    { value: 2, label: "İade" },
];

export const REQUEST_STATUSES = [
    { value: "", label: "Tüm durumlar" },
    { value: 0, label: "Taslak" },
    { value: 1, label: "Beklemede" },
    { value: 2, label: "Reddedildi" },
    { value: 3, label: "Onaylandı" },
    { value: 4, label: "Finansal iade sürecinde" },
    { value: 5, label: "Doğrulama gerekli" },
    { value: 6, label: "İade başarısız" },
    { value: 7, label: "Manuel iade bekleniyor" },
    { value: 8, label: "İade tamamlandı" },
    { value: 9, label: "İadesiz tamamlandı" },
];

const STATUS_BY_NAME = {
    Draft: 0,
    Pending: 1,
    Rejected: 2,
    Approved: 3,
    RefundProcessing: 4,
    RefundVerificationRequired: 5,
    RefundFailed: 6,
    ManualRefundPending: 7,
    Refunded: 8,
    CompletedWithoutRefund: 9,
};

const TYPE_BY_NAME = { Cancellation: 1, Return: 2 };

export function normalizeStatus(value) {
    if (typeof value === "number") return value;
    if (value === null || value === undefined) return null;
    if (Object.hasOwn(STATUS_BY_NAME, String(value))) return STATUS_BY_NAME[String(value)];
    const numeric = Number(value);
    return Number.isInteger(numeric) && String(value).trim() !== "" ? numeric : null;
}

export function normalizeType(value) {
    if (typeof value === "number") return value;
    if (Object.hasOwn(TYPE_BY_NAME, String(value))) return TYPE_BY_NAME[String(value)];
    const numeric = Number(value);
    return Number.isInteger(numeric) && String(value).trim() !== "" ? numeric : null;
}

export function getStatusLabel(value) {
    return REQUEST_STATUSES.find((x) => x.value === normalizeStatus(value))?.label ?? String(value ?? "—");
}

export function getTypeLabel(value) {
    return REQUEST_TYPES.find((x) => x.value === normalizeType(value))?.label ?? String(value ?? "—");
}

export function getStatusClasses(value) {
    switch (normalizeStatus(value)) {
        case 1: return "bg-amber-50 text-amber-800 border-amber-200";
        case 2:
        case 6: return "bg-red-50 text-red-700 border-red-200";
        case 3:
        case 8:
        case 9: return "bg-green-50 text-green-700 border-green-200";
        case 4:
        case 5:
        case 7: return "bg-blue-50 text-blue-700 border-blue-200";
        default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
}

export function formatMoney(value) {
    const amount = Number(value);
    return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
    }).format(date);
}
