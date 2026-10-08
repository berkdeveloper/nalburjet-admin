"use client";

import { Check, ChevronDown, LoaderCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

import { getCategories } from "@/features/categories/services/categoryService";
import { createProduct } from "@/features/products/services/productService";
import CategorySelectorModal from "@/features/categories/components/CategorySelectorModal";

const INITIAL_FORM = {
    categoryId: "",
    name: "",
    slug: "",
    sku: "",
    barcode: "",
    mpn: "",
    description: "",
    price: "",
    discountPrice: "",
    taxRate: "20",
    stockQuantity: "",
    brand: "",
    isActive: true,
    isWeeklyDeal: false,
    isHighlight: false,
    isDiscounted: false,
};

function appendFormValue(formData, key, value) {
    formData.append(key, String(value));
}

export default function ProductCreateModal({
    isOpen,
    brands,
    onClose,
    onCreated,
}) {
    const [form, setForm] = useState(() => ({ ...INITIAL_FORM }));
    const [categories, setCategories] = useState([]);
    const [images, setImages] = useState([]);

    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
    const [isBrandDropdownOpen, setIsBrandDropdownOpen] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        let isCancelled = false;

        async function loadCategories() {
            try {
                setIsLoadingCategories(true);
                setError(null);

                const response = await getCategories({
                    params: {
                        "PageRequest.PageIndex": 0,
                        "PageRequest.PageSize": 100,
                    },
                });

                if (!isCancelled) {
                    setCategories(response?.items ?? []);
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error("Kategoriler yüklenemedi:", error);
                    setError(error);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingCategories(false);
                }
            }
        }

        loadCategories();

        return () => {
            isCancelled = true;
        };
    }, [isOpen]);

    const filteredBrands = (brands ?? []).filter((brand) => {
        const search = form.brand.trim().toLocaleLowerCase("tr-TR");

        if (!search) {
            return true;
        }

        return brand.toLocaleLowerCase("tr-TR").includes(search);
    });

    function resetForm() {
        setForm({ ...INITIAL_FORM });
        setImages([]);
        setError(null);
        setIsCategoryModalOpen(false);
        setIsBrandDropdownOpen(false);
    }

    function handleClose() {
        if (isSubmitting) {
            return;
        }

        resetForm();
        onClose();
    }

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

    function handleImageChange(event) {
        setImages(Array.from(event.target.files ?? []));
    }

    function validate() {
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
            if (form.discountPrice === "" || Number(form.discountPrice) < 0) {
                return new Error("Geçerli bir indirimli fiyat giriniz.");
            }

            if (Number(form.discountPrice) >= Number(form.price)) {
                return new Error(
                    "İndirimli fiyat normal fiyattan düşük olmalıdır.",
                );
            }
        }

        if (form.stockQuantity === "" || Number(form.stockQuantity) < 0) {
            return new Error("Geçerli bir stok miktarı giriniz.");
        }

        if (form.taxRate === "" || Number(form.taxRate) < 0) {
            return new Error("Geçerli bir KDV oranı giriniz.");
        }

        return null;
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const validationError = validate();

        if (validationError) {
            setError(validationError);
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            const formData = new FormData();

            appendFormValue(formData, "CategoryId", form.categoryId);
            appendFormValue(formData, "Name", form.name.trim());
            appendFormValue(formData, "Barcode", form.barcode.trim());
            appendFormValue(formData, "Mpn", form.mpn.trim());
            appendFormValue(formData, "Description", form.description.trim());
            appendFormValue(formData, "Price", Number(form.price));

            if (form.isDiscounted) {
                appendFormValue(
                    formData,
                    "DiscountPrice",
                    Number(form.discountPrice),
                );
            }

            appendFormValue(formData, "TaxRate", Number(form.taxRate));
            appendFormValue(
                formData,
                "StockQuantity",
                Number(form.stockQuantity),
            );
            appendFormValue(formData, "Brand", form.brand.trim());
            appendFormValue(formData, "IsActive", form.isActive);
            appendFormValue(formData, "IsWeeklyDeal", form.isWeeklyDeal);
            appendFormValue(formData, "IsHighlight", form.isHighlight);

            images.forEach((file) => {
                formData.append("Images", file);
            });

            const response = await createProduct(formData);

            onCreated(response?.data ?? null);
            resetForm();
            onClose();
        } catch (error) {
            console.error("Ürün oluşturulamadı:", error);
            setError(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-border px-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-text-primary">
                            Yeni Ürün
                        </h3>

                        <p className="mt-0.5 text-xs text-text-secondary">
                            Mağazaya yeni bir ürün ekleyin.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-soft hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="overflow-y-auto">
                    <div className="space-y-6 p-6">
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error.message || "Ürün oluşturulurken bir hata oluştu."}
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
                                        disabled={isLoadingCategories}
                                        className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-white px-3 text-left text-sm outline-none transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <span
                                            className={
                                                form.categoryId
                                                    ? "text-text-primary"
                                                    : "text-text-secondary"
                                            }
                                        >
                                            {isLoadingCategories
                                                ? "Kategoriler yükleniyor..."
                                                : form.categoryId
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
                                        placeholder="Ürün oluşturulduktan sonra otomatik oluşturulur."
                                        className="h-10 w-full rounded-lg border border-border bg-background-soft px-3 text-sm text-text-secondary outline-none disabled:cursor-not-allowed disabled:opacity-70"
                                    />
                                </div>

                                <div className="relative">
                                    <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                        Marka
                                    </label>

                                    <div className="relative">
                                        <input
                                            name="brand"
                                            value={form.brand}
                                            onChange={(event) => {
                                                handleChange(event);
                                                setIsBrandDropdownOpen(true);
                                            }}
                                            onFocus={() => setIsBrandDropdownOpen(true)}
                                            placeholder="Marka adı"
                                            className="h-10 w-full rounded-lg border border-border bg-white px-3 pr-10 text-sm outline-none focus:border-primary"
                                        />

                                        <button
                                            type="button"
                                            onClick={() =>
                                                setIsBrandDropdownOpen((current) => !current)
                                            }
                                            className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-text-secondary"
                                        >
                                            <ChevronDown className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {isBrandDropdownOpen && (
                                        <div className="absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-white py-1 shadow-lg">
                                            {filteredBrands.map((brand) => (
                                                <button
                                                    key={brand}
                                                    type="button"
                                                    onClick={() => {
                                                        setForm((current) => ({
                                                            ...current,
                                                            brand,
                                                        }));

                                                        setIsBrandDropdownOpen(false);
                                                    }}
                                                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-text-primary hover:bg-background-soft"
                                                >
                                                    <span>{brand}</span>

                                                    {form.brand === brand && (
                                                        <Check className="h-4 w-4 text-primary" />
                                                    )}
                                                </button>
                                            ))}

                                            {!filteredBrands.length && form.brand.trim() && (
                                                <div className="px-3 py-2 text-sm text-text-secondary">
                                                    {form.brand} mevcut markalar arasında bulunamadı.
                                                </div>
                                            )}

                                            {!filteredBrands.length && !form.brand.trim() && (
                                                <div className="px-3 py-2 text-sm text-text-secondary">
                                                    Henüz marka bulunmuyor.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-medium text-text-primary">
                                        SKU
                                    </label>

                                    <input
                                        value={form.sku}
                                        disabled
                                        placeholder="Ürün oluşturulduktan sonra otomatik oluşturulur."
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
                                            className="h-10 w-full rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
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
                                Açıklama
                            </h4>

                            <textarea
                                name="description"
                                value={form.description}
                                onChange={handleChange}
                                rows={5}
                                className="w-full resize-none rounded-lg border border-border px-3 py-2.5 text-sm outline-none focus:border-primary"
                            />
                        </section>

                        <section>
                            <h4 className="mb-4 text-sm font-semibold text-text-primary">
                                Ürün Görselleri
                            </h4>

                            <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                                className="block w-full cursor-pointer text-sm text-text-secondary file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-white file:transition-colors file:duration-150 hover:file:bg-primary-hover"
                            />

                            {images.length > 0 && (
                                <p className="mt-2 text-xs text-text-secondary">
                                    {images.length} görsel seçildi.
                                </p>
                            )}
                        </section>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={isSubmitting}
                            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-text-primary hover:border-primary hover:text-primary disabled:opacity-50"
                        >
                            İptal
                        </button>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex h-10 items-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSubmitting && (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            )}

                            Ürünü Oluştur
                        </button>
                    </div>
                </form>
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