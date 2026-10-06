/* eslint-disable react/no-unescaped-entities */
"use client";

import {
  Check,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import ProductCreateModal from "@/features/products/components/ProductCreateModal";
import ProductDeleteModal from "@/features/products/components/ProductDeleteModal";
import ProductEditModal from "@/features/products/components/ProductEditModal";
import ProductDeactivateModal from "@/features/products/components/ProductDeactivateModal";
import {
  activateProduct,
  deactivateProduct,
  deleteProduct,
  getProductBrands,
  getProducts,
} from "@/features/products/services/productService";
import {
  getProductCollections,
} from "@/features/productCollections/services/productCollectionService";
import { getProductImageUrl } from "@/lib/api/image";

const PAGE_SIZE = 15;
const BRAND_PAGE_SIZE = 100;
const COLLECTION_PAGE_SIZE = 100;

const STATUS_OPTIONS = [
  { value: "", label: "Tüm Durumlar" },
  { value: "true", label: "Aktif" },
  { value: "false", label: "Pasif" },
];

const COLLECTION_TYPES = {
  BEST_SELLER: "BestSeller",
  POPULAR: "Popular",
};

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
  const image =
    product?.images?.find((item) => item?.sortOrder === 0) ??
    product?.images?.[0];

  return image?.storageKey
    ? getProductImageUrl(image.storageKey)
    : null;
}

function getStockStatus(product) {
  const stockQuantity = Number(product?.stockQuantity ?? 0);

  if (stockQuantity <= 0) {
    return {
      label: "Stok Yok",
      className: "text-red-700",
    };
  }

  if (stockQuantity <= 5) {
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

function getCollectionForProduct(collections, productId) {
  return (
    collections.find((item) => item.productId === productId) ?? null
  );
}

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [bestSellerCollections, setBestSellerCollections] =
    useState([]);
  const [popularCollections, setPopularCollections] =
    useState([]);

  const [totalProductCount, setTotalProductCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState("");
  const [status, setStatus] = useState("");

  const [refreshKey, setRefreshKey] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] =
    useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [isDeactivateModalOpen, setIsDeactivateModalOpen] =
    useState(false);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formError, setFormError] = useState(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadProducts() {
      try {
        setIsLoading(true);
        setError(null);

        const [
          response,
          brandsResponse,
          bestSellerResponse,
          popularResponse,
        ] = await Promise.all([
          getProducts({
            params: {
              "PageRequest.PageIndex": currentPage - 1,
              "PageRequest.PageSize": PAGE_SIZE,
              SortBy: "Default",
              ...(search ? { Search: search } : {}),
              ...(brand ? { Brand: brand } : {}),
              ...(status !== ""
                ? { IsActive: status === "true" }
                : {}),
            },
          }),
          getProductBrands({
            params: {
              "PageRequest.PageIndex": 0,
              "PageRequest.PageSize": BRAND_PAGE_SIZE,
            },
          }),
          getProductCollections({
            params: {
              CollectionType:
                COLLECTION_TYPES.BEST_SELLER,
              "PageRequest.PageIndex": 0,
              "PageRequest.PageSize":
                COLLECTION_PAGE_SIZE,
            },
          }),
          getProductCollections({
            params: {
              CollectionType: COLLECTION_TYPES.POPULAR,
              "PageRequest.PageIndex": 0,
              "PageRequest.PageSize":
                COLLECTION_PAGE_SIZE,
            },
          }),
        ]);

        if (isCancelled) {
          return;
        }

        setProducts(response?.items ?? []);
        setTotalProductCount(response?.count ?? 0);
        setTotalPages(Math.max(response?.pages ?? 1, 1));

        setBrands(brandsResponse?.items ?? []);

        setBestSellerCollections(
          bestSellerResponse?.items ?? [],
        );

        setPopularCollections(
          popularResponse?.items ?? [],
        );
      } catch (error) {
        if (isCancelled) {
          return;
        }

        console.error("Ürünler yüklenemedi:", error);
        setError(error);
        setProducts([]);
        setTotalProductCount(0);
        setTotalPages(1);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      isCancelled = true;
    };
  }, [currentPage, search, brand, status, refreshKey]);

  function handleSearchSubmit(event) {
    event.preventDefault();

    setCurrentPage(1);
    setSearch(searchInput.trim());
  }

  function handleBrandChange(event) {
    setCurrentPage(1);
    setBrand(event.target.value);
  }

  function handleStatusChange(event) {
    setCurrentPage(1);
    setStatus(event.target.value);
  }

  function handleClearFilters() {
    setSearchInput("");
    setSearch("");
    setBrand("");
    setStatus("");
    setCurrentPage(1);
  }

  function handleOpenEditModal(product) {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  }

  function handleCloseEditModal() {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
  }

  function handleOpenDeleteModal(product) {
    setSelectedProduct(product);
    setFormError(null);
    setIsDeleteModalOpen(true);
  }

  function handleCloseDeleteModal() {
    if (isDeleting) {
      return;
    }

    setIsDeleteModalOpen(false);
    setSelectedProduct(null);
    setFormError(null);
  }

  function refreshProducts() {
    setRefreshKey((current) => current + 1);
  }

  function handleProductCreated() {
    setIsCreateModalOpen(false);
    setCurrentPage(1);
    refreshProducts();
  }

  function handleProductUpdated() {
    setIsEditModalOpen(false);
    setSelectedProduct(null);
    refreshProducts();
  }

  async function handleDeleteProduct() {
    if (!selectedProduct) {
      return;
    }

    try {
      setIsDeleting(true);
      setFormError(null);

      await deleteProduct(selectedProduct.productId);

      setIsDeleteModalOpen(false);
      setSelectedProduct(null);

      refreshProducts();
    } catch (error) {
      console.error("Ürün silinemedi:", error);
      setFormError(error);
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleActivateProduct(product) {
    try {
      setIsSubmitting(true);
      setFormError(null);

      await activateProduct(product.productId);

      refreshProducts();
    } catch (error) {
      console.error("Ürün aktifleştirilemedi:", error);
      setFormError(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleOpenDeactivateModal(product) {
    setSelectedProduct(product);
    setFormError(null);
    setIsDeactivateModalOpen(true);
  }

  function handleCloseDeactivateModal() {
    if (isSubmitting) {
      return;
    }

    setIsDeactivateModalOpen(false);
    setSelectedProduct(null);
    setFormError(null);
  }


  async function handleDeactivateProduct() {
    if (!selectedProduct) {
      return;
    }

    try {
      setIsSubmitting(true);
      setFormError(null);

      await deactivateProduct(selectedProduct.productId);

      setIsDeactivateModalOpen(false);
      setSelectedProduct(null);

      refreshProducts();
    } catch (error) {
      console.error("Ürün pasifleştirilemedi:", error);
      setFormError(error);
    } finally {
      setIsSubmitting(false);
    }
  }


  const hasFilters = Boolean(search || brand || status);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">
            Ürünler
          </h2>

          <p className="mt-1 text-sm text-text-secondary">
            Mağazanızdaki ürünleri buradan görüntüleyebilir ve
            yönetebilirsiniz.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
        >
          + Yeni Ürün
        </button>
      </div>

      <div className="mb-5 rounded-xl border border-border bg-white p-4">
        <form
          onSubmit={handleSearchSubmit}
          className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]"
        >
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Ürün adı, SKU veya marka ara..."
              className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-primary"
            />
          </div>

          <select
            value={brand}
            onChange={handleBrandChange}
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none focus:border-primary"
          >
            <option value="">Tüm Markalar</option>

            {brands.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={handleStatusChange}
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white hover:bg-primary-hover"
          >
            <Search className="h-4 w-4" />
            Ara
          </button>
        </form>

        {hasFilters && (
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <p className="text-xs text-text-secondary">
              Filtreler uygulanıyor.
            </p>

            <button
              type="button"
              onClick={handleClearFilters}
              className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-primary"
            >
              <X className="h-3.5 w-3.5" />
              Filtreleri Temizle
            </button>
          </div>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-text-primary">
              Ürün Listesi
            </p>

            <p className="mt-0.5 text-xs text-text-secondary">
              {isLoading
                ? "Ürünler yükleniyor..."
                : `${totalProductCount.toLocaleString(
                  "tr-TR",
                )} ürün`}
            </p>
          </div>
        </div>

        {error && (
          <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error.message ||
              "Ürünler yüklenirken bir hata oluştu."}
          </div>
        )}

        {isLoading ? (
          <div className="flex min-h-80 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <LoaderCircle className="h-5 w-5 animate-spin" />
              Ürünler yükleniyor...
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="flex min-h-80 items-center justify-center px-5">
            <div className="text-center">
              <p className="text-sm font-semibold text-text-primary">
                Ürün bulunamadı.
              </p>

              <p className="mt-1 text-xs text-text-secondary">
                Arama veya filtre kriterlerinizi değiştirmeyi
                deneyin.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px]">
                <thead>
                  <tr className="border-b border-border bg-background-soft">
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
                      KDV
                    </th>

                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      KDV'siz Fiyat
                    </th>

                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Satış Fiyatı
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Stok
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Özellikler
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Koleksiyonlar
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      Durum
                    </th>

                    <th className="w-32 px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                      İşlemler
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => {
                    const imageUrl = getProductImage(product);
                    const stockStatus = getStockStatus(product);
                    const statusBadge = getStatusBadge(
                      product?.isActive,
                    );

                    const hasDiscount =
                      product?.discountPriceIncludingTax !==
                      null &&
                      product?.discountPriceIncludingTax !==
                      undefined;

                    const bestSeller =
                      getCollectionForProduct(
                        bestSellerCollections,
                        product.productId,
                      );

                    const popular =
                      getCollectionForProduct(
                        popularCollections,
                        product.productId,
                      );

                    return (
                      <tr
                        key={product.productId}
                        className="border-b border-border last:border-b-0 hover:bg-background-soft/50"
                      >
                        <td className="px-5 py-4">
                          <div className="relative h-14 w-14 overflow-hidden rounded-lg border border-border bg-background-soft">
                            {imageUrl ? (
                              <Image
                                src={imageUrl}
                                alt={
                                  product?.name ||
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
                          <div className="max-w-[280px]">
                            <p className="truncate text-sm font-semibold text-text-primary">
                              {product?.name || "—"}
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
                            {product?.sku || "—"}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-medium text-text-primary">
                              %{product?.taxRate ?? 0}
                            </p>

                            <p className="mt-0.5 text-xs text-text-secondary">
                              {formatPrice(
                                (hasDiscount
                                  ? product.discountPriceIncludingTax
                                  : product.priceIncludingTax) -
                                (hasDiscount
                                  ? product.discountPriceIncludingTax
                                  : product.priceIncludingTax) /
                                (1 + Number(product?.taxRate ?? 0) / 100),
                              )}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-text-primary">
                            {formatPrice(
                              hasDiscount
                                ? product.discountPriceIncludingTax /
                                (1 + Number(product?.taxRate ?? 0) / 100)
                                : product.priceIncludingTax /
                                (1 + Number(product?.taxRate ?? 0) / 100),
                            )}
                          </p>
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
                                product.priceIncludingTax,
                              )}
                            </p>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-text-primary">
                              {product?.stockQuantity ?? 0}
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
                          <div className="flex flex-wrap gap-1.5">
                            {product?.isWeeklyDeal && (
                              <span className="rounded-full bg-orange-100 px-2 py-1 text-[10px] font-medium text-orange-700">
                                Fırsat
                              </span>
                            )}

                            {product?.isHighlight && (
                              <span className="rounded-full bg-purple-100 px-2 py-1 text-[10px] font-medium text-purple-700">
                                Öne Çıkan
                              </span>
                            )}

                            {!product?.isWeeklyDeal &&
                              !product?.isHighlight && (
                                <span className="flex items-center justify-center px-7 py-1 text-xs text-text-secondary">
                                  —
                                </span>
                              )}
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1.5">
                            {bestSeller && (
                              <span className="rounded-full bg-orange-100 px-2 py-1 block text-xs font-medium text-text-primary text-center">
                                <span className="text-orange-600">
                                  Çok Satanlar
                                </span>{" "}
                                #{bestSeller.displayOrder}
                              </span>
                            )}

                            {popular && (
                              <span className="rounded-full bg-purple-100 px-2 py-1 block text-xs font-medium text-text-primary text-center">
                                <span className="text-purple-600">
                                  Popüler
                                </span>{" "}
                                #{popular.displayOrder}
                              </span>
                            )}

                            {!bestSeller && !popular && (
                              <span className="flex items-center justify-center px-5 py-1 text-xs text-text-secondary">
                                —
                              </span>
                            )}
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
                          <div className="flex flex-col items-stretch gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(product)}
                              className="flex h-6.5 w-28 items-center justify-center rounded-lg border border-border px-3 text-xs font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
                            >
                              Düzenle
                            </button>

                            {product.isActive ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleOpenDeactivateModal(product)}
                                  disabled={isSubmitting || isDeleting}
                                  className="flex h-6.5 w-28 items-center justify-center gap-1.5 rounded-lg border border-orange-200 px-2.5 text-xs font-medium text-orange-600 transition-colors hover:border-orange-500 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Pasifleştir"
                                  aria-label={`${product.name} ürününü pasifleştir`}
                                >
                                  <X className="h-3.5 w-3.5" />
                                  Pasifleştir
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteModal(product)}
                                  disabled={isSubmitting || isDeleting}
                                  className="flex h-6.5 w-28 items-center justify-center gap-1.5 rounded-lg border border-red-200 px-2.5 text-xs font-medium text-red-600 transition-colors hover:border-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Kalıcı Sil"
                                  aria-label={`${product.name} ürününü kalıcı olarak sil`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Kalıcı Sil
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleActivateProduct(product)}
                                disabled={isSubmitting || isDeleting}
                                className="flex h-8 w-28 items-center justify-center gap-1.5 rounded-lg border border-green-200 px-2.5 text-xs font-medium text-green-600 transition-colors hover:border-green-400 hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                                title="Aktifleştir"
                                aria-label={`${product.name} ürününü aktifleştir`}
                              >
                                <Check className="h-3.5 w-3.5" />
                                Aktifleştir
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-text-secondary">
                Sayfa {currentPage} / {totalPages}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((current) =>
                      Math.max(current - 1, 1),
                    )
                  }
                  disabled={currentPage <= 1 || isLoading}
                  className="flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-text-primary hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Önceki
                </button>

                <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-white">
                  {currentPage}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage((current) =>
                      Math.min(
                        current + 1,
                        totalPages,
                      ),
                    )
                  }
                  disabled={
                    currentPage >= totalPages || isLoading
                  }
                  className="flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-xs font-medium text-text-primary hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sonraki
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <ProductCreateModal
        isOpen={isCreateModalOpen}
        brands={brands}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={handleProductCreated}
      />

      <ProductEditModal
        isOpen={isEditModalOpen}
        product={selectedProduct}
        brands={brands}
        onClose={handleCloseEditModal}
        onUpdated={handleProductUpdated}
      />

      {isDeactivateModalOpen && selectedProduct && (
        <ProductDeactivateModal
          isOpen={isDeactivateModalOpen}
          product={selectedProduct}
          isDeactivating={isSubmitting}
          error={formError}
          onClose={handleCloseDeactivateModal}
          onConfirm={handleDeactivateProduct}
        />
      )}

      <ProductDeleteModal
        isOpen={isDeleteModalOpen}
        product={selectedProduct}
        isDeleting={isDeleting}
        error={formError}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteProduct}
      />
    </div>
  );
}