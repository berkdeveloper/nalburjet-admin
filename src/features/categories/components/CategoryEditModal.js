"use client";

import { ChevronRight, LoaderCircle, X } from "lucide-react";
import { useMemo, useState } from "react";

import CategoryParentSelectorModal from "@/features/categories/components/CategoryParentSelectorModal";

function getDescendantIds(categoryId, categories) {
  const childrenMap = new Map();

  categories.forEach((category) => {
    const parentId = category.parentCategoryId ?? null;

    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }

    childrenMap.get(parentId).push(category);
  });

  const descendantIds = new Set();

  function collect(parentId) {
    const children = childrenMap.get(parentId) ?? [];

    children.forEach((child) => {
      descendantIds.add(child.categoryId);
      collect(child.categoryId);
    });
  }

  collect(categoryId);

  return descendantIds;
}

export default function CategoryEditModal({
  categories,
  form,
  category,
  isSubmitting,
  error,
  onChange,
  onClose,
  onSubmit,
}) {
  const [isParentSelectorOpen, setIsParentSelectorOpen] =
    useState(false);

  const excludedCategoryIds = useMemo(() => {
    if (!category?.categoryId) {
      return [];
    }

    const descendantIds = getDescendantIds(
      category.categoryId,
      categories,
    );

    descendantIds.add(category.categoryId);

    return [...descendantIds];
  }, [category, categories]);

  const selectableCategories = useMemo(() => {
    const excludedIds = new Set(excludedCategoryIds);

    return categories.filter(
      (item) => !excludedIds.has(item.categoryId),
    );
  }, [categories, excludedCategoryIds]);

  const selectedParent = categories.find(
    (item) =>
      item.categoryId === form.parentCategoryId,
  );

  function handleParentSelect(selectedCategory) {
    onChange({
      target: {
        name: "parentCategoryId",
        value: selectedCategory.categoryId,
      },
    });

    setIsParentSelectorOpen(false);
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-lg rounded-xl border border-border bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-text-primary">
                Kategoriyi Düzenle
              </h3>

              <p className="mt-0.5 text-xs text-text-secondary">
                {category?.name}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-soft hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={onSubmit}>
            <div className="space-y-5 px-6 py-5">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error.message ||
                    "Kategori güncellenirken bir hata oluştu."}
                </div>
              )}

              <div>
                <label
                  htmlFor="category-edit-name"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Kategori Adı
                </label>

                <input
                  id="category-edit-name"
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={onChange}
                  maxLength={200}
                  disabled={isSubmitting}
                  required
                  className="h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary disabled:cursor-not-allowed disabled:bg-background-soft"
                />
              </div>

              <div>
                <label
                  htmlFor="category-edit-description"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Açıklama
                </label>

                <textarea
                  id="category-edit-description"
                  name="description"
                  value={form.description}
                  onChange={onChange}
                  rows={4}
                  maxLength={1000}
                  disabled={isSubmitting}
                  className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary disabled:cursor-not-allowed disabled:bg-background-soft"
                />
              </div>

              <div>
                <label
                  htmlFor="category-edit-parent"
                  className="mb-1.5 block text-sm font-medium text-text-primary"
                >
                  Üst Kategori
                </label>

                <button
                  id="category-edit-parent"
                  type="button"
                  onClick={() =>
                    setIsParentSelectorOpen(true)
                  }
                  disabled={isSubmitting}
                  className="flex min-h-10 w-full items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-left text-sm text-text-primary outline-none transition-colors hover:border-primary disabled:cursor-not-allowed disabled:bg-background-soft"
                >
                  <span
                    className={
                      selectedParent
                        ? "truncate"
                        : "text-text-secondary"
                    }
                  >
                    {selectedParent?.name ||
                      "Ana Kategori (Root)"}
                  </span>

                  <ChevronRight className="ml-3 h-4 w-4 shrink-0 text-text-secondary" />
                </button>

                <p className="mt-1.5 text-xs text-text-secondary">
                  Mevcut kategori ve alt kategorileri üst kategori olarak seçilemez.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-text-primary transition-colors hover:bg-background-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                İptal
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !form.name.trim()}
                className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}

                {isSubmitting
                  ? "Kaydediliyor..."
                  : "Değişiklikleri Kaydet"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {isParentSelectorOpen && (
        <CategoryParentSelectorModal
          categories={selectableCategories}
          selectedCategoryId={form.parentCategoryId}
          onSelect={handleParentSelect}
          onClose={() => setIsParentSelectorOpen(false)}
        />
      )}
    </>
  );
}