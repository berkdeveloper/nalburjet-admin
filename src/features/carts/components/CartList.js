"use client";

import { useEffect, useState } from "react";
import {
    deleteCartItems,
    getCartById,
    getCarts,
} from "@/features/carts/services/cartService";

export default function CartList() {
    const [carts, setCarts] = useState([]);
    const [search, setSearch] = useState("");
    const [appliedSearch, setAppliedSearch] = useState("");
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

    const [selectedCart, setSelectedCart] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState("");

    const [deletingItemId, setDeletingItemId] = useState(null);
    const [deleteError, setDeleteError] = useState("");

    const [itemToDelete, setItemToDelete] = useState(null);

    async function loadCarts() {
        try {
            setLoading(true);
            setError("");

            const response = await getCarts({
                params: {
                    "PageRequest.PageIndex": pageIndex,
                    "PageRequest.PageSize": pageSize,
                    Search: appliedSearch || undefined,
                },
            });

            setCarts(response.items ?? []);

            setPagination({
                count: response.count ?? 0,
                pages: response.pages ?? 0,
                hasPrevious: response.hasPrevious ?? false,
                hasNext: response.hasNext ?? false,
            });
        } catch (error) {
            setError(error.message || "Sepetler yüklenirken bir hata oluştu.");
            setCarts([]);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        let cancelled = false;

        async function fetchCarts() {
            try {
                setLoading(true);
                setError("");

                const response = await getCarts({
                    params: {
                        "PageRequest.PageIndex": pageIndex,
                        "PageRequest.PageSize": pageSize,
                        Search: appliedSearch || undefined,
                    },
                });

                if (cancelled) {
                    return;
                }

                setCarts(response.items ?? []);

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
                    error.message || "Sepetler yüklenirken bir hata oluştu.",
                );
                setCarts([]);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchCarts();

        return () => {
            cancelled = true;
        };
    }, [pageIndex, appliedSearch]);

    async function handleSearchSubmit(event) {
        event.preventDefault();

        if (pageIndex === 0) {
            setAppliedSearch(search.trim());
            return;
        }

        setPageIndex(0);
        setAppliedSearch(search.trim());
    }

    function handleClearSearch() {
        setSearch("");

        if (pageIndex === 0) {
            setAppliedSearch("");
            return;
        }

        setPageIndex(0);
        setAppliedSearch("");
    }

    async function handleOpenCart(cartId) {
        try {
            setSelectedCart(null);
            setDetailError("");
            setDeleteError("");
            setDetailLoading(true);

            const response = await getCartById(cartId);

            setSelectedCart(response.data ?? null);
        } catch (error) {
            setDetailError(
                error.message || "Sepet detayı yüklenirken bir hata oluştu.",
            );
        } finally {
            setDetailLoading(false);
        }
    }

    function handleCloseCart() {
        if (deletingItemId) {
            return;
        }

        setSelectedCart(null);
        setDetailError("");
        setDeleteError("");
        setItemToDelete(null);
    }

    function handleRequestDeleteItem(item) {
        setDeleteError("");
        setItemToDelete(item);
    }

    function handleCancelDeleteItem() {
        if (deletingItemId) {
            return;
        }

        setItemToDelete(null);
    }

    async function handleDeleteItem() {
        if (!selectedCart || !itemToDelete) {
            return;
        }

        try {
            setDeletingItemId(itemToDelete.cartItemId);
            setDeleteError("");

            await deleteCartItems({
                items: [
                    {
                        cartId: selectedCart.cartId,
                        cartItemId: itemToDelete.cartItemId,
                    },
                ],
            });

            const response = await getCartById(selectedCart.cartId);
            const updatedCart = response.data ?? null;

            setSelectedCart(updatedCart);
            setItemToDelete(null);

            await loadCarts();
        } catch (error) {
            setDeleteError(
                error.message || "Sepet ürünü silinirken bir hata oluştu.",
            );
        } finally {
            setDeletingItemId(null);
        }
    }

    function handlePreviousPage() {
        if (pagination.hasPrevious && !loading) {
            setPageIndex((current) => current - 1);
        }
    }

    function handleNextPage() {
        if (pagination.hasNext && !loading) {
            setPageIndex((current) => current + 1);
        }
    }

    function formatPrice(value) {
        if (value === null || value === undefined) {
            return "-";
        }

        return new Intl.NumberFormat("tr-TR", {
            style: "currency",
            currency: "TRY",
        }).format(value);
    }

    function getItemPrice(item) {
        return item.discountPrice ?? item.price;
    }

    return (
        <>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Sepetler
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Müşteri ve misafir sepetlerini görüntüleyin.
                    </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                    <form
                        onSubmit={handleSearchSubmit}
                        className="flex gap-3"
                    >
                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Müşteri, e-posta veya sepet ara..."
                            className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none transition focus:border-[#EE7402] focus:ring-1 focus:ring-[#EE7402]"
                        />

                        <button
                            type="submit"
                            className="rounded-lg bg-[#EE7402] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#d86600]"
                        >
                            Ara
                        </button>

                        {appliedSearch && (
                            <button
                                type="button"
                                onClick={handleClearSearch}
                                className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                Temizle
                            </button>
                        )}
                    </form>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    {/* Masaüstü Tablo Görünümü */}
                    <div className="hidden overflow-x-auto md:block">
                        <table className="min-w-full">
                            <thead className="border-b border-gray-200 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Müşteri
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        E-posta
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Telefon
                                    </th>

                                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Tür
                                    </th>

                                    <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                        Ürün Adedi
                                    </th>

                                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center text-sm text-gray-500"
                                        >
                                            Sepetler yükleniyor...
                                        </td>
                                    </tr>
                                ) : carts.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="px-6 py-10 text-center text-sm text-gray-500"
                                        >
                                            Sepet bulunamadı.
                                        </td>
                                    </tr>
                                ) : (
                                    carts.map((cart) => (
                                        <tr
                                            key={cart.cartId}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {cart.customerName || "Misafir"}
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {cart.customerEmail || "-"}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {cart.customerPhoneNumber || "-"}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cart.userId
                                                        ? "bg-blue-100 text-blue-700"
                                                        : "bg-orange-100 text-orange-700"
                                                        }`}
                                                >
                                                    {cart.userId ? "Kullanıcı" : "Misafir"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                                                {cart.totalItemCount}
                                            </td>

                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenCart(cart.cartId)}
                                                    className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-[#EE7402] px-4 py-2 text-sm font-medium text-[#EE7402] transition hover:bg-orange-50"
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

                    {/* Mobil Kart Görünümü */}
                    <div className="divide-y divide-gray-200 md:hidden">
                        {loading ? (
                            <div className="px-4 py-10 text-center text-sm text-gray-500">
                                Sepetler yükleniyor...
                            </div>
                        ) : carts.length === 0 ? (
                            <div className="px-4 py-10 text-center text-sm text-gray-500">
                                Sepet bulunamadı.
                            </div>
                        ) : (
                            carts.map((cart) => (
                                <div
                                    key={cart.cartId}
                                    className="space-y-4 p-4 transition hover:bg-gray-50"
                                >
                                    {/* Müşteri Bilgileri */}
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Müşteri
                                            </p>

                                            <p className="break-words text-sm font-semibold text-gray-900">
                                                {cart.customerName || "Misafir"}
                                            </p>
                                        </div>

                                        <span
                                            className={`shrink-0 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${cart.userId
                                                ? "bg-blue-100 text-blue-700"
                                                : "bg-orange-100 text-orange-700"
                                                }`}
                                        >
                                            {cart.userId ? "Kullanıcı" : "Misafir"}
                                        </span>
                                    </div>

                                    {/* İletişim Bilgileri */}
                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="min-w-0">
                                            <p className="mb-1 text-xs font-medium text-gray-500">
                                                E-posta
                                            </p>

                                            <p className="break-all text-sm text-gray-700">
                                                {cart.customerEmail || "-"}
                                            </p>
                                        </div>

                                        <div className="min-w-0">
                                            <p className="mb-1 text-xs font-medium text-gray-500">
                                                Telefon
                                            </p>

                                            <p className="break-words text-sm text-gray-700">
                                                {cart.customerPhoneNumber || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Ürün Adedi ve İşlem */}
                                    <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
                                        <div>
                                            <p className="mb-1 text-xs font-medium text-gray-500">
                                                Ürün Adedi
                                            </p>

                                            <p className="text-sm font-semibold text-gray-900">
                                                {cart.totalItemCount}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenCart(cart.cartId)}
                                            className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-[#EE7402] px-4 py-2 text-sm font-medium text-[#EE7402] transition hover:bg-orange-50"
                                        >
                                            Görüntüle
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Sayfalama */}
                    <div className="flex flex-col gap-4 border-t border-gray-200 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
                        <p className="text-center text-sm text-gray-500 md:text-left">
                            Toplam {pagination.count} sepet
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
                            <button
                                type="button"
                                onClick={handlePreviousPage}
                                disabled={pageIndex <= 0 || !pagination.hasPrevious || loading}
                                className="min-h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Önceki
                            </button>

                            <span className="whitespace-nowrap px-1 text-sm text-gray-600">
                                {pagination.pages > 0 ? pageIndex + 1 : 0} /{" "}
                                {pagination.pages}
                            </span>

                            <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={!pagination.hasNext || loading}
                                className="min-h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Sonraki
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {(selectedCart || detailLoading) && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4">
                    <div className="flex max-h-[95dvh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-xl sm:max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 px-4 py-3 sm:px-6 sm:py-4">
                            <div className="min-w-0 flex-1">
                                <h2 className="text-base font-semibold text-gray-900 sm:text-lg">
                                    Sepet Detayı
                                </h2>

                                {selectedCart && (
                                    <p className="mt-1 break-all text-xs text-gray-500">
                                        {selectedCart.cartId}
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseCart}
                                disabled={!!deletingItemId}
                                aria-label="Sepet detayını kapat"
                                className="shrink-0 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <svg
                                    className="h-5 w-5"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                            {detailLoading ? (
                                <div className="py-16 text-center text-sm text-gray-500">
                                    Sepet detayı yükleniyor...
                                </div>
                            ) : detailError ? (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {detailError}
                                </div>
                            ) : selectedCart ? (
                                <div className="space-y-5 sm:space-y-6">
                                    {/* Müşteri Bilgileri */}
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4">
                                        <div className="min-w-0 rounded-lg border border-gray-200 p-3 sm:p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Müşteri
                                            </p>

                                            <p className="mt-2 break-words text-sm font-medium text-gray-900">
                                                {selectedCart.customerName || "Misafir"}
                                            </p>
                                        </div>

                                        <div className="min-w-0 rounded-lg border border-gray-200 p-3 sm:p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                E-posta
                                            </p>

                                            <p className="mt-2 break-all text-sm text-gray-900">
                                                {selectedCart.customerEmail || "-"}
                                            </p>
                                        </div>

                                        <div className="min-w-0 rounded-lg border border-gray-200 p-3 sm:p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Telefon
                                            </p>

                                            <p className="mt-2 break-words text-sm text-gray-900">
                                                {selectedCart.customerPhoneNumber || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sepet Türü ve Session ID */}
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                                        <div className="min-w-0 rounded-lg border border-gray-200 p-3 sm:p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Sepet Türü
                                            </p>

                                            <span
                                                className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${selectedCart.userId
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-orange-100 text-orange-700"
                                                    }`}
                                            >
                                                {selectedCart.userId ? "Kullanıcı" : "Misafir"}
                                            </span>
                                        </div>

                                        <div className="min-w-0 rounded-lg border border-gray-200 p-3 sm:p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                                                Cart Session ID
                                            </p>

                                            <p className="mt-2 break-all text-sm text-gray-900">
                                                {selectedCart.cartSessionId || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Sepet Ürünleri */}
                                    <div>
                                        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                            <h3 className="text-base font-semibold text-gray-900">
                                                Sepet Ürünleri
                                            </h3>

                                            <span className="text-sm text-gray-500">
                                                Toplam {selectedCart.totalItemCount} adet
                                            </span>
                                        </div>

                                        <div className="overflow-hidden rounded-lg border border-gray-200">
                                            {/* Masaüstü Tablo Görünümü */}
                                            <div className="hidden overflow-x-auto md:block">
                                                <table className="min-w-full">
                                                    <thead className="border-b border-gray-200 bg-gray-50">
                                                        <tr>
                                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                Ürün
                                                            </th>

                                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                SKU
                                                            </th>

                                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                Fiyat
                                                            </th>

                                                            <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                Adet
                                                            </th>

                                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                                                İşlem
                                                            </th>
                                                        </tr>
                                                    </thead>

                                                    <tbody className="divide-y divide-gray-200">
                                                        {selectedCart.items?.length ? (
                                                            selectedCart.items.map((item) => (
                                                                <tr key={item.cartItemId}>
                                                                    <td className="px-4 py-4">
                                                                        <div className="max-w-md break-words text-sm font-medium text-gray-900">
                                                                            {item.productName}
                                                                        </div>

                                                                        <div className="mt-1 break-all text-xs text-gray-500">
                                                                            {item.productId}
                                                                        </div>
                                                                    </td>

                                                                    <td className="px-4 py-4 text-sm text-gray-600">
                                                                        {item.sku}
                                                                    </td>

                                                                    <td className="px-4 py-4 text-right">
                                                                        {item.discountPriceIncludingTax !== null ? (
                                                                            <div>
                                                                                <div className="text-xs text-gray-400 line-through">
                                                                                    {formatPrice(item.priceIncludingTax)}
                                                                                </div>

                                                                                <div className="text-sm font-semibold text-[#EE7402]">
                                                                                    {formatPrice(item.discountPriceIncludingTax)}
                                                                                </div>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-sm font-medium text-gray-900">
                                                                                {formatPrice(item.priceIncludingTax)}
                                                                            </div>
                                                                        )}
                                                                    </td>

                                                                    <td className="px-4 py-4 text-center text-sm font-medium text-gray-900">
                                                                        {item.quantity}
                                                                    </td>

                                                                    <td className="px-4 py-4 text-right">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRequestDeleteItem(item)}
                                                                            disabled={!!deletingItemId}
                                                                            className="text-sm font-medium text-red-600 transition hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                                        >
                                                                            Sil
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td
                                                                    colSpan={5}
                                                                    className="px-4 py-10 text-center text-sm text-gray-500"
                                                                >
                                                                    Bu sepette ürün bulunmuyor.
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>

                                            {/* Mobil Kart Görünümü */}
                                            <div className="divide-y divide-gray-200 md:hidden">
                                                {selectedCart.items?.length ? (
                                                    selectedCart.items.map((item) => (
                                                        <div
                                                            key={item.cartItemId}
                                                            className="space-y-3 p-3 sm:p-4"
                                                        >
                                                            {/* Ürün Adı ve SKU */}
                                                            <div className="min-w-0">
                                                                <p className="break-words text-sm font-semibold leading-5 text-gray-900">
                                                                    {item.productName}
                                                                </p>

                                                                <p className="mt-1 break-all text-xs text-gray-500">
                                                                    Ürün ID: {item.productId}
                                                                </p>

                                                                <p className="mt-1 break-words text-xs text-gray-500">
                                                                    SKU: {item.sku || "-"}
                                                                </p>
                                                            </div>

                                                            {/* Fiyat ve Adet */}
                                                            <div className="flex items-end justify-between gap-3 border-t border-gray-100 pt-3">
                                                                <div className="min-w-0">
                                                                    <p className="mb-1 text-xs text-gray-500">
                                                                        Birim Fiyat
                                                                    </p>

                                                                    {item.discountPriceIncludingTax !== null ? (
                                                                        <div>
                                                                            <p className="text-xs text-gray-400 line-through">
                                                                                {formatPrice(item.priceIncludingTax)}
                                                                            </p>

                                                                            <p className="text-sm font-semibold text-[#EE7402]">
                                                                                {formatPrice(item.discountPriceIncludingTax)}
                                                                            </p>
                                                                        </div>
                                                                    ) : (
                                                                        <p className="text-sm font-semibold text-gray-900">
                                                                            {formatPrice(item.priceIncludingTax)}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                <div className="shrink-0 text-right">
                                                                    <p className="mb-1 text-xs text-gray-500">
                                                                        Adet
                                                                    </p>

                                                                    <p className="text-sm font-semibold text-gray-900">
                                                                        {item.quantity}
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Silme İşlemi */}
                                                            <div className="flex justify-end border-t border-gray-100 pt-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRequestDeleteItem(item)}
                                                                    disabled={!!deletingItemId}
                                                                    className="inline-flex min-h-10 items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                                                                >
                                                                    Sil
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-10 text-center text-sm text-gray-500">
                                                        Bu sepette ürün bulunmuyor.
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {itemToDelete && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-3 sm:p-4">
                    <div className="w-full max-w-md rounded-xl bg-white p-4 shadow-xl sm:p-6">
                        {/* Başlık */}
                        <h3 className="text-base font-semibold text-gray-900 sm:text-lg">
                            Ürünü Sepetten Sil
                        </h3>

                        {/* Açıklama */}
                        <p className="mt-2 break-words text-sm leading-6 text-gray-600">
                            <span className="font-medium text-gray-900">
                                {itemToDelete.productName}
                            </span>{" "}
                            ürününü bu sepetten silmek istediğinize emin misiniz?
                        </p>

                        {/* Hata Mesajı */}
                        {deleteError && (
                            <div className="mt-4 break-words rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm leading-5 text-red-700 sm:px-4">
                                {deleteError}
                            </div>
                        )}

                        {/* İşlem Butonları */}
                        <div className="mt-5 flex flex-col-reverse gap-2 sm:mt-6 sm:flex-row sm:justify-end sm:gap-3">
                            <button
                                type="button"
                                onClick={handleCancelDeleteItem}
                                disabled={!!deletingItemId}
                                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                Vazgeç
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteItem}
                                disabled={!!deletingItemId}
                                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                            >
                                {deletingItemId
                                    ? "Siliniyor..."
                                    : deleteError
                                        ? "Tekrar Dene"
                                        : "Evet, Sil"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}