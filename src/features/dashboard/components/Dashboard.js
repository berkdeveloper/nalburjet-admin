"use client";

import { useEffect, useState } from "react";
import { getDashboardData } from "@/features/dashboard/services/dashboardService";

function StatCard({ title, value, description, icon }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-semibold text-gray-900">
                        {value}
                    </p>

                    {description && (
                        <p className="mt-1 text-xs text-gray-400">
                            {description}
                        </p>
                    )}
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#EE7402]/10 text-[#EE7402]">
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
        <div className="flex items-center justify-between border-b border-gray-100 py-3 last:border-b-0">
            <span className="text-sm text-gray-600">{label}</span>

            <span className="text-sm font-semibold text-gray-900">
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
        >
            {paths[type] ?? paths.orders}
        </svg>
    );
}

export default function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    async function loadDashboard() {
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
    }

    useEffect(() => {
        let cancelled = false;

        async function fetchDashboard() {
            try {
                setLoading(true);
                setError("");

                const response = await getDashboardData();

                if (cancelled) {
                    return;
                }

                setData(response);
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setError(
                    error.message ||
                    "Dashboard verileri yüklenirken bir hata oluştu.",
                );
                setData(null);
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
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Dashboard
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Mağazanızın genel durumuna buradan göz atabilirsiniz.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <div
                            key={item}
                            className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
                        />
                    ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="h-72 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
                    <div className="h-72 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Dashboard
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Mağazanızın genel durumuna buradan göz atabilirsiniz.
                    </p>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <span>{error}</span>

                        <button
                            type="button"
                            onClick={loadDashboard}
                            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
                        >
                            Tekrar Dene
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Dashboard
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Mağazanızın genel durumuna buradan göz atabilirsiniz.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={loadDashboard}
                    className="self-start rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:self-auto"
                >
                    Yenile
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
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

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Mağaza Özeti
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Mağazadaki temel kaynakların mevcut durumu.
                        </p>
                    </div>

                    <div>
                        <SummaryRow
                            label="Kategoriler"
                            value={data.categories}
                        />

                        <SummaryRow
                            label="Sepetler"
                            value={data.carts}
                        />

                        <SummaryRow
                            label="Aktif kargo yöntemleri"
                            value={data.activeShippingMethods}
                        />

                        <SummaryRow
                            label="Vitrin ürünleri"
                            value={data.productCollections}
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Sistem Özeti
                        </h2>

                        <p className="mt-1 text-sm text-gray-500">
                            Yönetim panelindeki mevcut verilerin kısa özeti.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-medium text-gray-500">
                                Sipariş
                            </p>

                            <p className="mt-1 text-2xl font-semibold text-gray-900">
                                {formatNumber(data.orders)}
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-medium text-gray-500">
                                Kullanıcı
                            </p>

                            <p className="mt-1 text-2xl font-semibold text-gray-900">
                                {formatNumber(data.users)}
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-medium text-gray-500">
                                Aktif Ürün
                            </p>

                            <p className="mt-1 text-2xl font-semibold text-gray-900">
                                {formatNumber(data.activeProducts)}
                            </p>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4">
                            <p className="text-xs font-medium text-gray-500">
                                Aktif Abone
                            </p>

                            <p className="mt-1 text-2xl font-semibold text-gray-900">
                                {formatNumber(data.activeNewsletterSubscribers)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}