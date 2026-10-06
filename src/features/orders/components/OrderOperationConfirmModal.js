"use client";

import {
    AlertTriangle,
    CheckCircle2,
    LoaderCircle,
    X,
} from "lucide-react";

const OPERATION_CONFIG = {
    confirm: {
        title: "Siparişi Onayla",
        description: "Bu siparişi onaylamak istediğinize emin misiniz?",
        actionLabel: "Siparişi Onayla",
        icon: CheckCircle2,
        iconClassName: "text-primary",
        buttonClassName: "bg-primary text-white hover:bg-primary-hover",
    },
    prepare: {
        title: "Hazırlamaya Başla",
        description:
            "Bu siparişin hazırlık sürecini başlatmak istediğinize emin misiniz?",
        actionLabel: "Hazırlamayı Başlat",
        icon: CheckCircle2,
        iconClassName: "text-primary",
        buttonClassName: "bg-primary text-white hover:bg-primary-hover",
    },
    paymentPaid: {
        title: "Ödeme Alındı",
        description:
            "Bu siparişin ödemesini alındı olarak işaretlemek istediğinize emin misiniz?",
        actionLabel: "Ödemeyi Alındı İşaretle",
        icon: CheckCircle2,
        iconClassName: "text-green-600",
        buttonClassName: "bg-green-600 text-white hover:bg-green-700",
    },
    paymentFailed: {
        title: "Ödeme Başarısız",
        description:
            "Bu siparişin ödemesini başarısız olarak işaretlemek istediğinize emin misiniz?",
        actionLabel: "Ödemeyi Başarısız İşaretle",
        icon: AlertTriangle,
        iconClassName: "text-red-600",
        buttonClassName: "bg-red-600 text-white hover:bg-red-700",
    },
    ship: {
        title: "Kargoya Ver",
        description:
            "Bu siparişin kargoya verildiğini onaylamak istediğinize emin misiniz?",
        actionLabel: "Kargoya Ver",
        icon: CheckCircle2,
        iconClassName: "text-primary",
        buttonClassName: "bg-primary text-white hover:bg-primary-hover",
    },
    deliver: {
        title: "Teslim Edildi",
        description:
            "Bu siparişin müşteriye teslim edildiğini onaylamak istediğinize emin misiniz?",
        actionLabel: "Teslim Edildi",
        icon: CheckCircle2,
        iconClassName: "text-primary",
        buttonClassName: "bg-primary text-white hover:bg-primary-hover",
    },
    complete: {
        title: "Siparişi Tamamla",
        description:
            "Bu siparişi tamamlamak istediğinize emin misiniz?",
        actionLabel: "Siparişi Tamamla",
        icon: CheckCircle2,
        iconClassName: "text-primary",
        buttonClassName: "bg-primary text-white hover:bg-primary-hover",
    },
    cancel: {
        title: "Siparişi İptal Et",
        description:
            "Bu siparişi iptal etmek istediğinize emin misiniz?",
        actionLabel: "Siparişi İptal Et",
        icon: AlertTriangle,
        iconClassName: "text-red-600",
        buttonClassName: "bg-red-600 text-white hover:bg-red-700",
    },
};

function formatPrice(value) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(value ?? 0);
}

function getFullName(address) {
    const firstName = address?.firstName?.trim() || "";
    const lastName = address?.lastName?.trim() || "";

    return `${firstName} ${lastName}`.trim() || "—";
}

export default function OrderOperationConfirmModal({
    order,
    operation,
    onClose,
    onConfirm,
    isLoading = false,
}) {
    if (!order || !operation) {
        return null;
    }

    const config = OPERATION_CONFIG[operation];

    if (!config) {
        return null;
    }

    const Icon = config.icon;
    const customerName = getFullName(order.shippingAddress);

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-operation-confirm-title"
        >
            <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div className="flex items-center gap-3">
                        <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background-soft ${config.iconClassName}`}
                        >
                            <Icon className="h-5 w-5" />
                        </div>

                        <h2
                            id="order-operation-confirm-title"
                            className="text-lg font-semibold text-text-primary"
                        >
                            {config.title}
                        </h2>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-soft hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Kapat"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-5 px-5 py-6">
                    <p className="text-sm leading-6 text-text-secondary">
                        {config.description}
                    </p>

                    <div className="rounded-lg border border-border bg-background-soft p-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs font-medium text-text-secondary">
                                    Sipariş No
                                </p>

                                <p className="mt-1 text-sm font-semibold text-text-primary">
                                    {order.orderNumber || "—"}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-medium text-text-secondary">
                                    Toplam Tutar
                                </p>

                                <p className="mt-1 text-sm font-semibold text-text-primary">
                                    {formatPrice(order.grandTotal)}
                                </p>
                            </div>

                            <div className="col-span-2">
                                <p className="text-xs font-medium text-text-secondary">
                                    Müşteri
                                </p>

                                <p className="mt-1 text-sm font-semibold text-text-primary">
                                    {customerName}
                                </p>
                            </div>
                        </div>
                    </div>

                    {operation === "cancel" && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm font-medium leading-5 text-red-700">
                                Dikkat: Sipariş iptal edildikten sonra tekrar
                                aktif hale getirilemez.
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-border bg-background-soft px-5 py-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-white px-4 text-sm font-medium text-text-primary transition-colors hover:bg-background-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Vazgeç
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${config.buttonClassName}`}
                    >
                        {isLoading && (
                            <LoaderCircle className="h-4 w-4 animate-spin" />
                        )}

                        {config.actionLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}