"use client";

import { LoaderCircle, X } from "lucide-react";

import { useEffect, useState } from "react";

import { getCategories } from "@/features/categories/services/categoryService";

import CategorySelectorModal from "@/features/categories/components/CategorySelectorModal";

import ProductImageManager from "@/features/products/components/ProductImageManager";

import RichTextEditor from "@/components/ui/RichTextEditor";

import {
    getProductById,
    updateProduct,
} from "@/features/products/services/productService";

import {
    createProductCollection,
    deleteProductCollection,
    getProductCollections,
    updateProductCollection,
} from "@/features/productCollections/services/productCollectionService";

const COLLECTION_TYPES = {
    BEST_SELLER: "BestSeller",
    POPULAR: "Popular",
};

function createInitialForm(product) {
    const hasDiscount =
        product?.discountPrice !== null &&
        product?.discountPrice !== undefined;

    return {
        categoryId: product?.categoryId ?? "",
        name: product?.name ?? "",
        slug: product?.slug ?? "",
        sku: product?.sku ?? "",
        barcode: product?.barcode ?? "",
        mpn: product?.mpn ?? "",
        description: product?.description ?? "",
        price: product?.price ?? "",
        discountPrice: hasDiscount ? product.discountPrice : "",
        isDiscounted: hasDiscount,
        taxRate: product?.taxRate ?? 20,
        stockQuantity: product?.stockQuantity ?? 0,
        brand: product?.brand ?? "",
        isActive: product?.isActive ?? true,
        isWeeklyDeal: product?.isWeeklyDeal ?? false,
        isHighlight: product?.isHighlight ?? false,
    };
}

function getCollectionRecord(collections, productId) {
    return (
        collections.find((item) => item.productId === productId) ?? null
    );
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

export default function ProductEditModal({
    isOpen,
    product,
    brands,
    onClose,
    onUpdated,
}) {
    const [currentProduct, setCurrentProduct] = useState(product);
    const [form, setForm] = useState(() => createInitialForm(product));

    const [categories, setCategories] = useState([]);
    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [bestSellerCollections, setBestSellerCollections] = useState([]);
    const [popularCollections, setPopularCollections] = useState([]);

    const [bestSeller, setBestSeller] = useState(null);
    const [popular, setPopular] = useState(null);

    const [bestSellerSelected, setBestSellerSelected] = useState(false);
    const [popularSelected, setPopularSelected] = useState(false);

    const [bestSellerOrder, setBestSellerOrder] = useState("");
    const [popularOrder, setPopularOrder] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingCollections, setIsLoadingCollections] =
        useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isManagingCollections, setIsManagingCollections] =
        useState(false);

    const [error, setError] = useState(null);

    useEffect(() => {
        if (!isOpen || !product?.productId) {
            return;
        }

        let isCancelled = false;

        async function loadData() {
            try {
                setIsLoading(true);
                setIsLoadingCollections(true);
                setError(null);

                const [
                    productResponse,
                    categoriesResponse,
                    bestSellerResponse,
                    popularResponse,
                ] = await Promise.all([
                    getProductById(product.productId),
                    getCategories({
                        params: {
                            "PageRequest.PageIndex": 0,
                            "PageRequest.PageSize": 100,
                        },
                    }),
                    getProductCollections({
                        params: {
                            CollectionType: COLLECTION_TYPES.BEST_SELLER,
                            "PageRequest.PageIndex": 0,
                            "PageRequest.PageSize": 100,
                        },
                    }),
                    getProductCollections({
                        params: {
                            CollectionType: COLLECTION_TYPES.POPULAR,
                            "PageRequest.PageIndex": 0,
                            "PageRequest.PageSize": 100,
                        },
                    }),
                ]);

                if (isCancelled) {
                    return;
                }

                const loadedProduct = productResponse?.data ?? product;
                const loadedCategories = categoriesResponse?.items ?? [];
                const loadedBestSeller =
                    bestSellerResponse?.items ?? [];
                const loadedPopular = popularResponse?.items ?? [];

                const loadedBestSellerRecord = getCollectionRecord(
                    loadedBestSeller,
                    loadedProduct.productId,
                );

                const loadedPopularRecord = getCollectionRecord(
                    loadedPopular,
                    loadedProduct.productId,
                );

                setCurrentProduct(loadedProduct);
                setForm(createInitialForm(loadedProduct));

                setCategories(loadedCategories);

                setBestSellerCollections(loadedBestSeller);
                setPopularCollections(loadedPopular);

                setBestSeller(loadedBestSellerRecord);
                setPopular(loadedPopularRecord);

                setBestSellerSelected(Boolean(loadedBestSellerRecord));
                setPopularSelected(Boolean(loadedPopularRecord));

                setBestSellerOrder(
                    loadedBestSellerRecord?.displayOrder ??
                    getNextCollectionOrder(loadedBestSeller),
                );

                setPopularOrder(
                    loadedPopularRecord?.displayOrder ??
                    getNextCollectionOrder(loadedPopular),
                );
            } catch (error) {
                if (!isCancelled) {
                    console.error("Ürün detayları yüklenemedi:", error);
                    setError(error);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                    setIsLoadingCollections(false);
                }
            }
        }

        loadData();

        return () => {
            isCancelled = true;
        };
    }, [isOpen, product]);

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));
    }

    function handleDiscountToggle(event) {
        const checked = event.target.checked;

        setForm((current) => ({
            ...current,
            isDiscounted: checked,
            discountPrice: checked ? current.discountPrice : "",
        }));
    }

    function handleBestSellerToggle(event) {
        const checked = event.target.checked;

        setBestSellerSelected(checked);

        if (!checked) {
            return;
        }

        if (bestSeller) {
            setBestSellerOrder(bestSeller.displayOrder);
            return;
        }

        setBestSellerOrder(
            getNextCollectionOrder(bestSellerCollections),
        );
    }

    function handlePopularToggle(event) {
        const checked = event.target.checked;

        setPopularSelected(checked);

        if (!checked) {
            return;
        }

        if (popular) {
            setPopularOrder(popular.displayOrder);
            return;
        }

        setPopularOrder(getNextCollectionOrder(popularCollections));
    }

    function handleBestSellerOrderChange(event) {
        setBestSellerOrder(event.target.value);
    }

    function handlePopularOrderChange(event) {
        setPopularOrder(event.target.value);
    }

    function validateProduct() {
        if (!form.categoryId) {
            return new Error("Kategori seçimi zorunludur.");
        }

        if (!form.name.trim()) {
            return new Error("Ürün adı zorunludur.");
        }

        if (form.price === "" || Number(form.price) < 0) {
            return new Error("Geçerli bir fiyat giriniz.");
        }

        if (form.isDiscounted) {
            if (
                form.discountPrice === "" ||
                Number(form.discountPrice) < 0
            ) {
                return new Error("Geçerli bir indirimli fiyat giriniz.");
            }

            if (Number(form.discountPrice) >= Number(form.price)) {
                return new Error(
                    "İndirimli fiyat normal fiyattan düşük olmalıdır.",
                );
            }
        }

        if (form.taxRate === "" || Number(form.taxRate) < 0) {
            return new Error("Geçerli bir KDV oranı giriniz.");
        }

        if (
            form.stockQuantity === "" ||
            Number(form.stockQuantity) < 0
        ) {
            return new Error("Geçerli bir stok miktarı giriniz.");
        }

        return null;
    }

    function validateCollectionOrder(value) {
        if (value === "" || value === null || value === undefined) {
            return new Error("Koleksiyon sırası zorunludur.");
        }

        const order = Number(value);

        if (!Number.isInteger(order) || order < 1 || order > 50) {
            return new Error(
                "Koleksiyon sırası 1 ile 50 arasında olmalıdır.",
            );
        }

        return null;
    }

    async function createCollection(
        collectionType,
        order,
        collections,
        productId,
    ) {
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
                collectionType,
                displayOrder: maxOrder + 1,
            });
        }

        const response = await createProductCollection({
            productId,
            collectionType,
            displayOrder: order,
        });

        return response?.data ?? null;
    }

    async function updateExistingCollectionOrder(
        currentCollection,
        targetCollection,
        collectionType,
        newOrder,
    ) {
        if (targetCollection) {
            await updateProductCollection({
                id: targetCollection.productCollectionId,
                productId: targetCollection.productId,
                collectionType,
                displayOrder: Number(currentCollection.displayOrder),
            });

            await updateProductCollection({
                id: currentCollection.productCollectionId,
                productId: currentCollection.productId,
                collectionType,
                displayOrder: newOrder,
            });

            return;
        }

        await updateProductCollection({
            id: currentCollection.productCollectionId,
            productId: currentCollection.productId,
            collectionType,
            displayOrder: newOrder,
        });
    }

    async function saveCollection({
        collectionType,
        selected,
        currentCollection,
        desiredOrder,
        collections,
        productId,
    }) {
        if (!selected) {
            if (currentCollection) {
                await deleteProductCollection(
                    currentCollection.productCollectionId,
                );
            }

            return null;
        }

        const orderError = validateCollectionOrder(desiredOrder);

        if (orderError) {
            throw orderError;
        }

        const order = Number(desiredOrder);

        if (!currentCollection) {
            return createCollection(
                collectionType,
                order,
                collections,
                productId,
            );
        }

        const currentOrder = Number(
            currentCollection.displayOrder,
        );

        if (currentOrder === order) {
            return currentCollection;
        }

        const targetCollection = collections.find(
            (item) =>
                item.productCollectionId !==
                currentCollection.productCollectionId &&
                Number(item.displayOrder) === order,
        );

        await updateExistingCollectionOrder(
            currentCollection,
            targetCollection,
            collectionType,
            order,
        );

        return {
            ...currentCollection,
            displayOrder: order,
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const validationError = validateProduct();

        if (validationError) {
            setError(validationError);
            return;
        }

        if (bestSellerSelected) {
            const bestSellerOrderError =
                validateCollectionOrder(bestSellerOrder);

            if (bestSellerOrderError) {
                setError(
                    new Error(
                        `Çok Satanlar: ${bestSellerOrderError.message}`,
                    ),
                );
                return;
            }
        }

        if (popularSelected) {
            const popularOrderError =
                validateCollectionOrder(popularOrder);

            if (popularOrderError) {
                setError(
                    new Error(
                        `Popüler Ürünler: ${popularOrderError.message}`,
                    ),
                );
                return;
            }
        }

        if (!currentProduct?.productId) {
            setError(new Error("Güncellenecek ürün bulunamadı."));
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const response = await updateProduct({
                id: currentProduct.productId,
                categoryId: form.categoryId,
                name: form.name.trim(),
                barcode: form.barcode.trim() || null,
                mpn: form.mpn.trim() || null,
                description: form.description.trim(),
                price: Number(form.price),
                discountPrice: form.isDiscounted
                    ? Number(form.discountPrice)
                    : null,
                taxRate: Number(form.taxRate),
                stockQuantity: Number(form.stockQuantity),
                brand: form.brand.trim(),
                isActive: form.isActive,
                isWeeklyDeal: form.isWeeklyDeal,
                isHighlight: form.isHighlight,
            });

            const updatedProduct = response?.data ?? currentProduct;

            setCurrentProduct(updatedProduct);

            setIsManagingCollections(true);

            const nextBestSeller = await saveCollection({
                collectionType: COLLECTION_TYPES.BEST_SELLER,
                selected: bestSellerSelected,
                currentCollection: bestSeller,
                desiredOrder: bestSellerOrder,
                collections: bestSellerCollections,
                productId: updatedProduct.productId,
            });

            const nextPopular = await saveCollection({
                collectionType: COLLECTION_TYPES.POPULAR,
                selected: popularSelected,
                currentCollection: popular,
                desiredOrder: popularOrder,
                collections: popularCollections,
                productId: updatedProduct.productId,
            });

            setBestSeller(nextBestSeller);
            setPopular(nextPopular);

            onUpdated(updatedProduct);
            onClose();
        } catch (error) {
            console.error("Ürün güncellenemedi:", error);
            setError(error);
        } finally {
            setIsManagingCollections(false);
            setIsSubmitting(false);
        }
    }

    function handleClose() {
        if (isSubmitting || isManagingCollections) {
            return;
        }

        onClose();
    }

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                            Ürün Düzenle
                        </h3>

                        <p className="mt-0.5 text-xs text-text-secondary">
                            {currentProduct?.name || "Ürün"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting || isManagingCollections}
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-soft hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="flex min-h-96 items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                            Ürün bilgileri yükleniyor...
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="overflow-y-auto">
                        <div className="space-y-6 p-6">
                            {error && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {error.message ||
                                        "Ürün güncellenirken bir hata oluştu."}
                                </div>
                            )}

                            <section>
                                <h4 className="mb-4 text-sm font-semibold text-text-primary">
                                    Temel Bilgiler
                                </h4>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                            Ürün Adı *
                                        </label>

                                        <input
                                            name="name"
                                            value={form.name}
                                            onChange={handleChange}
                                            className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                            Kategori *
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => setIsCategoryModalOpen(true)}
                                            disabled={isSubmitting || isManagingCollections}
                                            className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-white px-3 text-left text-sm outline-none transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            <span
                                                className={
                                                    form.categoryId
                                                        ? "text-text-primary"
                                                        : "text-text-secondary"
                                                }
                                            >
                                                {form.categoryId
                                                    ? categories.find(
                                                        (category) =>
                                                            category.categoryId ===
                                                            form.categoryId,
                                                    )?.name ?? "Kategori seçin"
                                                    : "Kategori seçin"}
                                            </span>

                                            <span className="text-xs text-text-secondary">
                                                Seç
                                            </span>
                                        </button>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                            Slug
                                        </label>

                                        <input
                                            value={form.slug}
                                            disabled
                                            className="h-10 w-full rounded-lg border border-border bg-background-soft px-3 text-sm text-text-secondary outline-none disabled:cursor-not-allowed disabled:opacity-70"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                            Marka
                                        </label>

                                        <select
                                            name="brand"
                                            value={form.brand}
                                            onChange={handleChange}
                                            className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm outline-none focus:border-primary"
                                        >
                                            <option value="">
                                                Marka seçin
                                            </option>

                                            {brands.map((item) => (
                                                <option key={item} value={item}>
                                                    {item}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                            SKU
                                        </label>

                                        <input
                                            value={form.sku}
                                            disabled
                                            className="h-10 w-full rounded-lg border border-border bg-background-soft px-3 text-sm text-text-secondary outline-none disabled:cursor-not-allowed disabled:opacity-70"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                            Barkod
                                        </label>

                                        <input
                                            name="barcode"
                                            value={form.barcode}
                                            onChange={handleChange}
                                            className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                            Üretici Ürün Kodu
                                        </label>

                                        <input
                                            name="mpn"
                                            value={form.mpn}
                                            onChange={handleChange}
                                            placeholder="Üretici ürün/parça kodu"
                                            className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h4 className="mb-4 text-sm font-semibold text-text-primary">
                                    Fiyat ve Stok
                                </h4>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                            Fiyat *
                                        </label>

                                        <input
                                            type="number"
                                            name="price"
                                            min="0"
                                            step="0.01"
                                            value={form.price}
                                            onChange={handleChange}
                                            className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                            KDV Oranı *
                                        </label>

                                        <input
                                            type="number"
                                            name="taxRate"
                                            min="0"
                                            step="0.01"
                                            value={form.taxRate}
                                            onChange={handleChange}
                                            className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                            Stok *
                                        </label>

                                        <input
                                            type="number"
                                            name="stockQuantity"
                                            min="0"
                                            step="1"
                                            value={form.stockQuantity}
                                            onChange={handleChange}
                                            className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 rounded-lg border border-border p-4">
                                    <label className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={form.isDiscounted}
                                            onChange={handleDiscountToggle}
                                            className="h-4 w-4 accent-primary"
                                        />

                                        <span className="text-sm font-medium text-text-primary">
                                            İndirimli ürün
                                        </span>
                                    </label>

                                    {form.isDiscounted && (
                                        <div className="mt-3">
                                            <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                                İndirimli Fiyat *
                                            </label>

                                            <input
                                                type="number"
                                                name="discountPrice"
                                                min="0"
                                                step="0.01"
                                                value={form.discountPrice}
                                                onChange={handleChange}
                                                placeholder="Örn. 4199"
                                                className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary"
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section>
                                <h4 className="mb-4 text-sm font-semibold text-text-primary">
                                    Ürün Durumu
                                </h4>

                                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                                    <label className="flex items-center gap-3 rounded-lg border border-border p-3">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            checked={form.isActive}
                                            onChange={handleChange}
                                            className="h-4 w-4 accent-primary"
                                        />

                                        <span className="text-sm font-medium text-text-primary">
                                            Aktif
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-3 rounded-lg border border-border p-3">
                                        <input
                                            type="checkbox"
                                            name="isWeeklyDeal"
                                            checked={form.isWeeklyDeal}
                                            onChange={handleChange}
                                            className="h-4 w-4 accent-primary"
                                        />

                                        <span className="text-sm font-medium text-text-primary">
                                            Haftanın fırsatı
                                        </span>
                                    </label>

                                    <label className="flex items-center gap-3 rounded-lg border border-border p-3">
                                        <input
                                            type="checkbox"
                                            name="isHighlight"
                                            checked={form.isHighlight}
                                            onChange={handleChange}
                                            className="h-4 w-4 accent-primary"
                                        />

                                        <span className="text-sm font-medium text-text-primary">
                                            Öne çıkan
                                        </span>
                                    </label>
                                </div>
                            </section>

                            <section>
                                <h4 className="mb-4 text-sm font-semibold text-text-primary">
                                    Ürün Koleksiyonları
                                </h4>

                                {isLoadingCollections ? (
                                    <div className="flex items-center gap-2 rounded-lg border border-border px-4 py-4 text-sm text-text-secondary">
                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                        Koleksiyonlar yükleniyor...
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-border p-4">
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={bestSellerSelected}
                                                    onChange={handleBestSellerToggle}
                                                    disabled={
                                                        isSubmitting ||
                                                        isManagingCollections
                                                    }
                                                    className="h-4 w-4 accent-primary"
                                                />

                                                <span className="text-sm font-semibold text-text-primary">
                                                    Çok Satanlar
                                                </span>
                                            </label>

                                            {bestSellerSelected && (
                                                <div className="mt-4">
                                                    <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                                        Sıralama Sırası
                                                    </label>

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="50"
                                                        step="1"
                                                        value={bestSellerOrder}
                                                        onChange={
                                                            handleBestSellerOrderChange
                                                        }
                                                        disabled={
                                                            isSubmitting ||
                                                            isManagingCollections
                                                        }
                                                        className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary disabled:bg-background-soft disabled:opacity-70"
                                                    />

                                                    {bestSeller ? (
                                                        <p className="mt-1.5 text-xs text-text-secondary">
                                                            Mevcut sıra:{" "}
                                                            {
                                                                bestSeller.displayOrder
                                                            }
                                                        </p>
                                                    ) : (
                                                        <p className="mt-1.5 text-xs text-text-secondary">
                                                            Yeni ürün bu koleksiyona
                                                            eklenecek. Mevcut listenin
                                                            sonuna otomatik olarak
                                                            eklemek için varsayılan sıra
                                                            kullanılmıştır.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-xl border border-border p-4">
                                            <label className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={popularSelected}
                                                    onChange={handlePopularToggle}
                                                    disabled={
                                                        isSubmitting ||
                                                        isManagingCollections
                                                    }
                                                    className="h-4 w-4 accent-primary"
                                                />

                                                <span className="text-sm font-semibold text-text-primary">
                                                    Popüler Ürünler
                                                </span>
                                            </label>

                                            {popularSelected && (
                                                <div className="mt-4">
                                                    <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                                        Sıralama Sırası
                                                    </label>

                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max="50"
                                                        step="1"
                                                        value={popularOrder}
                                                        onChange={
                                                            handlePopularOrderChange
                                                        }
                                                        disabled={
                                                            isSubmitting ||
                                                            isManagingCollections
                                                        }
                                                        className="h-10 w-full rounded-lg border border-border px-3 text-sm outline-none focus:border-primary disabled:bg-background-soft disabled:opacity-70"
                                                    />

                                                    {popular ? (
                                                        <p className="mt-1.5 text-xs text-text-secondary">
                                                            Mevcut sıra:{" "}
                                                            {
                                                                popular.displayOrder
                                                            }
                                                        </p>
                                                    ) : (
                                                        <p className="mt-1.5 text-xs text-text-secondary">
                                                            Yeni ürün bu koleksiyona
                                                            eklenecek. Mevcut listenin
                                                            sonuna otomatik olarak
                                                            eklemek için varsayılan sıra
                                                            kullanılmıştır.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </section>

                            <section>
                                <h4 className="mb-4 text-sm font-semibold text-text-primary">
                                    Açıklama
                                </h4>

                                <RichTextEditor
                                    value={form.description}
                                    onChange={(description) =>
                                        setForm((current) => ({
                                            ...current,
                                            description,
                                        }))
                                    }
                                />
                            </section>

                            <ProductImageManager
                                product={currentProduct}
                                onProductChange={setCurrentProduct}
                            />
                        </div>

                        <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={
                                    isSubmitting || isManagingCollections
                                }
                                className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-text-primary hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                İptal
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    isManagingCollections ||
                                    isLoadingCollections
                                }
                                className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {(isSubmitting || isManagingCollections) && (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                )}

                                {isManagingCollections
                                    ? "Koleksiyonlar güncelleniyor..."
                                    : "Değişiklikleri Kaydet"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            {isCategoryModalOpen && (
                <CategorySelectorModal
                    categories={categories}
                    selectedCategoryId={form.categoryId}
                    onSelect={(category) => {
                        setForm((current) => ({
                            ...current,
                            categoryId: category.categoryId,
                        }));

                        setIsCategoryModalOpen(false);
                    }}
                    onClose={() => setIsCategoryModalOpen(false)}
                />
            )}
        </div>
    );
}