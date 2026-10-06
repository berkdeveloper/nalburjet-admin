"use client";

import Link from "next/link";
import {
    ArrowRight,
    Check,
    ShoppingCart,
    X,
} from "lucide-react";
import { useNotifications } from "@/features/notifications/context/NotificationContext";

function formatPrice(value) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(value ?? 0);
}

function formatDate(value) {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

export default function NotificationPopup() {
    const {
        latestNotification,
        isPopupVisible,
        markAsRead,
        closePopup,
    } = useNotifications();

    if (!isPopupVisible || !latestNotification) {
        return null;
    }

    function handleMarkAsRead() {
        markAsRead(latestNotification.orderId);
        closePopup();
    }

    return (
        <div className="fixed bottom-6 right-6 z-50 w-96 overflow-hidden rounded-xl bg-green-600 text-white shadow-2xl">
            <div className="relative p-5">
                <button
                    type="button"
                    onClick={closePopup}
                    className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white transition-colors hover:bg-red-700"
                    aria-label="Bildirimi kapat"
                >
                    <X size={16} />
                </button>

                <div className="flex items-start gap-3 pr-8">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20">
                        <ShoppingCart size={20} />
                    </div>

                    <div className="min-w-0">
                        <p className="text-sm font-semibold">
                            Yeni Sipariş Geldi
                        </p>

                        <p className="mt-1 text-lg font-bold">
                            #
                            {
                                latestNotification.orderNumber
                            }
                        </p>

                        <p className="mt-1 text-sm text-white/80">
                            {formatDate(
                                latestNotification.audit
                                    ?.createdDate,
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
                    <span className="text-sm text-white/80">
                        Sipariş Tutarı
                    </span>

                    <span className="font-semibold">
                        {formatPrice(
                            latestNotification.grandTotal,
                        )}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-3 border-t border-white/20">
                <Link
                    href="/bildirimler"
                    onClick={closePopup}
                    className="flex items-center justify-center gap-1 px-2 py-3 text-center text-xs font-medium transition-colors hover:bg-white/10"
                >
                    <span>
                        Tüm Bildirimleri Gör
                    </span>
                </Link>

                <button
                    type="button"
                    onClick={handleMarkAsRead}
                    className="flex items-center justify-center gap-1 border-l border-white/20 px-2 py-3 text-center text-xs font-medium transition-colors hover:bg-white/10"
                >
                    <Check size={14} />

                    <span>
                        Okundu Olarak İşaretle
                    </span>
                </button>

                <Link
                    href={`/siparisler/${latestNotification.orderId}`}
                    onClick={() => {
                        markAsRead(
                            latestNotification.orderId,
                        );
                        closePopup();
                    }}
                    className="flex items-center justify-center gap-1 border-l border-white/20 px-2 py-3 text-center text-xs font-medium transition-colors hover:bg-white/10"
                >
                    <span>
                        Siparişe Git
                    </span>

                    <ArrowRight size={14} />
                </Link>
            </div>
        </div>
    );
}