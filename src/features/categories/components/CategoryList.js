"use client";

import {
    Check,
    ChevronDown,
    ChevronRight,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
    activateCategory,
    createCategory,
    deactivateCategory,
    deleteCategory,
    getCategories,
    updateCategory,
} from "@/features/categories/services/categoryService";
import CategoryCreateModal from "@/features/categories/components/CategoryCreateModal";
import CategoryDeleteModal from "@/features/categories/components/CategoryDeleteModal";
import CategoryEditModal from "@/features/categories/components/CategoryEditModal";
import CategoryDeactivateModal from "@/features/categories/components/CategoryDeactivateModal";

const PAGE_SIZE = 100;

const STATUS_OPTIONS = [
    { value: "", label: "Tüm Durumlar" },
    { value: "true", label: "Aktif" },
    { value: "false", label: "Pasif" },
];

function buildCategoryTree(categories) {
    const childrenMap = new Map();

    categories.forEach((category) => {
        const parentId = category.parentCategoryId ?? null;

        if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, []);
        }

        childrenMap.get(parentId).push(category);
    });

    childrenMap.forEach((children) => {
        children.sort((a, b) =>
            a.name.localeCompare(b.name, "tr", {
                sensitivity: "base",
            })
        );
    });

    const result = [];

    function addChildren(parentId, level) {
        const children = childrenMap.get(parentId) ?? [];

        children.forEach((category) => {
            result.push({
                category,
                level,
            });

            addChildren(category.categoryId, level + 1);
        });
    }

    addChildren(null, 0);

    const listedIds = new Set(result.map((item) => item.category.categoryId));

    categories.forEach((category) => {
        if (!listedIds.has(category.categoryId)) {
            result.push({
                category,
                level: 0,
            });
        }
    });

    return result;
}

function getLevelBadge(level) {
    if (level === 0) {
        return {
            label: "Ana Kategori",
            className: "bg-blue-50 text-blue-700",
        };
    }

    if (level === 1) {
        return {
            label: "Orta Kategori",
            className: "bg-orange-50 text-orange-700",
        };
    }

    return {
        label: "En Alt Kategori",
        className: "bg-purple-50 text-purple-700",
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
            className: "bg-gray-200 text-gray-800",
        };
}

function getCategoryLevel(category, categoryMap) {
    let level = 0;
    let current = category;

    while (current?.parentCategoryId) {
        const parent = categoryMap.get(current.parentCategoryId);

        if (!parent) {
            break;
        }

        level += 1;
        current = parent;

        if (level >= 10) {
            break;
        }
    }

    return level;
}

export default function CategoryList() {
    const [categories, setCategories] = useState([]);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [selectedCategory, setSelectedCategory] = useState(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [formError, setFormError] = useState(null);

    const [form, setForm] = useState({
        name: "",
        description: "",
        parentCategoryId: "",
    });

    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);

    async function loadCategories() {
        try {
            setIsLoading(true);
            setError(null);

            const response = await getCategories({
                params: {
                    "PageRequest.PageIndex": 0,
                    "PageRequest.PageSize": PAGE_SIZE,
                },
            });

            setCategories(response?.items ?? []);
        } catch (error) {
            console.error("Kategoriler yüklenemedi:", error);
            setError(error);
            setCategories([]);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        let isCancelled = false;

        async function load() {
            try {
                setIsLoading(true);
                setError(null);

                const response = await getCategories({
                    params: {
                        "PageRequest.PageIndex": 0,
                        "PageRequest.PageSize": PAGE_SIZE,
                    },
                });

                if (!isCancelled) {
                    setCategories(response?.items ?? []);
                }
            } catch (error) {
                if (!isCancelled) {
                    console.error("Kategoriler yüklenemedi:", error);
                    setError(error);
                    setCategories([]);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        }

        load();

        return () => {
            isCancelled = true;
        };
    }, []);

    const filteredCategories = useMemo(() => {
        const normalizedSearch = search.trim().toLocaleLowerCase("tr-TR");

        return categories.filter((category) => {
            const matchesSearch =
                !normalizedSearch ||
                category?.name?.toLocaleLowerCase("tr-TR").includes(normalizedSearch);

            const matchesStatus =
                status === "" || String(category?.isActive) === status;

            return matchesSearch && matchesStatus;
        });
    }, [categories, search, status]);

    const categoryTree = useMemo(
        () => buildCategoryTree(filteredCategories),
        [filteredCategories]
    );

    const parentCategoryOptions = useMemo(() => {
        const categoryMap = new Map(
            categories.map((category) => [category.categoryId, category])
        );

        return [...categories]
            .sort((a, b) =>
                a.name.localeCompare(b.name, "tr", {
                    sensitivity: "base",
                })
            )
            .map((category) => ({
                ...category,
                level: getCategoryLevel(category, categoryMap),
            }));
    }, [categories]);

    function handleSearchSubmit(event) {
        event.preventDefault();
        setSearch(searchInput.trim());
    }

    function handleStatusChange(event) {
        setStatus(event.target.value);
    }

    function handleClearFilters() {
        setSearchInput("");
        setSearch("");
        setStatus("");
    }

    function handleOpenCreateModal() {
        setForm({
            name: "",
            description: "",
            parentCategoryId: "",
        });

        setFormError(null);
        setIsCreateModalOpen(true);
    }

    function handleCloseCreateModal() {
        if (isSubmitting) {
            return;
        }

        setIsCreateModalOpen(false);
        setFormError(null);
    }

    function handleOpenEditModal(category) {
        setSelectedCategory(category);

        setForm({
            name: category?.name ?? "",
            description: category?.description ?? "",
            parentCategoryId: category?.parentCategoryId ?? "",
        });

        setFormError(null);
        setIsEditModalOpen(true);
    }

    function handleCloseEditModal() {
        if (isSubmitting) {
            return;
        }

        setIsEditModalOpen(false);
        setSelectedCategory(null);
        setFormError(null);
    }

    function handleOpenDeleteModal(category) {
        setSelectedCategory(category);
        setFormError(null);
        setIsDeleteModalOpen(true);
    }

    function handleCloseDeleteModal() {
        if (isDeleting) {
            return;
        }

        setIsDeleteModalOpen(false);
        setSelectedCategory(null);
        setFormError(null);
    }

    function handleFormChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleCreateCategory(event) {
        event.preventDefault();

        const name = form.name.trim();
        const description = form.description.trim();

        if (!name) {
            setFormError(new Error("Kategori adı zorunludur."));
            return;
        }

        try {
            setIsSubmitting(true);
            setFormError(null);

            await createCategory({
                name,
                description,
                parentCategoryId: form.parentCategoryId || null,
            });

            setIsCreateModalOpen(false);

            setForm({
                name: "",
                description: "",
                parentCategoryId: "",
            });

            await loadCategories();
        } catch (error) {
            console.error("Kategori oluşturulamadı:", error);
            setFormError(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleUpdateCategory(event) {
        event.preventDefault();

        if (!selectedCategory) {
            return;
        }

        const name = form.name.trim();
        const description = form.description.trim();

        if (!name) {
            setFormError(new Error("Kategori adı zorunludur."));
            return;
        }

        try {
            setIsSubmitting(true);
            setFormError(null);

            await updateCategory({
                id: selectedCategory.categoryId,
                name,
                description,
                parentCategoryId: form.parentCategoryId || null,
            });

            setIsEditModalOpen(false);
            setSelectedCategory(null);

            await loadCategories();
        } catch (error) {
            console.error("Kategori güncellenemedi:", error);
            setFormError(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleDeleteCategory() {
        if (!selectedCategory) {
            return;
        }

        try {
            setIsDeleting(true);
            setFormError(null);

            await deleteCategory(selectedCategory.categoryId);

            setIsDeleteModalOpen(false);
            setSelectedCategory(null);

            await loadCategories();
        } catch (error) {
            console.error("Kategori silinemedi:", error);
            setFormError(error);
        } finally {
            setIsDeleting(false);
        }
    }

    async function handleActivateCategory(category) {
        try {
            setIsSubmitting(true);
            setFormError(null);

            await activateCategory(category.categoryId);

            await loadCategories();
        } catch (error) {
            console.error("Kategori aktifleştirilemedi:", error);
            setFormError(error);
        } finally {
            setIsSubmitting(false);
        }
    }

    function handleOpenDeactivateModal(category) {
        setSelectedCategory(category);
        setFormError(null);
        setIsDeactivateModalOpen(true);
    }

    function handleCloseDeactivateModal() {
        if (isDeactivating) {
            return;
        }

        setIsDeactivateModalOpen(false);
        setSelectedCategory(null);
        setFormError(null);
    }

    async function handleDeactivateCategory() {
        if (!selectedCategory) {
            return;
        }

        try {
            setIsDeactivating(true);
            setFormError(null);

            await deactivateCategory(selectedCategory.categoryId);

            setIsDeactivateModalOpen(false);
            setSelectedCategory(null);

            await loadCategories();
        } catch (error) {
            console.error("Kategori pasifleştirilemedi:", error);
            setFormError(error);
        } finally {
            setIsDeactivating(false);
        }
    }

    const hasFilters = Boolean(search || status);

    return (
        <div>
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary">Kategoriler</h2>

                    <p className="mt-1 text-sm text-text-secondary">
                        Mağazanızdaki kategori yapısını buradan yönetebilirsiniz.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                >
                    <Plus className="h-4 w-4" />
                    Yeni Kategori
                </button>
            </div>

            <div className="mb-5 rounded-xl border border-border bg-white p-4">
                <form
                    onSubmit={handleSearchSubmit}
                    className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_200px_auto]"
                >
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />

                        <input
                            type="text"
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            placeholder="Kategori ara..."
                            className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
                        />
                    </div>

                    <select
                        value={status}
                        onChange={handleStatusChange}
                        className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none transition-colors focus:border-primary"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <button
                        type="submit"
                        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
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
                            className="flex items-center gap-1.5 text-xs font-medium text-text-secondary transition-colors hover:text-primary"
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
                            Kategori Listesi
                        </p>

                        <p className="mt-0.5 text-xs text-text-secondary">
                            {isLoading
                                ? "Kategoriler yükleniyor..."
                                : `${filteredCategories.length.toLocaleString(
                                    "tr-TR"
                                )} kategori`}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error.message || "Kategoriler yüklenirken bir hata oluştu."}
                    </div>
                )}

                {isLoading ? (
                    <div className="flex min-h-80 items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                            <LoaderCircle className="h-5 w-5 animate-spin" />
                            Kategoriler yükleniyor...
                        </div>
                    </div>
                ) : categoryTree.length === 0 ? (
                    <div className="flex min-h-80 items-center justify-center px-5">
                        <div className="text-center">
                            <p className="text-sm font-semibold text-text-primary">
                                Kategori bulunamadı.
                            </p>

                            <p className="mt-1 text-xs text-text-secondary">
                                Arama veya filtre kriterlerinizi değiştirmeyi deneyin.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                            <thead>
                                <tr className="border-b border-border bg-background-soft">
                                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Kategori
                                    </th>

                                    <th className="w-32 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Seviye
                                    </th>

                                    <th className="w-32 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Durum
                                    </th>

                                    <th className="w-48 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Slug
                                    </th>

                                    <th className="w-36 px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        İşlemler
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {categoryTree.map(({ category, level }) => {
                                    const statusBadge = getStatusBadge(category.isActive);

                                    return (
                                        <tr
                                            key={category.categoryId}
                                            className="border-b border-border transition-colors hover:bg-background-soft"
                                        >
                                            <td className="px-5 py-4">
                                                <div
                                                    className="flex items-center"
                                                    style={{
                                                        paddingLeft: `${level * 28}px`,
                                                    }}
                                                >
                                                    {level > 0 && (
                                                        <span className="mr-2 text-sm text-border">└</span>
                                                    )}

                                                    {level === 0 ? (
                                                        <ChevronDown className="mr-2 h-4 w-4 shrink-0 text-text-secondary" />
                                                    ) : (
                                                        <ChevronRight className="mr-2 h-4 w-4 shrink-0 text-text-secondary" />
                                                    )}

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-text-primary">
                                                            {category.name}
                                                        </p>

                                                        {category.description && (
                                                            <p className="mt-0.5 max-w-[500px] truncate text-xs text-text-secondary">
                                                                {category.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="px-3 py-4">
                                                {(() => {
                                                    const levelBadge = getLevelBadge(level);

                                                    return (
                                                        <span
                                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${levelBadge.className}`}
                                                        >
                                                            {levelBadge.label}
                                                        </span>
                                                    );
                                                })()}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusBadge.className}`}
                                                >
                                                    {statusBadge.label}
                                                </span>
                                            </td>

                                            <td className="px-2 py-4 min-w-56">
                                                <span className="text-sm text-text-secondary">
                                                    {category.slug || "—"}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleOpenEditModal(category)}
                                                        className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-text-primary transition-colors hover:border-primary hover:text-primary"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Düzenle
                                                    </button>

                                                    {category.isActive ? (
                                                        <>
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleOpenDeactivateModal(category)
                                                                }
                                                                disabled={isSubmitting}
                                                                className="flex h-8 gap-1.5 w-32 text-xs font-medium items-center justify-center rounded-lg border border-orange-200 px-2.5 text-orange-600 transition-colors hover:bg-orange-50 hover:border-orange-500 disabled:cursor-not-allowed disabled:opacity-50"
                                                                title="Pasifleştir"
                                                                aria-label={`${category.name} kategorisini pasifleştir`}
                                                            >
                                                                <X className="h-3.5 w-3.5" />
                                                                Pasifleştir
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenDeleteModal(category)}
                                                                disabled={isSubmitting}
                                                                className="flex h-8 gap-1.5 w-32 text-xs font-medium items-center justify-center rounded-lg border border-red-200 px-2.5 text-red-600 transition-colors hover:bg-red-50 hover:border-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                                title="Kalıcı Sil"
                                                                aria-label={`${category.name} kategorisini kalıcı olarak sil`}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Kalıcı Sil
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleActivateCategory(category)}
                                                            disabled={isSubmitting}
                                                            className="flex h-8 gap-1.5 w-32 text-xs font-medium items-center justify-center rounded-lg border border-green-200 px-2.5 text-green-600 transition-colors hover:bg-green-50 hover:border-green-400 disabled:cursor-not-allowed disabled:opacity-50"
                                                            title="Aktifleştir"
                                                            aria-label={`${category.name} kategorisini aktifleştir`}
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
                )}
            </div>

            {isDeactivateModalOpen && selectedCategory && (
                <CategoryDeactivateModal
                    category={selectedCategory}
                    isDeactivating={isDeactivating}
                    error={formError}
                    onClose={handleCloseDeactivateModal}
                    onConfirm={handleDeactivateCategory}
                />
            )}

            {isCreateModalOpen && (
                <CategoryCreateModal
                    categories={parentCategoryOptions}
                    form={form}
                    isSubmitting={isSubmitting}
                    error={formError}
                    onChange={handleFormChange}
                    onClose={handleCloseCreateModal}
                    onSubmit={handleCreateCategory}
                />
            )}

            {isEditModalOpen && selectedCategory && (
                <CategoryEditModal
                    categories={parentCategoryOptions}
                    category={selectedCategory}
                    form={form}
                    isSubmitting={isSubmitting}
                    error={formError}
                    onChange={handleFormChange}
                    onClose={handleCloseEditModal}
                    onSubmit={handleUpdateCategory}
                />
            )}

            {isDeleteModalOpen && selectedCategory && (
                <CategoryDeleteModal
                    category={selectedCategory}
                    isDeleting={isDeleting}
                    error={formError}
                    onClose={handleCloseDeleteModal}
                    onConfirm={handleDeleteCategory}
                />
            )}
        </div>
    );
}
