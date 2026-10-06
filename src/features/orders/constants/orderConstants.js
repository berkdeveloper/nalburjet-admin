export const ORDER_FREE_SHIPPING_THRESHOLD = 3000;

export const ORDER_STATUS = {
    PENDING: "Pending",
    CONFIRMED: "Confirmed",
    PREPARING: "Preparing",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
};

export const ORDER_STATUS_LABELS = {
    [ORDER_STATUS.PENDING]: "Beklemede",
    [ORDER_STATUS.CONFIRMED]: "Onaylandı",
    [ORDER_STATUS.PREPARING]: "Hazırlanıyor",
    [ORDER_STATUS.COMPLETED]: "Tamamlandı",
    [ORDER_STATUS.CANCELLED]: "İptal Edildi",
};

export const PAYMENT_STATUS = {
    PENDING: "Pending",
    PAID: "Paid",
    FAILED: "Failed",
};

export const PAYMENT_STATUS_LABELS = {
    [PAYMENT_STATUS.PENDING]: "Beklemede",
    [PAYMENT_STATUS.PAID]: "Ödendi",
    [PAYMENT_STATUS.FAILED]: "Başarısız",
};

export const DELIVERY_STATUS = {
    PENDING: "Pending",
    SHIPPED: "Shipped",
    DELIVERED: "Delivered",
};

export const DELIVERY_STATUS_LABELS = {
    [DELIVERY_STATUS.PENDING]: "Beklemede",
    [DELIVERY_STATUS.SHIPPED]: "Kargoya Verildi",
    [DELIVERY_STATUS.DELIVERED]: "Teslim Edildi",
};

export const ORDER_LIST_STATUS = {
    ALL: "All",
    ACTIVE: "Active",
    PAST: "Past",
};

export const ORDER_LIST_STATUS_LABELS = {
    [ORDER_LIST_STATUS.ALL]: "Tümü",
    [ORDER_LIST_STATUS.ACTIVE]: "Devam Eden",
    [ORDER_LIST_STATUS.PAST]: "Geçmiş",
};

export const PAYMENT_METHOD = {
    BANK_TRANSFER: "BankTransfer",
    PAYTR: "PayTR",
};

export const PAYMENT_METHOD_LABELS = {
    [PAYMENT_METHOD.BANK_TRANSFER]: "EFT/Havale",
    [PAYMENT_METHOD.PAYTR]: "PayTR",
};