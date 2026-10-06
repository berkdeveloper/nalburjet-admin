"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

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
      }),
    );
  });

  return childrenMap;
}

export default function CategoryParentSelectorModal({
  categories,
  selectedCategoryId,
  onSelect,
  onClose,
}) {
  const [searchInput, setSearchInput] = useState("");

  const childrenMap = useMemo(
    () => buildCategoryTree(categories),
    [categories],
  );

  const [expandedIds, setExpandedIds] = useState(
    () =>
      new Set(
        categories
          .filter((category) =>
            categories.some(
              (item) =>
                item.parentCategoryId ===
                category.categoryId,
            ),
          )
          .map((category) => category.categoryId),
      ),
  );

  const normalizedSearch = searchInput
    .trim()
    .toLocaleLowerCase("tr-TR");

  const matchingIds = useMemo(() => {
    if (!normalizedSearch) {
      return null;
    }

    const result = new Set();

    categories.forEach((category) => {
      const matchesName = category.name
        ?.toLocaleLowerCase("tr-TR")
        .includes(normalizedSearch);

      if (!matchesName) {
        return;
      }

      result.add(category.categoryId);

      let currentParentId = category.parentCategoryId;

      while (currentParentId) {
        const parent = categories.find(
          (item) => item.categoryId === currentParentId,
        );

        if (!parent) {
          break;
        }

        result.add(parent.categoryId);
        currentParentId = parent.parentCategoryId;
      }
    });

    return result;
  }, [categories, normalizedSearch]);

  function toggleExpanded(categoryId) {
    setExpandedIds((current) => {
      const next = new Set(current);

      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }

      return next;
    });
  }

  function isVisible(category) {
    if (!matchingIds) {
      return true;
    }

    return matchingIds.has(category.categoryId);
  }

  function renderCategory(category, level = 0) {
    if (!isVisible(category)) {
      return null;
    }

    const children = childrenMap.get(category.categoryId) ?? [];
    const hasChildren = children.length > 0;
    const isExpanded =
      expandedIds.has(category.categoryId) ||
      Boolean(normalizedSearch);
    const isSelected =
      selectedCategoryId === category.categoryId;

    return (
      <div key={category.categoryId}>
        <div
          className="flex items-center gap-1"
          style={{
            paddingLeft: `${level * 24}px`,
          }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() =>
                toggleExpanded(category.categoryId)
              }
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-soft hover:text-text-primary"
              aria-label={
                isExpanded
                  ? `${category.name} kategorisini daralt`
                  : `${category.name} kategorisini genişlet`
              }
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="h-9 w-9 shrink-0" />
          )}

          <button
            type="button"
            onClick={() => onSelect(category)}
            className={`flex min-w-0 flex-1 items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              isSelected
                ? "bg-orange-50 text-primary"
                : "text-text-primary hover:bg-background-soft"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                isSelected
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white"
              }`}
            >
              {isSelected && (
                <Check className="h-3 w-3" />
              )}
            </span>

            <span className="min-w-0 flex-1 truncate font-medium">
              {category.name}
            </span>
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {children.map((child) =>
              renderCategory(child, level + 1),
            )}
          </div>
        )}
      </div>
    );
  }

  const rootCategories = childrenMap.get(null) ?? [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-text-primary">
              Üst Kategori Seç
            </h3>

            <p className="mt-0.5 text-xs text-text-secondary">
              Kategorinin hangi kategori altında yer alacağını seçin.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-text-secondary transition-colors hover:bg-background-soft hover:text-text-primary"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="shrink-0 border-b border-border px-6 py-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(event.target.value)
              }
              placeholder="Kategori ara..."
              autoFocus
              className="h-10 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary focus:border-primary"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <button
            type="button"
            onClick={() =>
              onSelect({
                categoryId: "",
                name: "Ana Kategori (Root)",
                parentCategoryId: null,
              })
            }
            className={`mb-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
              selectedCategoryId === ""
                ? "bg-orange-50 text-primary"
                : "text-text-primary hover:bg-background-soft"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                selectedCategoryId === ""
                  ? "border-primary bg-primary text-white"
                  : "border-border bg-white"
              }`}
            >
              {selectedCategoryId === "" && (
                <Check className="h-3 w-3" />
              )}
            </span>

            <span className="font-medium">
              Ana Kategori (Root)
            </span>
          </button>

          <div className="border-t border-border pt-3">
            {rootCategories.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm font-semibold text-text-primary">
                  Kategori bulunamadı.
                </p>

                <p className="mt-1 text-xs text-text-secondary">
                  Arama kriterlerinizi değiştirmeyi deneyin.
                </p>
              </div>
            ) : (
              rootCategories.map((category) =>
                renderCategory(category),
              )
            )}
          </div>
        </div>

        <div className="flex shrink-0 justify-end border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-text-primary transition-colors hover:bg-background-soft"
          >
            İptal
          </button>
        </div>
      </div>
    </div>
  );
}