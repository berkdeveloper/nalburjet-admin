"use client";

import {
    Check,
    ChevronDown,
    LoaderCircle,
    Plus,
    Trash2,
    X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { getProducts } from "@/features/products/services/productService";
import {
    createProductCollection,
    deleteProductCollection,
    getProductCollections,
    getProductsByCollection,
    updateProductCollection,
} from "@/features/productCollections/services/productCollectionService";
import { getProductImageUrl } from "@/lib/api/image";

const COLLECTION_TYPES = {
    BEST_SELLER: "BestSeller",
    POPULAR: "Popular",
};

const COLLECTION_LABELS = {
    BestSeller: "Çok Satanlar",
    Popular: "Popüler Ürünler",
};

const PRODUCT_PAGE_SIZE = 10;
const COLLECTION_PAGE_SIZE = 50;

function formatPrice(value) {
    if (value === null || value === undefined) {
        return "—";
    }

    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value));
}

function getProductImage(product) {
    if (product?.storageKey) {
        return getProductImageUrl(product.storageKey);
    }

    const storageKey = product?.images?.[0]?.storageKey;

    if (!storageKey) {
        return null;
    }

    return getProductImageUrl(storageKey);
}

function getStockStatus(stockQuantity) {
    const stock = Number(stockQuantity ?? 0);

    if (stock <= 0) {
        return {
            label: "Stok Yok",
            className: "text-red-700",
        };
    }

    if (stock <= 5) {
        return {
            label: "Az Stokta",
            className: "text-amber-700",
        };
    }

    return {
        label: "Stokta",
        className: "text-green-700",
    };
}

function getStatusBadge(isActive) {
    return isActive
        ? {
            label: "Aktif",
            className: "bg-green-100 text-green-700",
        }
        : {
            label: "Pasif",
            className: "bg-gray-100 text-gray-600",
        };
}

function getNextCollectionOrder(collections) {
    if (collections.length === 0) {
        return 1;
    }

    const maxOrder = Math.max(
        ...collections.map((item) => Number(item.displayOrder) || 0),
    );

    return maxOrder + 1;
}

function getCollectionProductId(collection) {
    return collection?.productId ?? null;
}

export default function ProductCollectionList() {
    const [activeCollectionType, setActiveCollectionType] = useState(
        COLLECTION_TYPES.BEST_SELLER,
    );

    const [products, setProducts] = useState([]);
    const [collections, setCollections] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [availableProducts, setAvailableProducts] = useState([]);
    const [productSearchInput, setProductSearchInput] = useState("");

    const [availableProductsPageIndex, setAvailableProductsPageIndex] = useState(0);
    const [availableProductsPages, setAvailableProductsPages] = useState(0);
    const [availableProductsCount, setAvailableProductsCount] = useState(0);

    const [isLoadingProducts, setIsLoadingProducts] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState("");

    const [isOrderSaving, setIsOrderSaving] = useState(false);
    const [deletingCollectionId, setDeletingCollectionId] = useState(null);

    const [formError, setFormError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const collectionLabel =
        COLLECTION_LABELS[activeCollectionType] ?? "Vitrin Ürünleri";

    useEffect(() => {
        let isCancelled = false;

        async function loadCollections() {
            try {
                setIsLoading(true);
                setError(null);

                const [productsResponse, collectionsResponse] =
                    await Promise.all([
                        getProductsByCollection(activeCollectionType, {
                            params: {
                                "PageRequest.PageIndex": 0,
                                "PageRequest.PageSize": COLLECTION_PAGE_SIZE,
                            },
                        }),
                        getProductCollections({
                            params: {
                                CollectionType: activeCollectionType,
                                "PageRequest.PageIndex": 0,
                                "PageRequest.PageSize": COLLECTION_PAGE_SIZE,
                            },
                        }),
                    ]);

                if (isCancelled) {
                    return;
                }

                const collectionItems = collectionsResponse?.items ?? [];
                const productItems = productsResponse?.items ?? [];

                setProducts(
                    [...productItems].sort(
                        (a, b) =>
                            Number(a.displayOrder ?? 0) -
                            Number(b.displayOrder ?? 0),
                    ),
                );

                setCollections(
                    [...collectionItems].sort(
                        (a, b) =>
                            Number(a.displayOrder ?? 0) -
                            Number(b.displayOrder ?? 0),
                    ),
                );
            } catch (error) {
                if (isCancelled) {
                    return;
                }

                console.error("Vitrin ürünleri yüklenemedi:", error);

                setError(error);
                setProducts([]);
                setCollections([]);
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }

        loadCollections();

        return () => {
            isCancelled = true;
        };
    }, [activeCollectionType, refreshKey]);

    async function loadAvailableProducts(
        searchValue = "",
        pageIndex = availableProductsPageIndex,
    ) {
        try {
            setIsLoadingProducts(true);
            setFormError(null);

            const response = await getProducts({
                params: {
                    "PageRequest.PageIndex": pageIndex,
                    "PageRequest.PageSize": PRODUCT_PAGE_SIZE,
                    SortBy: "Default",
                    ...(searchValue
                        ? {
                            Search: searchValue,
                        }
                        : {}),
                    IsActive: true,
                },
            });

            const collectionProductIds = new Set(
                collections.map((item) => item.productId),
            );

            const items = (response?.items ?? []).filter(
                (product) => !collectionProductIds.has(product.productId),
            );

            setAvailableProducts(items);
            setAvailableProductsPageIndex(response?.index ?? pageIndex);
            setAvailableProductsPages(response?.pages ?? 0);
            setAvailableProductsCount(response?.count ?? 0);
        } catch (error) {
            console.error("Ürünler yüklenemedi:", error);

            setFormError(error);
            setAvailableProducts([]);
            setAvailableProductsPages(0);
            setAvailableProductsCount(0);
        } finally {
            setIsLoadingProducts(false);
        }
    }

    function handleOpenAddModal() {
        setProductSearchInput("");
        setSelectedProduct(null);
        setSelectedOrder("");
        setFormError(null);
        setAvailableProductsPageIndex(0);
        setIsAddModalOpen(true);

        loadAvailableProducts("", 0);
    }

    function handleCloseAddModal() {
        if (isAdding) {
            return;
        }

        setIsAddModalOpen(false);
        setAvailableProducts([]);
        setSelectedProduct(null);
        setSelectedOrder("");
        setProductSearchInput("");
        setFormError(null);
    }

    async function handleProductSearch(event) {
        event.preventDefault();

        const value = productSearchInput.trim();

        setAvailableProductsPageIndex(0);

        await loadAvailableProducts(value, 0);
    }

    async function handleAvailableProductsPageChange(pageIndex) {
        if (
            pageIndex < 0 ||
            pageIndex >= availableProductsPages ||
            isLoadingProducts
        ) {
            return;
        }

        await loadAvailableProducts(
            productSearchInput.trim(),
            pageIndex,
        );
    }

    function validateOrder(value) {
        if (value === "" || value === null || value === undefined) {
            return "Koleksiyon sırası zorunludur.";
        }

        const order = Number(value);

        if (!Number.isInteger(order) || order < 1 || order > 50) {
            return "Koleksiyon sırası 1 ile 50 arasında olmalıdır.";
        }

        return null;
    }

    async function handleAddProduct() {
        if (!selectedProduct) {
            setFormError(new Error("Lütfen bir ürün seçin."));
            return;
        }

        const orderError = validateOrder(selectedOrder);

        if (orderError) {
            setFormError(new Error(orderError));
            return;
        }

        const order = Number(selectedOrder);

        try {
            setIsAdding(true);
            setFormError(null);

            const existingAtTarget = collections.find(
                (item) => Number(item.displayOrder) === order,
            );

            if (existingAtTarget) {
                const maxOrder = Math.max(
                    ...collections.map(
                        (item) => Number(item.displayOrder) || 0,
                    ),
                );

                await updateProductCollection({
                    id: existingAtTarget.productCollectionId,
                    productId: existingAtTarget.productId,
                    collectionType: activeCollectionType,
                    displayOrder: maxOrder + 1,
                });
            }

            await createProductCollection({
                productId: selectedProduct.productId,
                collectionType: activeCollectionType,
                displayOrder: order,
            });

            handleCloseAddModal();
            setRefreshKey((current) => current + 1);
        } catch (error) {
            console.error("Vitrin ürünü eklenemedi:", error);
            setFormError(error);
        } finally {
            setIsAdding(false);
        }
    }

    async function handleOrderChange(collection, value) {
        const orderError = validateOrder(value);

        if (orderError) {
            setFormError(new Error(orderError));
            return;
        }

        const newOrder = Number(value);
        const currentOrder = Number(collection.displayOrder);

        if (newOrder === currentOrder) {
            return;
        }

        const targetCollection =
            collections.find(
                (item) =>
                    item.productCollectionId !==
                    collection.productCollectionId &&
                    Number(item.displayOrder) === newOrder,
            ) ?? null;

        try {
            setIsOrderSaving(true);
            setFormError(null);

            if (targetCollection) {
                await updateProductCollection({
                    id: targetCollection.productCollectionId,
                    productId: targetCollection.productId,
                    collectionType: activeCollectionType,
                    displayOrder: currentOrder,
                });

                await updateProductCollection({
                    id: collection.productCollectionId,
                    productId: collection.productId,
                    collectionType: activeCollectionType,
                    displayOrder: newOrder,
                });
            } else {
                await updateProductCollection({
                    id: collection.productCollectionId,
                    productId: collection.productId,
                    collectionType: activeCollectionType,
                    displayOrder: newOrder,
                });
            }

            setRefreshKey((current) => current + 1);
        } catch (error) {
            console.error("Koleksiyon sırası güncellenemedi:", error);
            setFormError(error);
        } finally {
            setIsOrderSaving(false);
        }
    }

    async function handleDeleteCollection(collection) {
        const productName =
            products.find(
                (product) =>
                    product.productId === collection.productId,
            )?.name ?? "Bu ürün";

        const confirmed = window.confirm(
            `"${productName}" ürününü ${collectionLabel.toLowerCase()} listesinden çıkarmak istediğinize emin misiniz?`,
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingCollectionId(collection.productCollectionId);
            setFormError(null);

            await deleteProductCollection(
                collection.productCollectionId,
            );

            setRefreshKey((current) => current + 1);
        } catch (error) {
            console.error("Vitrin ürünü silinemedi:", error);
            setFormError(error);
        } finally {
            setDeletingCollectionId(null);
        }
    }

    const productMap = useMemo(() => {
        return new Map(
            products.map((product) => [product.productId, product]),
        );
    }, [products]);

    const collectionRows = useMemo(() => {
        return [...collections].sort(
            (a, b) =>
                Number(a.displayOrder ?? 0) -
                Number(b.displayOrder ?? 0),
        );
    }, [collections]);

    return (
        <div>
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">
                        Vitrin Ürünleri
                    </h2>

                    <p className="mt-1 text-sm text-text-secondary">
                        Ana sayfada gösterilen çok satan ve popüler ürünleri
                        buradan yönetebilirsiniz.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenAddModal}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                    <Plus className="h-4 w-4" />
                    Ürün Ekle
                </button>
            </div>

            <div className="mb-5 flex gap-2 border-b border-border">
                <button
                    type="button"
                    onClick={() =>
                        setActiveCollectionType(
                            COLLECTION_TYPES.BEST_SELLER,
                        )
                    }
                    className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeCollectionType ===
                        COLLECTION_TYPES.BEST_SELLER
                        ? "border-primary text-primary"
                        : "border-transparent text-text-secondary hover:text-text-primary"
                        }`}
                >
                    Çok Satanlar
                </button>

                <button
                    type="button"
                    onClick={() =>
                        setActiveCollectionType(COLLECTION_TYPES.POPULAR)
                    }
                    className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${activeCollectionType === COLLECTION_TYPES.POPULAR
                        ? "border-primary text-primary"
                        : "border-transparent text-text-secondary hover:text-text-primary"
                        }`}
                >
                    Popüler Ürünler
                </button>
            </div>

            {formError && (
                <div className="mb-5 flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    <span>
                        {formError?.message ??
                            "İşlem sırasında bir hata oluştu."}
                    </span>

                    <button
                        type="button"
                        onClick={() => setFormError(null)}
                        className="shrink-0 text-red-500 hover:text-red-700"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-white">
                <div className="flex items-center justify-between border-b border-border px-5 py-4">
                    <div>
                        <p className="text-sm font-semibold text-text-primary">
                            {collectionLabel}
                        </p>

                        <p className="mt-0.5 text-xs text-text-secondary">
                            {isLoading
                                ? "Ürünler yükleniyor..."
                                : `${collectionRows.length} ürün`}
                        </p>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex min-h-80 items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                            Vitrin ürünleri yükleniyor...
                        </div>
                    </div>
                ) : error ? (
                    <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error?.message ??
                            "Vitrin ürünleri yüklenirken bir hata oluştu."}
                    </div>
                ) : collectionRows.length === 0 ? (
                    <div className="flex min-h-80 items-center justify-center px-5">
                        <div className="text-center">
                            <p className="text-sm font-semibold text-text-primary">
                                Bu vitrinde henüz ürün bulunmuyor.
                            </p>

                            <p className="mt-1 text-xs text-text-secondary">
                                Ürün Ekle butonunu kullanarak listeye ürün
                                ekleyebilirsiniz.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px]">
                            <thead>
                                <tr className="border-b border-border bg-background-soft">
                                    <th className="w-28 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Sıra
                                    </th>

                                    <th className="w-20 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Görsel
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Ürün
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        SKU
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Satış Fiyatı
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Stok
                                    </th>

                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Durum
                                    </th>

                                    <th className="w-28 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {collectionRows.map((collection) => {
                                    const product =
                                        productMap.get(
                                            getCollectionProductId(collection),
                                        ) ?? null;

                                    const imageUrl =
                                        getProductImage(product);

                                    const stockStatus =
                                        getStockStatus(
                                            product?.stockQuantity,
                                        );

                                    const statusBadge =
                                        getStatusBadge(product?.isActive);

                                    const hasDiscount =
                                        product?.discountPriceIncludingTax !==
                                        null &&
                                        product?.discountPriceIncludingTax !==
                                        undefined;

                                    return (
                                        <tr
                                            key={
                                                collection.productCollectionId
                                            }
                                            className="border-b border-border last:border-b-0 hover:bg-background-soft/50"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="50"
                                                        defaultValue={
                                                            collection.displayOrder
                                                        }
                                                        onBlur={(event) =>
                                                            handleOrderChange(
                                                                collection,
                                                                event.target
                                                                    .value,
                                                            )
                                                        }
                                                        disabled={
                                                            isOrderSaving
                                                        }
                                                        className="h-9 w-20 rounded-lg border border-border bg-white px-3 text-sm font-semibold text-text-primary outline-none focus:border-primary disabled:opacity-50"
                                                    />

                                                    <ChevronDown className="h-4 w-4 text-text-secondary" />
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-border bg-background-soft">
                                                    {imageUrl ? (
                                                        <Image
                                                            src={imageUrl}
                                                            alt={
                                                                product?.name ??
                                                                "Ürün görseli"
                                                            }
                                                            fill
                                                            sizes="56px"
                                                            className="object-contain p-1"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <span className="text-[10px] text-text-secondary">
                                                                Görsel yok
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="max-w-[330px]">
                                                    <p className="truncate text-sm font-semibold text-text-primary">
                                                        {product?.name ??
                                                            "Ürün bulunamadı"}
                                                    </p>

                                                    {product?.brand && (
                                                        <p className="mt-1 truncate text-xs text-text-secondary">
                                                            {product.brand}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="text-sm text-text-secondary">
                                                    {product?.sku ?? "—"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                {hasDiscount ? (
                                                    <div>
                                                        <p className="text-sm font-semibold text-text-primary">
                                                            {formatPrice(
                                                                product.discountPriceIncludingTax,
                                                            )}
                                                        </p>

                                                        <p className="mt-0.5 text-xs text-text-secondary line-through">
                                                            {formatPrice(
                                                                product.priceIncludingTax,
                                                            )}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-semibold text-text-primary">
                                                        {formatPrice(
                                                            product?.priceIncludingTax,
                                                        )}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-text-primary">
                                                        {product?.stockQuantity ??
                                                            0}
                                                    </span>

                                                    <span className="text-xs text-text-secondary">
                                                        |
                                                    </span>

                                                    <span
                                                        className={`text-xs font-medium ${stockStatus.className}`}
                                                    >
                                                        {stockStatus.label}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.className}`}
                                                >
                                                    {statusBadge.label}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleDeleteCollection(
                                                            collection,
                                                        )
                                                    }
                                                    disabled={
                                                        deletingCollectionId ===
                                                        collection.productCollectionId ||
                                                        isOrderSaving
                                                    }
                                                    className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 text-xs font-medium text-red-600 transition-colors hover:border-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {deletingCollectionId ===
                                                        collection.productCollectionId ? (
                                                        <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    )}
                                                    Çıkar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-border px-5 py-4">
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary">
                                    {collectionLabel} - Ürün Ekle
                                </h3>

                                <p className="mt-1 text-xs text-text-secondary">
                                    Vitrine eklemek istediğiniz ürünü seçin.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseAddModal}
                                disabled={isAdding}
                                className="rounded-lg p-2 text-text-secondary hover:bg-background-soft hover:text-text-primary disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="border-b border-border p-5">
                            <form
                                onSubmit={handleProductSearch}
                                className="flex gap-2"
                            >
                                <input
                                    type="text"
                                    value={productSearchInput}
                                    onChange={(event) =>
                                        setProductSearchInput(
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Ürün adı, SKU veya marka ara..."
                                    className="h-10 flex-1 rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary"
                                />

                                <button
                                    type="submit"
                                    disabled={isLoadingProducts}
                                    className="h-10 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Ara
                                </button>
                            </form>
                        </div>

                        {formError && (
                            <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {formError?.message ??
                                    "İşlem sırasında bir hata oluştu."}
                            </div>
                        )}

                        <div className="min-h-0 flex-1 overflow-y-auto p-5">
                            {isLoadingProducts ? (
                                <div className="flex min-h-52 items-center justify-center">
                                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                                        <LoaderCircle className="h-5 w-5 animate-spin" />
                                        Ürünler yükleniyor...
                                    </div>
                                </div>
                            ) : availableProducts.length === 0 ? (
                                <div className="flex min-h-52 items-center justify-center text-center">
                                    <div>
                                        <p className="text-sm font-semibold text-text-primary">
                                            Ürün bulunamadı.
                                        </p>

                                        <p className="mt-1 text-xs text-text-secondary">
                                            Arama kriterlerinizi değiştirmeyi
                                            deneyin.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {availableProducts.map((product) => {
                                        const imageUrl =
                                            getProductImage(product);

                                        const isSelected =
                                            selectedProduct?.productId ===
                                            product.productId;

                                        return (
                                            <button
                                                key={product.productId}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedProduct(product)
                                                }
                                                className={`flex w-full items-center gap-4 rounded-lg border p-3 text-left transition-colors ${isSelected
                                                    ? "border-primary bg-orange-50"
                                                    : "border-border hover:border-primary/50 hover:bg-background-soft"
                                                    }`}
                                            >
                                                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-background-soft">
                                                    {imageUrl ? (
                                                        <Image
                                                            src={imageUrl}
                                                            alt={
                                                                product.name ??
                                                                "Ürün görseli"
                                                            }
                                                            fill
                                                            sizes="48px"
                                                            className="object-contain p-1"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center">
                                                            <span className="text-[9px] text-text-secondary">
                                                                Görsel yok
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-semibold text-text-primary">
                                                        {product.name}
                                                    </p>

                                                    <p className="mt-1 truncate text-xs text-text-secondary">
                                                        {product.brand || "—"} ·{" "}
                                                        {product.sku || "SKU yok"}
                                                    </p>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <p className="text-sm font-semibold text-text-primary">
                                                        {formatPrice(
                                                            product.discountPriceIncludingTax ??
                                                            product.priceIncludingTax,
                                                        )}
                                                    </p>

                                                    {isSelected && (
                                                        <div className="mt-1 flex items-center justify-end gap-1 text-xs font-medium text-primary">
                                                            <Check className="h-3.5 w-3.5" />
                                                            Seçildi
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                            {availableProductsPages > 1 && (
                                <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                                    <p className="text-xs text-text-secondary">
                                        Toplam{" "}
                                        <span className="font-semibold text-text-primary">
                                            {availableProductsCount}
                                        </span>{" "}
                                        ürün
                                    </p>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleAvailableProductsPageChange(
                                                    availableProductsPageIndex - 1,
                                                )
                                            }
                                            disabled={
                                                availableProductsPageIndex === 0 ||
                                                isLoadingProducts
                                            }
                                            className="h-9 rounded-lg border border-border px-3 text-xs font-medium text-text-primary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Önceki
                                        </button>

                                        <span className="min-w-20 text-center text-xs font-medium text-text-secondary">
                                            {availableProductsPageIndex + 1} /{" "}
                                            {availableProductsPages}
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleAvailableProductsPageChange(
                                                    availableProductsPageIndex + 1,
                                                )
                                            }
                                            disabled={
                                                availableProductsPageIndex >=
                                                availableProductsPages - 1 ||
                                                isLoadingProducts
                                            }
                                            className="h-9 rounded-lg border border-border px-3 text-xs font-medium text-text-primary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            Sonraki
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-border bg-background-soft/50 p-5">
                            <div className="mb-4 flex items-end gap-3">
                                <div className="flex-1">
                                    <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
                                        Koleksiyon Sırası
                                    </label>

                                    <input
                                        type="number"
                                        min="1"
                                        max="50"
                                        value={selectedOrder}
                                        onChange={(event) =>
                                            setSelectedOrder(
                                                event.target.value,
                                            )
                                        }
                                        placeholder={`1 - ${Math.min(
                                            getNextCollectionOrder(collections),
                                            50,
                                        )}`}
                                        disabled={
                                            !selectedProduct || isAdding
                                        }
                                        className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-gray-100"
                                    />
                                </div>

                                <div className="flex-1 text-xs text-text-secondary">
                                    <p>
                                        Mevcut sıra:{" "}
                                        <span className="font-semibold text-text-primary">
                                            {collections.length}
                                        </span>{" "}
                                        ürün
                                    </p>

                                    <p className="mt-1">
                                        Sıra aralığı:{" "}
                                        <span className="font-semibold text-text-primary">
                                            1 - 50
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={handleCloseAddModal}
                                    disabled={isAdding}
                                    className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-text-primary hover:border-primary hover:text-primary disabled:opacity-50"
                                >
                                    Vazgeç
                                </button>

                                <button
                                    type="button"
                                    onClick={handleAddProduct}
                                    disabled={
                                        !selectedProduct ||
                                        !selectedOrder ||
                                        isAdding
                                    }
                                    className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {isAdding && (
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                    )}
                                    Vitrine Ekle
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}