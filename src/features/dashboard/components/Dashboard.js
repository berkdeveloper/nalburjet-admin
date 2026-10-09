"use client";

import { useCallback, useEffect, useState } from "react";
import { getDashboardData } from "@/features/dashboard/services/dashboardService";

function StatCard({ title, value, description, icon }) {
    return (
        <div className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-5 text-gray-500">
                        {title}
                    </p>

                    <p className="mt-2 break-words text-2xl font-semibold leading-tight text-gray-900 sm:text-3xl">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-2 text-xs leading-5 text-gray-400">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EE7402]/10 text-[#EE7402] sm:h-10 sm:w-10">
                    {icon}
                </div>
            </div>
        </div>
    );
}

function formatNumber(value) {
    return Number(value ?? 0).toLocaleString("tr-TR");
}

function formatPrice(value) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 py-3 last:border-b-0">
            <span className="min-w-0 flex-1 text-sm leading-5 text-gray-600">
                {label}
            </span>

            <span className="shrink-0 text-right text-sm font-semibold text-gray-900">
                {formatNumber(value)}
            </span>
        </div>
    );
}

function DashboardIcon({ type }) {
    const paths = {
        orders: (
            <>
                <path d="M6 3h12v18H6z" />
                <path d="M9 7h6" />
                <path d="M9 11h6" />
                <path d="M9 15h4" />
            </>
        ),
        users: (
            <>
                <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                <circle cx="9.5" cy="7" r="4" />
                <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </>
        ),
        products: (
            <>
                <path d="m3 9 9-6 9 6" />
                <path d="M5 8v12h14V8" />
                <path d="M9 20v-6h6v6" />
            </>
        ),
        newsletter: (
            <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
            </>
        ),
        revenue: (
            <text
                x="12"
                y="23"
                textAnchor="middle"
                fontSize="30"
                fontWeight="700"
                fill="currentColor"
                stroke="none"
            >
                ₺
            </text>
        ),
    };

    return (
        <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {paths[type] ?? paths.orders}
        </svg>
    );
}

function DashboardHeading({ description }) {
    return (
        <div className="min-w-0">
            <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
                Dashboard
            </h1>

            <p className="mt-1 text-sm leading-6 text-gray-500">
                {description}
            </p>
        </div>
    );
}

function LoadingSkeleton() {
    return (
        <div className="space-y-5 sm:space-y-6">
            <div>
                <DashboardHeading description="Mağazanızın genel durumuna buradan göz atabilirsiniz." />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map((item) => (
                    <div
                        key={item}
                        className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white sm:h-32"
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white sm:h-72" />
                <div className="h-64 animate-pulse rounded-xl border border-gray-200 bg-white sm:h-72" />
            </div>
        </div>
    );
}

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadDashboard = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const response = await getDashboardData();

            setData(response);
        } catch (error) {
            setError(
                error.message ||
                "Dashboard verileri yüklenirken bir hata oluştu.",
            );
            setData(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let cancelled = false;

        async function fetchDashboard() {
            try {
                setLoading(true);
                setError("");

                const response = await getDashboardData();

                if (!cancelled) {
                    setData(response);
                }
            } catch (error) {
                if (!cancelled) {
                    setError(
                        error.message ||
                        "Dashboard verileri yüklenirken bir hata oluştu.",
                    );
                    setData(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchDashboard();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error) {
        return (
            <div className="space-y-5 sm:space-y-6">
                <DashboardHeading description="Mağazanızın genel durumuna buradan göz atabilirsiniz." />

                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="min-w-0 leading-6">{error}</p>

                        <button
                            type="button"
                            onClick={loadDashboard}
                            className="min-h-10 w-full shrink-0 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 sm:w-auto"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-w-0 space-y-5 sm:space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <DashboardHeading description="Mağazanızın genel durumuna buradan göz atabilirsiniz." />

                <button
                    type="button"
                    onClick={loadDashboard}
                    className="min-h-10 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                >
                    Yenile
                </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-6">
                <StatCard
                    title="Toplam Sipariş"
                    value={formatNumber(data.orders)}
                    icon={<DashboardIcon type="orders" />}
                />

                <StatCard
                    title="Toplam Kullanıcı"
                    value={formatNumber(data.users)}
                    icon={<DashboardIcon type="users" />}
                />

                <StatCard
                    title="Aktif Ürün"
                    value={formatNumber(data.activeProducts)}
                    icon={<DashboardIcon type="products" />}
                />

                <StatCard
                    title="Aktif Bülten Abonesi"
                    value={formatNumber(data.activeNewsletterSubscribers)}
                    icon={<DashboardIcon type="newsletter" />}
                />

                <StatCard
                    title="Son 30 Gün Sipariş"
                    value={formatNumber(data.last30DaysOrderCount)}
                    description="Son 30 günde oluşturulan siparişler"
                    icon={<DashboardIcon type="orders" />}
                />

                <StatCard
                    title="Son 30 Gün Kazanç"
                    value={formatPrice(data.last30DaysRevenue)}
                    description="Tamamlanan siparişlerden"
                    icon={<DashboardIcon type="revenue" />}
                />
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
                <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-3 sm:mb-4">
                        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                            Mağaza Özeti
                        </h2>

                        <p className="mt-1 text-sm leading-5 text-gray-500">
                            Mağazadaki temel kaynakların mevcut durumu.
                        </p>
                    </div>

                    <div>
                        <SummaryRow label="Kategoriler" value={data.categories} />
                        <SummaryRow label="Sepetler" value={data.carts} />
                        <SummaryRow
                            label="Aktif kargo yöntemleri"
                            value={data.activeShippingMethods}
                        />
                        <SummaryRow
                            label="Vitrin ürünleri"
                            value={data.productCollections}
                        />
                    </div>
                </section>

                <section className="min-w-0 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                    <div className="mb-3 sm:mb-4">
                        <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                            Sistem Özeti
                        </h2>

                        <p className="mt-1 text-sm leading-5 text-gray-500">
                            Yönetim panelindeki mevcut verilerin kısa özeti.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4">
                        <div className="min-w-0 rounded-lg bg-gray-50 p-3 sm:p-4">
                            <p className="text-xs font-medium text-gray-500">
                                Sipariş
                            </p>
                            <p className="mt-1 break-words text-xl font-semibold text-gray-900 sm:text-2xl">
                                {formatNumber(data.orders)}
                            </p>
                        </div>

                        <div className="min-w-0 rounded-lg bg-gray-50 p-3 sm:p-4">
                            <p className="text-xs font-medium text-gray-500">
                                Kullanıcı
                            </p>
                            <p className="mt-1 break-words text-xl font-semibold text-gray-900 sm:text-2xl">
                                {formatNumber(data.users)}
                            </p>
                        </div>

                        <div className="min-w-0 rounded-lg bg-gray-50 p-3 sm:p-4">
                            <p className="text-xs font-medium text-gray-500">
                                Aktif Ürün
                            </p>
                            <p className="mt-1 break-words text-xl font-semibold text-gray-900 sm:text-2xl">
                                {formatNumber(data.activeProducts)}
                            </p>
                        </div>

                        <div className="min-w-0 rounded-lg bg-gray-50 p-3 sm:p-4">
                            <p className="text-xs font-medium text-gray-500">
                                Aktif Abone
                            </p>
                            <p className="mt-1 break-words text-xl font-semibold text-gray-900 sm:text-2xl">
                                {formatNumber(data.activeNewsletterSubscribers)}
                            </p>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}