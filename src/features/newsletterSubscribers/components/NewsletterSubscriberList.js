"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import {
    getNewsletterSubscriberById,
    getNewsletterSubscribers,
} from "@/features/newsletterSubscribers/services/newsletterSubscriberService";

export default function NewsletterSubscriberList() {
    const [subscribers, setSubscribers] = useState([]);
    const [email, setEmail] = useState("");
    const [appliedEmail, setAppliedEmail] = useState("");
    const [isActive, setIsActive] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [pageIndex, setPageIndex] = useState(0);
    const pageSize = 10;

    const [pagination, setPagination] = useState({
        count: 0,
        pages: 0,
        hasPrevious: false,
        hasNext: false,
    });

    const [selectedSubscriber, setSelectedSubscriber] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchSubscribers() {
            try {
                setLoading(true);
                setError("");

                const params = {
                    "PageRequest.PageIndex": pageIndex,
                    "PageRequest.PageSize": pageSize,
                    Email: appliedEmail || undefined,
                    IsActive:
                        isActive === ""
                            ? undefined
                            : isActive === "true",
                };

                const response = await getNewsletterSubscribers({ params });

                if (cancelled) {
                    return;
                }

                setSubscribers(response.items ?? []);

                setPagination({
                    count: response.count ?? 0,
                    pages: response.pages ?? 0,
                    hasPrevious: response.hasPrevious ?? false,
                    hasNext: response.hasNext ?? false,
                });
            } catch (error) {
                if (cancelled) {
                    return;
                }

                setError(
                    error.message ||
                    "Bülten aboneleri yüklenirken bir hata oluştu.",
                );
                setSubscribers([]);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchSubscribers();

        return () => {
            cancelled = true;
        };
    }, [pageIndex, appliedEmail, isActive]);

    async function handleSearchSubmit(event) {
        event.preventDefault();

        const trimmedEmail = email.trim();

        if (pageIndex === 0) {
            setAppliedEmail(trimmedEmail);
            return;
        }

        setPageIndex(0);
        setAppliedEmail(trimmedEmail);
    }

    function handleClearSearch() {
        setEmail("");

        if (pageIndex === 0) {
            setAppliedEmail("");
            return;
        }

        setPageIndex(0);
        setAppliedEmail("");
    }

    function handleStatusChange(event) {
        setPageIndex(0);
        setIsActive(event.target.value);
    }

    async function handleOpenSubscriber(subscriberId) {
        try {
            setSelectedSubscriber(null);
            setDetailError("");
            setDetailLoading(true);

            const response =
                await getNewsletterSubscriberById(subscriberId);

            setSelectedSubscriber(response.data ?? null);
        } catch (error) {
            setDetailError(
                error.message ||
                "Abone detayı yüklenirken bir hata oluştu.",
            );
        } finally {
            setDetailLoading(false);
        }
    }

    function handleCloseSubscriber() {
        if (detailLoading) {
            return;
        }

        setSelectedSubscriber(null);
        setDetailError("");
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

    function formatDate(value) {
        if (!value) {
            return "-";
        }

        return new Intl.DateTimeFormat("tr-TR", {
            dateStyle: "medium",
            timeStyle: "short",
        }).format(new Date(value));
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Bülten Aboneleri
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    E-bülten abonelerini görüntüleyin ve abonelik durumlarını
                    kontrol edin.
                </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <form
                    onSubmit={handleSearchSubmit}
                    className="flex flex-col gap-3 lg:flex-row lg:items-end"
                >
                    <div className="min-w-0 flex-1">
                        <label
                            htmlFor="subscriber-email"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            E-posta
                        </label>

                        <input
                            id="subscriber-email"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            placeholder="E-posta adresi ara..."
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#EE7402] focus:ring-2 focus:ring-[#EE7402]/20"
                        />
                    </div>

                    <div className="min-w-0 lg:w-48">
                        <label
                            htmlFor="subscriber-status"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Durum
                        </label>

                        <select
                            id="subscriber-status"
                            value={isActive}
                            onChange={handleStatusChange}
                            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition focus:border-[#EE7402] focus:ring-2 focus:ring-[#EE7402]/20"
                        >
                            <option value="">Tümü</option>
                            <option value="true">Aktif</option>
                            <option value="false">Pasif</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-end">
                        <button
                            type="submit"
                            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#EE7402] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#d96700]"
                        >
                            Ara
                        </button>

                        <button
                            type="button"
                            onClick={handleClearSearch}
                            disabled={!email && !appliedEmail}
                            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Temizle
                        </button>
                    </div>
                </form>
            </div>

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Masaüstü tablo görünümü */}
                <div className="hidden overflow-x-auto md:block">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    E-posta
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Durum
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Abonelik Tarihi
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-sm text-gray-500"
                                    >
                                        Bülten aboneleri yükleniyor...
                                    </td>
                                </tr>
                            ) : subscribers.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="px-4 py-10 text-center text-sm text-gray-500"
                                    >
                                        Bülten abonesi bulunamadı.
                                    </td>
                                </tr>
                            ) : (
                                subscribers.map((subscriber) => (
                                    <tr
                                        key={subscriber.newsletterSubscriberId}
                                        className="transition hover:bg-gray-50"
                                    >
                                        <td className="max-w-xs break-all px-4 py-4 text-sm font-medium text-gray-900">
                                            {subscriber.email}
                                        </td>

                                        <td className="px-4 py-4">
                                            {subscriber.isActive ? (
                                                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                                    Pasif
                                                </span>
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-4 py-4 text-sm text-gray-600">
                                            {formatDate(subscriber.subscribedDate)}
                                        </td>

                                        <td className="px-4 py-4 text-right">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleOpenSubscriber(
                                                        subscriber.newsletterSubscriberId,
                                                    )
                                                }
                                                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:border-[#EE7402] hover:bg-orange-50 hover:text-[#EE7402]"
                                            >
                                                Görüntüle
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobil kart görünümü */}
                <div className="divide-y divide-gray-100 md:hidden">
                    {loading ? (
                        <div className="px-4 py-10 text-center text-sm text-gray-500">
                            Bülten aboneleri yükleniyor...
                        </div>
                    ) : subscribers.length === 0 ? (
                        <div className="px-4 py-10 text-center text-sm text-gray-500">
                            Bülten abonesi bulunamadı.
                        </div>
                    ) : (
                        subscribers.map((subscriber) => (
                            <div
                                key={subscriber.newsletterSubscriberId}
                                className="space-y-4 p-4"
                            >
                                <div className="min-w-0">
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                                        E-posta
                                    </p>
                                    <p className="break-all text-sm font-medium text-gray-900">
                                        {subscriber.email}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Durum
                                        </p>

                                        {subscriber.isActive ? (
                                            <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                                Pasif
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-right">
                                        <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Abonelik Tarihi
                                        </p>
                                        <p className="text-sm text-gray-700">
                                            {formatDate(subscriber.subscribedDate)}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleOpenSubscriber(
                                            subscriber.newsletterSubscriberId,
                                        )
                                    }
                                    className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:border-[#EE7402] hover:bg-orange-50 hover:text-[#EE7402]"
                                >
                                    Görüntüle
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Sayfalama */}
                <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:px-5 md:flex-row md:items-center md:justify-between">
                    <div className="text-center text-sm text-gray-500 md:text-left">
                        Toplam{" "}
                        <span className="font-medium text-gray-700">
                            {pagination.count}
                        </span>{" "}
                        abone
                    </div>

                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePreviousPage}
                            disabled={!pagination.hasPrevious || loading}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                        >
                            Önceki
                        </button>

                        <span className="min-w-16 whitespace-nowrap text-center text-sm text-gray-600">
                            {pagination.pages > 0
                                ? `${pageIndex + 1} / ${pagination.pages}`
                                : "0 / 0"}
                        </span>

                        <button
                            type="button"
                            onClick={handleNextPage}
                            disabled={!pagination.hasNext || loading}
                            className="inline-flex min-h-10 items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4"
                        >
                            Sonraki
                        </button>
                    </div>
                </div>
            </div>

            {/* Abone detay modalı */}
            {(selectedSubscriber || detailLoading || detailError) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
                    <div className="flex max-h-[95dvh] w-full max-w-lg flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-4 sm:px-6">
                            <div className="min-w-0">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Bülten Abonesi
                                </h2>
                                <p className="mt-0.5 text-sm text-gray-500">
                                    Abone detayları
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseSubscriber}
                                disabled={detailLoading}
                                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                                aria-label="Kapat"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
                            {detailLoading ? (
                                <div className="py-8 text-center text-sm text-gray-500">
                                    Abone detayları yükleniyor...
                                </div>
                            ) : detailError ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {detailError}
                                </div>
                            ) : selectedSubscriber ? (
                                <div className="space-y-5">
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            E-posta
                                        </p>
                                        <p className="mt-1 break-all text-sm font-medium text-gray-900">
                                            {selectedSubscriber.email}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Durum
                                        </p>

                                        <div className="mt-2">
                                            {selectedSubscriber.isActive ? (
                                                <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                                                    Pasif
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Abonelik Tarihi
                                        </p>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {formatDate(selectedSubscriber.subscribedDate)}
                                        </p>
                                    </div>

                                    <div className="min-w-0">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                            Abone ID
                                        </p>
                                        <p className="mt-1 break-all text-sm text-gray-600">
                                            {selectedSubscriber.newsletterSubscriberId}
                                        </p>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <div className="flex shrink-0 justify-end border-t border-gray-200 px-4 py-4 sm:px-6">
                            <button
                                type="button"
                                onClick={handleCloseSubscriber}
                                disabled={detailLoading}
                                className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}