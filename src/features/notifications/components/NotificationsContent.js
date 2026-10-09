"use client";

import Link from "next/link";
import {
    CheckCheck,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Filter,
    LoaderCircle,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useNotifications } from "@/features/notifications/context/NotificationContext";
import { getOrders } from "@/features/orders/services/orderService";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const SORT_OPTIONS = [
    {
        value: "CreatedDate",
        label: "Tarih",
    },
    {
        value: "GrandTotal",
        label: "Sipariş Tutarı",
    },
    {
        value: "CustomerName",
        label: "Müşteri Adı",
    },
];

const SORT_DIRECTION_OPTIONS = [
    {
        value: "Descending",
        label: "Azalan",
    },
    {
        value: "Ascending",
        label: "Artan",
    },
];

function formatPrice(value) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(value ?? 0);
}

function formatOrderDate(value) {
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

function getCustomerName(order) {
    const firstName =
        order.shippingAddress?.firstName?.trim() || "";

    const lastName =
        order.shippingAddress?.lastName?.trim() || "";

    return (
        `${firstName} ${lastName}`.trim() ||
        "Müşteri"
    );
}

export default function NotificationsPage() {
    const {
        isLoading: isAuthLoading,
    } = useAuth();

    const {
        unreadNotifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
    } = useNotifications();

    const [orders, setOrders] = useState([]);

    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [sortBy, setSortBy] =
        useState("CreatedDate");

    const [sortDirection, setSortDirection] =
        useState("Descending");

    const [pagination, setPagination] = useState({
        size: 10,
        index: 0,
        count: 0,
        pages: 0,
        hasPrevious: false,
        hasNext: false,
    });

    const [orderNumber, setOrderNumber] =
        useState("");

    const [showFilters, setShowFilters] =
        useState(false);

    const [isLoading, setIsLoading] =
        useState(true);

    const [isRefreshing, setIsRefreshing] =
        useState(false);

    const [error, setError] = useState("");

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        let isCancelled = false;

        async function loadNotifications() {
            try {
                if (orders.length === 0) {
                    setIsLoading(true);
                } else {
                    setIsRefreshing(true);
                }

                setError("");

                const params = {
                    "PageRequest.PageIndex": pageIndex,
                    "PageRequest.PageSize": pageSize,
                    Status: "All",
                    SortBy: sortBy,
                    SortDirection: sortDirection,
                };

                if (orderNumber.trim()) {
                    params.OrderNumber =
                        orderNumber.trim();
                }

                const response = await getOrders({
                    params,
                });

                if (isCancelled) {
                    return;
                }

                setOrders(response?.items ?? []);

                setPagination({
                    size: response?.size ?? pageSize,
                    index: response?.index ?? pageIndex,
                    count: response?.count ?? 0,
                    pages: response?.pages ?? 0,
                    hasPrevious:
                        response?.hasPrevious === true,
                    hasNext:
                        response?.hasNext === true,
                });
            } catch (requestError) {
                console.error(
                    "Bildirimler yüklenemedi:",
                    requestError,
                );

                if (!isCancelled) {
                    setOrders([]);

                    setPagination({
                        size: pageSize,
                        index: pageIndex,
                        count: 0,
                        pages: 0,
                        hasPrevious: false,
                        hasNext: false,
                    });

                    setError(
                        requestError?.message ||
                        "Bildirimler yüklenirken bir hata oluştu.",
                    );
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
            }
        }

        loadNotifications();

        return () => {
            isCancelled = true;
        };
    }, [
        isAuthLoading,
        orderNumber,
        pageIndex,
        pageSize,
        sortBy,
        sortDirection,
    ]);

    const unreadOrderIdSet = useMemo(
        () =>
            new Set(
                unreadNotifications.map(
                    (notification) =>
                        notification.orderId,
                ),
            ),
        [unreadNotifications],
    );

    const hasFilters =
        orderNumber.trim().length > 0;

    function handleOrderNumberChange(event) {
        setOrderNumber(event.target.value);
        setPageIndex(0);
    }

    function clearOrderNumber() {
        setOrderNumber("");
        setPageIndex(0);
    }

    function clearFilters() {
        setOrderNumber("");
        setPageIndex(0);
    }

    function handlePageSizeChange(event) {
        setPageSize(
            Number(event.target.value),
        );

        setPageIndex(0);
    }

    function handleSortByChange(event) {
        setSortBy(event.target.value);
        setPageIndex(0);
    }

    function handleSortDirectionChange(event) {
        setSortDirection(event.target.value);
        setPageIndex(0);
    }

    function handlePreviousPage() {
        if (pagination.hasPrevious) {
            setPageIndex(
                (current) => current - 1,
            );
        }
    }

    function handleNextPage() {
        if (pagination.hasNext) {
            setPageIndex(
                (current) => current + 1,
            );
        }
    }

    function handlePageChange(
        targetPageIndex,
    ) {
        if (
            targetPageIndex < 0 ||
            targetPageIndex >= pagination.pages
        ) {
            return;
        }

        setPageIndex(targetPageIndex);
    }

    function handleNotificationClick(
        orderId,
    ) {
        markAsRead(orderId);
    }

    if (isAuthLoading || isLoading) {
        return (
            <div className="flex min-h-96 items-center justify-center rounded-2xl border border-border bg-white">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Bildirimler yükleniyor...
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="border-b border-border">
                <div className="flex flex-col gap-4 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-base font-bold text-text-primary">
                                    Bildirimler
                                </h1>

                                <span className="rounded-full bg-background-soft px-2.5 py-1 text-xs font-semibold text-text-secondary">
                                    {pagination.count} bildirim
                                </span>

                                {unreadCount > 0 && (
                                    <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white">
                                        {unreadCount} okunmamış
                                    </span>
                                )}
                            </div>

                            <p className="mt-1 text-sm text-text-secondary">
                                Yeni sipariş bildirimlerini
                                görüntüleyin ve yönetin.
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                type="button"
                                onClick={markAllAsRead}
                                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:w-auto"
                            >
                                <CheckCheck className="h-4 w-4" />
                                Tümünü Okundu Yap
                            </button>
                        )}
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />

                            <input
                                type="search"
                                value={orderNumber}
                                onChange={
                                    handleOrderNumberChange
                                }
                                placeholder="Sipariş numarası ara..."
                                className="h-10 w-full rounded-lg border border-border bg-white pl-10 pr-10 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                            />

                            {orderNumber && (
                                <button
                                    type="button"
                                    onClick={
                                        clearOrderNumber
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                                    aria-label="Sipariş numarasını temizle"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setShowFilters(
                                    (current) =>
                                        !current,
                                )
                            }
                            className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors sm:w-auto ${showFilters || hasFilters
                                ? "border-primary bg-orange-50 text-primary"
                                : "border-border text-text-primary hover:bg-background-soft"
                                }`}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            Filtreler
                            {hasFilters && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                                    1
                                </span>
                            )}
                        </button>
                    </div>

                    {showFilters && (
                        <div className="rounded-xl border border-border bg-background-soft/60 p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4 text-primary" />
                                    <span className="text-sm font-semibold text-text-primary">
                                        Detaylı Filtreler
                                    </span>
                                </div>

                                {hasFilters && (
                                    <button
                                        type="button"
                                        onClick={
                                            clearFilters
                                        }
                                        className="text-xs font-semibold text-primary hover:underline"
                                    >
                                        Filtreleri temizle
                                    </button>
                                )}
                            </div>

                            <div className="max-w-md">
                                <label
                                    htmlFor="order-number-filter"
                                    className="mb-1.5 block text-xs font-semibold text-text-secondary"
                                >
                                    Sipariş No
                                </label>

                                <div className="relative">
                                    <input
                                        id="order-number-filter"
                                        type="text"
                                        value={orderNumber}
                                        onChange={
                                            handleOrderNumberChange
                                        }
                                        placeholder="BKB-20261003-..."
                                        className="h-10 w-full rounded-lg border border-border bg-white px-3 pr-9 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    />

                                    {orderNumber && (
                                        <button
                                            type="button"
                                            onClick={
                                                clearOrderNumber
                                            }
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                                            aria-label="Sipariş numarasını temizle"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                <p className="mt-1 text-[11px] text-text-secondary">
                                    Sipariş numarası ile
                                    filtrelenir.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-border pt-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex flex-col items-stretch gap-3 text-sm text-text-secondary sm:flex-row sm:flex-wrap sm:items-center">
                                <div className="flex items-center gap-2">
                                    <span>
                                        Sayfa başına
                                    </span>

                                    <div className="relative">
                                        <select
                                            value={pageSize}
                                            onChange={
                                                handlePageSizeChange
                                            }
                                            className="h-9 max-w-full appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm font-medium text-text-primary outline-none focus:border-primary"
                                            aria-label="Sayfa başına bildirim sayısı"
                                        >
                                            {PAGE_SIZE_OPTIONS.map(
                                                (size) => (
                                                    <option
                                                        key={
                                                            size
                                                        }
                                                        value={
                                                            size
                                                        }
                                                    >
                                                        {size}
                                                    </option>
                                                ),
                                            )}
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                                    </div>
                                </div>

                                <div className="hidden h-5 w-px bg-border sm:block" />

                                <div className="flex items-center gap-2">
                                    <span>
                                        Sıralama
                                    </span>

                                    <div className="relative">
                                        <select
                                            value={sortBy}
                                            onChange={
                                                handleSortByChange
                                            }
                                            className="h-9 max-w-full appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm font-medium text-text-primary outline-none focus:border-primary"
                                            aria-label="Bildirim sıralaması"
                                        >
                                            {SORT_OPTIONS.map(
                                                (option) => (
                                                    <option
                                                        key={
                                                            option.value
                                                        }
                                                        value={
                                                            option.value
                                                        }
                                                    >
                                                        {option.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                                    </div>

                                    <div className="relative">
                                        <select
                                            value={
                                                sortDirection
                                            }
                                            onChange={
                                                handleSortDirectionChange
                                            }
                                            className="h-9 max-w-full appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm font-medium text-text-primary outline-none focus:border-primary"
                                            aria-label="Sıralama yönü"
                                        >
                                            {SORT_DIRECTION_OPTIONS.map(
                                                (option) => (
                                                    <option
                                                        key={
                                                            option.value
                                                        }
                                                        value={
                                                            option.value
                                                        }
                                                    >
                                                        {option.label}
                                                    </option>
                                                ),
                                            )}
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                                    </div>
                                </div>
                            </div>

                            {isRefreshing && (
                                <div className="flex items-center gap-2 text-xs text-text-secondary">
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                    Güncelleniyor...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-b border-border bg-background-soft/50 px-4 py-3 sm:px-6">
                <div className="grid gap-3 text-center sm:grid-cols-2">
                    <div>
                        <p className="text-xs font-medium text-text-secondary">
                            Toplam Bildirim
                        </p>
                        <p className="mt-1 text-lg font-bold text-text-primary">
                            {pagination.count}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-text-secondary">
                            Bu Sayfadaki Bildirim
                        </p>
                        <p className="mt-1 text-lg font-bold text-primary">
                            {orders.length}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {error ? (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
                    >
                        {error}
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background-soft/30 px-5 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-soft text-text-secondary">
                            <Search
                                className="h-7 w-7"
                                strokeWidth={1.6}
                            />
                        </div>

                        <h2 className="mt-4 text-lg font-bold text-text-primary">
                            {hasFilters
                                ? "Filtrelere uygun bildirim bulunamadı"
                                : "Bildirim bulunamadı"}
                        </h2>

                        <p className="mt-2 max-w-md text-sm text-text-secondary">
                            {hasFilters
                                ? "Arama kriterinizi değiştirerek tekrar deneyebilirsiniz."
                                : "Henüz görüntülenecek bir sipariş bildirimi bulunmuyor."}
                        </p>

                        {hasFilters && (
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-text-primary hover:bg-background-soft"
                            >
                                <X className="h-4 w-4" />
                                Filtreleri Temizle
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-5">
                        {orders.map((order) => {
                            const isUnread =
                                unreadOrderIdSet.has(
                                    order.orderId,
                                );

                            return (
                                <div
                                    key={order.orderId}
                                    className={`mb-3 rounded-xl border p-3 transition-colors hover:bg-gray-100 sm:p-6 ${isUnread
                                            ? "border-primary/20 bg-orange-100 hover:bg-orange-200!"
                                            : "border-border bg-white"
                                        }`}
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isUnread
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-background-soft text-text-secondary"
                                                }`}
                                        >
                                            <span className="text-base">
                                                🛒
                                            </span>
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-col gap-1.5 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="flex flex-wrap items-center gap-2">
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
                                                    {formatOrderDate(
                                                        order.audit?.createdDate,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                                            <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-2">
                                                    <div>
                                                        <p className="text-xs font-medium text-text-secondary">
                                                            Sipariş
                                                        </p>

                                                        <p className="mt-0.5 break-all font-semibold text-text-primary">
                                                            #{order.orderNumber}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-medium text-text-secondary">
                                                            Müşteri
                                                        </p>

                                                        <p className="mt-0.5 break-words font-medium text-text-primary">
                                                            {getCustomerName(order)}
                                                        </p>
                                                    </div>

                                                    <div>
                                                        <p className="text-xs font-medium text-text-secondary">
                                                            Sipariş Tutarı
                                                        </p>

                                                        <p className="mt-0.5 font-bold text-text-primary">
                                                            {formatPrice(order.grandTotal)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Link
                                                    href={`/siparisler/${order.orderId}`}
                                                    onClick={() =>
                                                        handleNotificationClick(
                                                            order.orderId,
                                                        )
                                                    }
                                                    className="mt-1 inline-flex h-11 w-full shrink-0 items-center justify-center rounded-lg border border-border bg-white px-3 text-xs font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary hover:bg-amber-100 sm:mt-2.5 sm:w-32"
                                                >
                                                    Siparişe Git
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {!error && pagination.pages > 0 && (
                <div className="flex flex-col gap-3 border-t border-border bg-background-soft/30 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="text-sm text-text-secondary">
                        <span className="font-medium text-text-primary">
                            {pagination.index + 1}.
                        </span>{" "}
                        / {pagination.pages} sayfa
                        <span className="mx-2">
                            •
                        </span>
                        {pagination.count} bildirim
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={
                                handlePreviousPage
                            }
                            disabled={
                                !pagination.hasPrevious
                            }
                            className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-white px-2 text-sm font-semibold text-text-primary transition-colors hover:bg-background-soft disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Önceki
                        </button>

                        <div className="hidden items-center gap-1 sm:flex">
                            {Array.from(
                                {
                                    length: pagination.pages,
                                },
                                (_, index) => index,
                            ).map(
                                (
                                    targetPageIndex,
                                ) => {
                                    const isCurrent =
                                        targetPageIndex ===
                                        pagination.index;

                                    return (
                                        <button
                                            key={
                                                targetPageIndex
                                            }
                                            type="button"
                                            onClick={() =>
                                                handlePageChange(
                                                    targetPageIndex,
                                                )
                                            }
                                            className={`flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-semibold transition-colors ${isCurrent
                                                ? "bg-primary text-white"
                                                : "border border-border bg-white text-text-primary hover:bg-background-soft"
                                                }`}
                                        >
                                            {targetPageIndex +
                                                1}
                                        </button>
                                    );
                                },
                            )}
                        </div>

                        <span className="px-2 text-sm font-semibold text-text-primary sm:hidden">
                            {pagination.index + 1} /{" "}
                            {pagination.pages}
                        </span>

                        <button
                            type="button"
                            onClick={
                                handleNextPage
                            }
                            disabled={
                                !pagination.hasNext
                            }
                            className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-white px-2 text-sm font-semibold text-text-primary transition-colors hover:bg-background-soft disabled:cursor-not-allowed disabled:opacity-40 sm:px-3"
                        >
                            Sonraki
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}