"use client";

import { useEffect, useState } from "react";
import { Eye, LoaderCircle, RefreshCw, Search, RotateCcw } from "lucide-react";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getOrderReturnRequests } from "@/features/orderReturnRequests/services/orderReturnRequestService";
import {
    formatDate, formatMoney, getStatusClasses, getStatusLabel, getTypeLabel,
    REQUEST_STATUSES, REQUEST_TYPES,
} from "@/features/orderReturnRequests/constants/returnRequestConstants";
import OrderReturnRequestDetailModal from "@/features/orderReturnRequests/components/OrderReturnRequestDetailModal";

const PAGE_SIZES = [10, 25, 50];

function extractList(response) {
    if (Array.isArray(response?.items)) return response;
    if (Array.isArray(response?.data?.items)) return response.data;
    throw new Error("Talep listesi API yanıtı beklenen biçimde değil.");
}

export default function OrderReturnRequestList() {
    const { isLoading: authLoading } = useAuth();
    const [requestNumberInput, setRequestNumberInput] = useState("");
    const [orderIdInput, setOrderIdInput] = useState("");
    const [requestNumber, setRequestNumber] = useState("");
    const [orderId, setOrderId] = useState("");
    const [status, setStatus] = useState("");
    const [requestType, setRequestType] = useState("");
    const [pageIndex, setPageIndex] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [refreshKey, setRefreshKey] = useState(0);
    const [items, setItems] = useState([]);
    const [pagination, setPagination] = useState({ count: 0, pages: 0, index: 0, hasPrevious: false, hasNext: false });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState(null);

    useEffect(() => {
        if (authLoading) return;
        let active = true;

        async function load() {
            setIsLoading(true);
            setError("");
            try {
                const params = {
                    "PageRequest.PageIndex": pageIndex,
                    "PageRequest.PageSize": pageSize,
                };
                if (status !== "") params.Status = Number(status);
                if (requestType !== "") params.RequestType = Number(requestType);
                if (requestNumber) params.RequestNumber = requestNumber;
                if (orderId) params.OrderId = orderId;

                const result = extractList(await getOrderReturnRequests({ params }));
                if (!active) return;
                setItems(result.items ?? []);
                setPagination({
                    count: result.count ?? 0,
                    pages: result.pages ?? 0,
                    index: result.index ?? pageIndex,
                    hasPrevious: result.hasPrevious === true,
                    hasNext: result.hasNext === true,
                });
            } catch (err) {
                if (!active) return;
                console.error("İade / iptal talepleri alınamadı:", err);
                setItems([]);
                setError(err?.response?.data?.error?.message || err?.message || "Talepler yüklenemedi.");
            } finally {
                if (active) setIsLoading(false);
            }
        }

        load();
        return () => { active = false; };
    }, [authLoading, status, requestType, requestNumber, orderId, pageIndex, pageSize, refreshKey]);

    function applySearch(event) {
        event.preventDefault();
        setPageIndex(0);
        setRequestNumber(requestNumberInput.trim());
        setOrderId(orderIdInput.trim());
    }

    function clearFilters() {
        setRequestNumberInput("");
        setOrderIdInput("");
        setRequestNumber("");
        setOrderId("");
        setStatus("");
        setRequestType("");
        setPageIndex(0);
    }

    function refresh() {
        setRefreshKey((value) => value + 1);
    }

    return (
        <>
            <section className="min-w-0 overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
                <div className="border-b border-border p-4 sm:p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-text-primary">Talepler</h2>
                            <p className="mt-1 text-sm text-text-secondary">Toplam {pagination.count} talep</p>
                        </div>
                        <button type="button" onClick={refresh} disabled={isLoading}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-text-primary hover:bg-background-soft disabled:opacity-50">
                            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Yenile
                        </button>
                    </div>

                    <form onSubmit={applySearch} className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                        <input value={requestNumberInput} onChange={(event) => setRequestNumberInput(event.target.value)}
                            placeholder="Talep numarası" aria-label="Talep numarası"
                            className="h-10 min-w-0 rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none focus:border-primary" />
                        <input value={orderIdInput} onChange={(event) => setOrderIdInput(event.target.value)}
                            placeholder="Sipariş ID (GUID)" aria-label="Sipariş ID"
                            className="h-10 min-w-0 rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none focus:border-primary" />
                        <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover">
                            <Search className="h-4 w-4" /> Ara
                        </button>
                    </form>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <select value={status} onChange={(event) => { setStatus(event.target.value); setPageIndex(0); }} aria-label="Talep durumu"
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary sm:w-auto">
                            {REQUEST_STATUSES.map((x) => <option key={String(x.value)} value={x.value}>{x.label}</option>)}
                        </select>
                        <select value={requestType} onChange={(event) => { setRequestType(event.target.value); setPageIndex(0); }} aria-label="Talep türü"
                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary sm:w-auto">
                            {REQUEST_TYPES.map((x) => <option key={String(x.value)} value={x.value}>{x.label}</option>)}
                        </select>
                        <button type="button" onClick={clearFilters} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold text-text-secondary hover:bg-background-soft">
                            Filtreleri Temizle
                        </button>
                    </div>
                </div>

                <div className="p-4 sm:p-6">
                    {isLoading || authLoading ? (
                        <div className="flex min-h-52 items-center justify-center gap-2 text-sm text-text-secondary"><LoaderCircle className="h-5 w-5 animate-spin" /> Talepler yükleniyor...</div>
                    ) : error ? (
                        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
                    ) : items.length === 0 ? (
                        <div className="flex min-h-52 flex-col items-center justify-center text-center text-text-secondary">
                            <RotateCcw className="mb-3 h-9 w-9" /><p className="text-sm">Bu kriterlere uygun talep bulunamadı.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-3 md:hidden">
                                {items.map((item) => (
                                    <article key={item.id} className="rounded-xl border border-border p-4">
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="break-all text-sm font-bold text-primary">{item.requestNumber}</p>
                                                <p className="mt-1 text-xs text-text-secondary">{getTypeLabel(item.requestType)} · {formatDate(item.createdDate)}</p>
                                            </div>
                                            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(item.status)}`}>{getStatusLabel(item.status)}</span>
                                        </div>
                                        <p className="mt-3 break-all text-xs text-text-secondary">Sipariş: {item.orderId}</p>
                                        <div className="mt-3 flex items-center justify-between gap-3">
                                            <div><p className="text-xs text-text-secondary">Talep edilen</p><p className="font-bold text-text-primary">{formatMoney(item.requestedItemsTotal)}</p></div>
                                            <button type="button" onClick={() => setSelectedId(item.id)} className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-white"><Eye className="h-4 w-4" /> Detay</button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                            <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
                                <table className="min-w-[900px] w-full text-sm">
                                    <thead className="bg-background-soft/60 text-left text-xs uppercase tracking-wide text-text-secondary">
                                        <tr><th className="px-4 py-3">Talep</th><th className="px-4 py-3">Sipariş</th><th className="px-4 py-3">Tür</th><th className="px-4 py-3">Durum</th><th className="px-4 py-3 text-right">Talep Tutarı</th><th className="px-4 py-3 text-right">İşlem</th></tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item) => (
                                            <tr key={item.id} className="border-t border-border align-middle">
                                                <td className="px-4 py-4"><p className="font-semibold text-text-primary">{item.requestNumber}</p><p className="mt-1 text-xs text-text-secondary">{formatDate(item.createdDate)}</p></td>
                                                <td className="px-4 py-4"><span className="text-xs text-text-secondary" title={item.orderId}>{item.orderId?.slice(0, 8)}...</span></td>
                                                <td className="px-4 py-4 text-text-primary">{getTypeLabel(item.requestType)}</td>
                                                <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(item.status)}`}>{getStatusLabel(item.status)}</span></td>
                                                <td className="px-4 py-4 text-right font-semibold text-text-primary">{formatMoney(item.requestedItemsTotal)}</td>
                                                <td className="px-4 py-4 text-right"><button type="button" onClick={() => setSelectedId(item.id)} className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 font-semibold text-text-primary hover:text-primary"><Eye className="h-4 w-4" /> İncele</button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-border bg-background-soft/30 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <p className="text-sm text-text-secondary">{pagination.count} kayıt · {pagination.pages ? `${pagination.index + 1} / ${pagination.pages} sayfa` : "0 sayfa"}</p>
                    <div className="flex flex-wrap items-center gap-2">
                        <select aria-label="Sayfa boyutu" value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPageIndex(0); }}
                            className="h-10 rounded-lg border border-border bg-white px-3 text-sm">
                            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} / sayfa</option>)}
                        </select>
                        <button type="button" onClick={() => setPageIndex((x) => Math.max(0, x - 1))} disabled={isLoading || !pagination.hasPrevious} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold disabled:opacity-40">Önceki</button>
                        <button type="button" onClick={() => setPageIndex((x) => x + 1)} disabled={isLoading || !pagination.hasNext} className="h-10 rounded-lg border border-border px-4 text-sm font-semibold disabled:opacity-40">Sonraki</button>
                    </div>
                </div>
            </section>

            {selectedId && (
                <OrderReturnRequestDetailModal
                    key={selectedId}
                    requestId={selectedId}
                    onClose={() => setSelectedId(null)}
                    onUpdated={refresh}
                />
            )}
        </>
    );
}
