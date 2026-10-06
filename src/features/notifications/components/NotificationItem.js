"use client";

import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { useNotifications } from "@/features/notifications/context/NotificationContext";

function formatPrice(value) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(value ?? 0);
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export default function NotificationItem({
    notification,
    isUnread,
}) {
    const { markAsRead } = useNotifications();

    function handleClick() {
        if (isUnread) {
            markAsRead(notification.orderId);
        }
    }

    return (
        <div
            className={`rounded-xl border border-border p-4 transition-colors ${
                isUnread
                    ? "bg-primary/5"
                    : "bg-white"
            }`}
        >
            <div className="flex items-start gap-4">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                        isUnread
                            ? "bg-primary/10 text-primary"
                            : "bg-background-soft text-text-secondary"
                    }`}
                >
                    <ShoppingCart size={20} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-text-primary">
                                Yeni Sipariş
                            </h3>

                            {isUnread && (
                                <>
                                    <span className="h-2 w-2 rounded-full bg-primary" />

                                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                        Yeni
                                    </span>
                                </>
                            )}
                        </div>

                        <span className="text-xs text-text-secondary">
                            {formatDate(
                                notification.createdDate,
                            )}
                        </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1">
                        <p className="text-sm text-text-secondary">
                            Sipariş:
                            <span className="ml-1 font-medium text-text-primary">
                                #
                                {
                                    notification.orderNumber
                                }
                            </span>
                        </p>

                        <p className="text-sm text-text-secondary">
                            Tutar:
                            <span className="ml-1 font-semibold text-text-primary">
                                {formatPrice(
                                    notification.grandTotal,
                                )}
                            </span>
                        </p>
                    </div>

                    <div className="mt-3">
                        <Link
                            href={`/siparisler/${notification.orderId}`}
                            onClick={handleClick}
                            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
                        >
                            Siparişe Git
                            <ArrowRight size={14} />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}