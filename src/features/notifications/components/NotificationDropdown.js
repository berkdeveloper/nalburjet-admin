"use client";

import Link from "next/link";
import { ArrowRight, ShoppingCart } from "lucide-react";
import { NOTIFICATION_DROPDOWN_LIMIT } from "@/features/notifications/constants/notificationConstants";
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

export default function NotificationDropdown({ onClose }) {
    const { unreadNotifications, markAsRead } = useNotifications();

    const notifications = unreadNotifications.slice(0, NOTIFICATION_DROPDOWN_LIMIT);

    function handleNotificationClick(orderId) {
        markAsRead(orderId);
        onClose();
    }

    return (
        <div className="fixed left-4 right-4 top-16 z-50 max-h-[calc(100dvh-5rem)] overflow-hidden rounded-xl border border-border bg-white shadow-lg sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:max-h-none sm:w-96">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
                <h2 className="text-sm font-semibold text-text-primary">
                    Bildirimler
                </h2>

                {unreadNotifications.length > 0 && (
                    <span className="shrink-0 text-xs text-text-secondary">
                        {unreadNotifications.length} okunmamış
                    </span>
                )}
            </div>

            {notifications.length > 0 ? (
                <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto sm:max-h-96">
                    {notifications.map((notification) => (
                        <Link
                            key={notification.orderId}
                            href={`/siparisler/${notification.orderId}`}
                            onClick={() => handleNotificationClick(notification.orderId)}
                            className="block border-b border-border px-3 py-3 transition-colors hover:bg-background-soft sm:px-4"
                        >
                            <div className="flex gap-3">
                                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <ShoppingCart size={16} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-sm font-semibold text-text-primary">
                                            Yeni Sipariş
                                        </p>

                                        <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                                    </div>

                                    <p className="mt-1 break-words text-sm text-text-secondary">
                                        #{notification.orderNumber}
                                    </p>

                                    <div className="mt-1 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                        <span className="text-sm font-medium text-text-primary">
                                            {formatPrice(notification.grandTotal)}
                                        </span>

                                        <span className="text-xs text-text-secondary">
                                            {formatDate(notification.createdDate)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="px-4 py-8 text-center">
                    <p className="text-sm text-text-secondary">
                        Okunmamış bildiriminiz yok.
                    </p>
                </div>
            )}

            <div className="border-t border-border">
                <Link
                    href="/bildirimler"
                    onClick={onClose}
                    className="flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium text-primary transition-colors hover:bg-background-soft"
                >
                    <span>Tüm Bildirimleri Gör</span>
                    <ArrowRight size={16} className="shrink-0" />
                </Link>
            </div>
        </div>
    );
}