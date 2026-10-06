"use client";

import {
    ArrowDownAZ,
    ArrowUpAZ,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    Filter,
    LoaderCircle,
    Package,
    RefreshCw,
    Search,
    SlidersHorizontal,
    X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
    DELIVERY_STATUS,
    DELIVERY_STATUS_LABELS,
    ORDER_LIST_STATUS,
    ORDER_LIST_STATUS_LABELS,
    ORDER_STATUS,
    ORDER_STATUS_LABELS,
    PAYMENT_STATUS,
    PAYMENT_STATUS_LABELS,
} from "@/features/orders/constants/orderConstants";
import {
    DeliveryStatusBadge,
    OrderStatusBadge,
    PaymentStatusBadge,
} from "@/features/orders/components/OrderStatusBadge";
import { getOrders } from "@/features/orders/services/orderService";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

const SORT_OPTIONS = [
    { value: "CreatedDate", label: "Tarih" },
    { value: "CustomerName", label: "Müşteri" },
    { value: "GrandTotal", label: "Toplam Tutar" },
];

const SORT_DIRECTION = {
    ASCENDING: "Ascending",
    DESCENDING: "Descending",
};

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

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function getCustomerName(order) {
    const firstName = order.shippingAddress?.firstName?.trim() || "";
    const lastName = order.shippingAddress?.lastName?.trim() || "";

    return `${firstName} ${lastName}`.trim() || "Müşteri";
}

export default function OrderList({ onSelectOrder }) {
    const { isLoading: isAuthLoading } = useAuth();

    const [activeFilter, setActiveFilter] = useState(ORDER_LIST_STATUS.ALL);

    const [orders, setOrders] = useState([]);
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);

    const [pagination, setPagination] = useState({
        size: 10,
        index: 0,
        count: 0,
        pages: 0,
        hasPrevious: false,
        hasNext: false,
    });

    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [orderNumber, setOrderNumber] = useState("");

    const [orderStatusFilter, setOrderStatusFilter] = useState("All");
    const [paymentStatusFilter, setPaymentStatusFilter] = useState("All");
    const [deliveryStatusFilter, setDeliveryStatusFilter] = useState("All");

    const [sortBy, setSortBy] = useState("CreatedDate");
    const [sortDirection, setSortDirection] = useState(
        SORT_DIRECTION.DESCENDING,
    );

    const [showFilters, setShowFilters] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm.trim());
        }, 350);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [searchTerm]);

    useEffect(() => {
        if (isAuthLoading) {
            return;
        }

        let isCancelled = false;

        async function loadOrders() {
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
                    Status: activeFilter,
                    SortBy: sortBy,
                    SortDirection: sortDirection,
                };

                if (debouncedSearchTerm) {
                    params.Search = debouncedSearchTerm;
                }

                if (orderNumber.trim()) {
                    params.OrderNumber = orderNumber.trim();
                }

                if (orderStatusFilter !== "All") {
                    params.OrderStatus = orderStatusFilter;
                }

                if (paymentStatusFilter !== "All") {
                    params.PaymentStatus = paymentStatusFilter;
                }

                if (deliveryStatusFilter !== "All") {
                    params.DeliveryStatus = deliveryStatusFilter;
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
                    hasPrevious: response?.hasPrevious === true,
                    hasNext: response?.hasNext === true,
                });
            } catch (error) {
                console.error("Siparişler yüklenemedi:", error);

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
                        error?.message ||
                        "Siparişler yüklenirken bir hata oluştu.",
                    );
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                    setIsRefreshing(false);
                }
            }
        }

        loadOrders();

        return () => {
            isCancelled = true;
        };
    }, [
        activeFilter,
        debouncedSearchTerm,
        deliveryStatusFilter,
        isAuthLoading,
        orderNumber,
        orderStatusFilter,
        pageIndex,
        pageSize,
        paymentStatusFilter,
        refreshKey,
        sortBy,
        sortDirection,
    ]);

    const pageTotal = orders.reduce(
        (total, order) => total + Number(order.grandTotal ?? 0),
        0,
    );

    const activeFilterCount = [
        debouncedSearchTerm,
        orderNumber.trim(),
        orderStatusFilter !== "All" ? orderStatusFilter : "",
        paymentStatusFilter !== "All" ? paymentStatusFilter : "",
        deliveryStatusFilter !== "All" ? deliveryStatusFilter : "",
    ].filter(Boolean).length;

    const hasFilters = activeFilterCount > 0;

    function handleFilterChange(filter) {
        setActiveFilter(filter);
        setPageIndex(0);
    }

    function handleSearchChange(event) {
        setSearchTerm(event.target.value);
        setPageIndex(0);
    }

    function handleOrderNumberChange(event) {
        setOrderNumber(event.target.value);
        setPageIndex(0);
    }

    function handleOrderStatusChange(event) {
        setOrderStatusFilter(event.target.value);
        setPageIndex(0);
    }

    function handlePaymentStatusChange(event) {
        setPaymentStatusFilter(event.target.value);
        setPageIndex(0);
    }

    function handleDeliveryStatusChange(event) {
        setDeliveryStatusFilter(event.target.value);
        setPageIndex(0);
    }

    function handlePageSizeChange(event) {
        setPageSize(Number(event.target.value));
        setPageIndex(0);
    }

    function handlePreviousPage() {
        if (pagination.hasPrevious) {
            setPageIndex((current) => current - 1);
        }
    }

    function handleNextPage() {
        if (pagination.hasNext) {
            setPageIndex((current) => current + 1);
        }
    }

    function handleSortChange(event) {
        setSortBy(event.target.value);
        setPageIndex(0);
    }

    function handleSortDirectionToggle() {
        setSortDirection((current) =>
            current === SORT_DIRECTION.ASCENDING
                ? SORT_DIRECTION.DESCENDING
                : SORT_DIRECTION.ASCENDING,
        );
        setPageIndex(0);
    }

    function clearFilters() {
        setSearchTerm("");
        setDebouncedSearchTerm("");
        setOrderNumber("");
        setOrderStatusFilter("All");
        setPaymentStatusFilter("All");
        setDeliveryStatusFilter("All");
        setPageIndex(0);
    }

    function clearSearch() {
        setSearchTerm("");
        setDebouncedSearchTerm("");
        setPageIndex(0);
    }

    function clearOrderNumber() {
        setOrderNumber("");
        setPageIndex(0);
    }

    function handleRefresh() {
        setRefreshKey((current) => current + 1);
    }

    if (isAuthLoading || isLoading) {
        return (
            <div className="flex min-h-96 items-center justify-center rounded-2xl border border-border bg-white">
                <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <LoaderCircle className="h-5 w-5 animate-spin" />
                    Siparişler yükleniyor...
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
                                <h2 className="text-base font-bold text-text-primary">
                                    Siparişler
                                </h2>

                                <span className="rounded-full bg-background-soft px-2.5 py-1 text-xs font-semibold text-text-secondary">
                                    {pagination.count} sipariş
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-text-secondary">
                                Siparişlerinizi görüntüleyin ve yönetin.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowFilters((current) => !current)
                                }
                                className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors ${showFilters || hasFilters
                                    ? "border-primary bg-orange-50 text-primary"
                                    : "border-border text-text-primary hover:bg-background-soft"
                                    }`}
                            >
                                <SlidersHorizontal className="h-4 w-4" />
                                Filtreler

                                {activeFilterCount > 0 && (
                                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-bold text-white">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleRefresh}
                                disabled={isRefreshing}
                                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-semibold text-text-primary transition-colors hover:bg-background-soft disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <RefreshCw
                                    className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""
                                        }`}
                                />
                                Yenile
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row">
                        <div className="relative min-w-0 flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />

                            <input
                                type="search"
                                value={searchTerm}
                                onChange={handleSearchChange}
                                placeholder="Müşteri adı, soyadı, e-posta veya telefon ara..."
                                className="h-10 w-full rounded-lg border border-border bg-white pl-10 pr-10 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary focus:ring-2 focus:ring-primary/10"
                            />

                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                                    aria-label="Aramayı temizle"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <div className="relative min-w-44">
                                <select
                                    value={sortBy}
                                    onChange={handleSortChange}
                                    className="h-10 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-9 text-sm font-medium text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                >
                                    {SORT_OPTIONS.map((option) => (
                                        <option
                                            key={option.value}
                                            value={option.value}
                                        >
                                            Sırala: {option.label}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                            </div>

                            <button
                                type="button"
                                onClick={handleSortDirectionToggle}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-text-primary transition-colors hover:bg-background-soft"
                                aria-label={
                                    sortDirection ===
                                        SORT_DIRECTION.ASCENDING
                                        ? "Azalan sırala"
                                        : "Artan sırala"
                                }
                                title={
                                    sortDirection ===
                                        SORT_DIRECTION.ASCENDING
                                        ? "Azalan sıra"
                                        : "Artan sıra"
                                }
                            >
                                {sortDirection ===
                                    SORT_DIRECTION.ASCENDING ? (
                                    <ArrowUpAZ className="h-4 w-4" />
                                ) : (
                                    <ArrowDownAZ className="h-4 w-4" />
                                )}
                            </button>
                        </div>
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
                                        onClick={clearFilters}
                                        className="text-xs font-semibold text-primary hover:underline"
                                    >
                                        Filtreleri temizle
                                    </button>
                                )}
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                                <div>
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
                                                onClick={clearOrderNumber}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                                                aria-label="Sipariş numarasını temizle"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>

                                    <p className="mt-1 text-[11px] text-text-secondary">
                                        Tam sipariş numarası ile aranır.
                                    </p>
                                </div>

                                <div>
                                    <label
                                        htmlFor="order-status-filter"
                                        className="mb-1.5 block text-xs font-semibold text-text-secondary"
                                    >
                                        Sipariş Durumu
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="order-status-filter"
                                            value={orderStatusFilter}
                                            onChange={
                                                handleOrderStatusChange
                                            }
                                            className="h-10 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-9 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        >
                                            <option value="All">Tümü</option>

                                            {Object.values(ORDER_STATUS).map(
                                                (status) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {
                                                            ORDER_STATUS_LABELS[
                                                            status
                                                            ]
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="payment-status-filter"
                                        className="mb-1.5 block text-xs font-semibold text-text-secondary"
                                    >
                                        Ödeme Durumu
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="payment-status-filter"
                                            value={paymentStatusFilter}
                                            onChange={
                                                handlePaymentStatusChange
                                            }
                                            className="h-10 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-9 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        >
                                            <option value="All">Tümü</option>

                                            {Object.values(PAYMENT_STATUS).map(
                                                (status) => (
                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {
                                                            PAYMENT_STATUS_LABELS[
                                                            status
                                                            ]
                                                        }
                                                    </option>
                                                ),
                                            )}
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                                    </div>
                                </div>

                                <div>
                                    <label
                                        htmlFor="delivery-status-filter"
                                        className="mb-1.5 block text-xs font-semibold text-text-secondary"
                                    >
                                        Teslimat Durumu
                                    </label>

                                    <div className="relative">
                                        <select
                                            id="delivery-status-filter"
                                            value={deliveryStatusFilter}
                                            onChange={
                                                handleDeliveryStatusChange
                                            }
                                            className="h-10 w-full appearance-none rounded-lg border border-border bg-white px-3 pr-9 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        >
                                            <option value="All">Tümü</option>

                                            {Object.values(
                                                DELIVERY_STATUS,
                                            ).map((status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
                                                    {
                                                        DELIVERY_STATUS_LABELS[
                                                        status
                                                        ]
                                                    }
                                                </option>
                                            ))}
                                        </select>

                                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            {Object.values(ORDER_LIST_STATUS).map((filter) => {
                                const isActive = activeFilter === filter;

                                return (
                                    <button
                                        key={filter}
                                        type="button"
                                        onClick={() =>
                                            handleFilterChange(filter)
                                        }
                                        className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${isActive
                                            ? "bg-primary text-white"
                                            : "text-text-secondary hover:bg-background-soft hover:text-text-primary"
                                            }`}
                                    >
                                        {ORDER_LIST_STATUS_LABELS[filter]}
                                    </button>
                                );
                            })}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <span>Sayfa başına</span>

                            <div className="relative">
                                <select
                                    value={pageSize}
                                    onChange={handlePageSizeChange}
                                    className="h-9 appearance-none rounded-lg border border-border bg-white px-3 pr-8 text-sm font-medium text-text-primary outline-none focus:border-primary"
                                    aria-label="Sayfa başına sipariş sayısı"
                                >
                                    {PAGE_SIZE_OPTIONS.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>

                                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-b border-border bg-background-soft/50 px-4 py-3 sm:px-6">
                <div className="grid gap-3 text-center sm:grid-cols-3">
                    <div>
                        <p className="text-xs font-medium text-text-secondary">
                            Toplam Sipariş
                        </p>
                        <p className="mt-1 text-lg font-bold text-text-primary">
                            {pagination.count}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-text-secondary">
                            Bu Sayfadaki Sipariş
                        </p>
                        <p className="mt-1 text-lg font-bold text-text-primary">
                            {orders.length}
                        </p>
                    </div>

                    <div>
                        <p className="text-xs font-medium text-text-secondary">
                            Sayfadaki Toplam
                        </p>
                        <p className="mt-1 text-lg font-bold text-primary">
                            {formatPrice(pageTotal)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6">
                {error ? (
                    <div
                        role="alert"
                        className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <span>{error}</span>

                        <button
                            type="button"
                            onClick={handleRefresh}
                            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-3 font-semibold text-red-700 hover:bg-red-100"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Tekrar Dene
                        </button>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="flex min-h-72 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background-soft/30 px-5 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-soft text-text-secondary">
                            {hasFilters ? (
                                <Search
                                    className="h-7 w-7"
                                    strokeWidth={1.6}
                                />
                            ) : (
                                <Package
                                    className="h-7 w-7"
                                    strokeWidth={1.6}
                                />
                            )}
                        </div>

                        <h2 className="mt-4 text-lg font-bold text-text-primary">
                            {hasFilters
                                ? "Filtrelere uygun sipariş bulunamadı"
                                : "Sipariş bulunamadı"}
                        </h2>

                        <p className="mt-2 max-w-md text-sm text-text-secondary">
                            {hasFilters
                                ? "Arama veya filtre kriterlerinizi değiştirerek tekrar deneyebilirsiniz."
                                : "Bu filtreye uygun herhangi bir sipariş bulunmuyor."}
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
                    <div className="overflow-x-auto rounded-xl border border-border">
                        <table className="min-w-[1180px] w-full">
                            <thead>
                                <tr className="border-b border-border bg-background-soft/60 text-center">
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Sipariş
                                    </th>
                                    <th className="px-12 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Müşteri
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Sipariş Durumu
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Ödeme
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Teslimat
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Toplam
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-text-secondary">
                                        Sipariş Tarihi
                                    </th>
                                    <th className="w-28 px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        İşlem
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {orders.map((order) => (
                                    <tr
                                        key={order.orderId}
                                        className="border-b border-border last:border-b-0 transition-colors hover:bg-background-soft"
                                    >
                                        <td className="px-4 py-4">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onSelectOrder(order)
                                                }
                                                className="text-center"
                                            >
                                                <p className="font-bold text-primary hover:underline">
                                                    {order.orderNumber}
                                                </p>

                                                <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
                                                    <span>
                                                        {order.items?.length ??
                                                            0}{" "}
                                                        ürün
                                                    </span>

                                                    {order.orderNotes && (
                                                        <>
                                                            <span>•</span>
                                                            <span>Not var</span>
                                                        </>
                                                    )}
                                                </div>
                                            </button>
                                        </td>

                                        <td className="px-4 py-4">
                                            <p className="font-medium text-text-primary">
                                                {getCustomerName(order)}
                                            </p>

                                            <p className="mt-1 max-w-56 truncate text-xs text-text-secondary">
                                                {order.shippingAddress
                                                    ?.email || "E-posta yok"}
                                            </p>
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <OrderStatusBadge
                                                status={order.orderStatus}
                                            />
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <PaymentStatusBadge
                                                status={order.paymentStatus}
                                            />
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <DeliveryStatusBadge
                                                status={order.deliveryStatus}
                                            />
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <span className="font-bold text-text-primary">
                                                {formatPrice(
                                                    order.grandTotal,
                                                )}
                                            </span>
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-text-primary text-center">
                                            {formatOrderDate(order.audit?.createdDate)}
                                        </td>

                                        <td className="px-4 py-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onSelectOrder(order)
                                                }
                                                className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Detay
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                        <span className="mx-2">•</span>
                        {pagination.count} sipariş
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePreviousPage}
                            disabled={!pagination.hasPrevious}
                            className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-text-primary transition-colors hover:bg-background-soft disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Önceki
                        </button>

                        <span className="hidden px-2 text-sm font-semibold text-text-primary sm:inline">
                            {pagination.index + 1} / {pagination.pages}
                        </span>

                        <button
                            type="button"
                            onClick={handleNextPage}
                            disabled={!pagination.hasNext}
                            className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-text-primary transition-colors hover:bg-background-soft"
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