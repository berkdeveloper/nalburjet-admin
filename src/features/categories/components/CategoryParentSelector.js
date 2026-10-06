"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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

  function buildChildren(parentId) {
    return (childrenMap.get(parentId) ?? []).map((category) => ({
      ...category,
      children: buildChildren(category.categoryId),
    }));
  }

  return buildChildren(null);
}

function getDescendantIds(categories, categoryId) {
  const childrenMap = new Map();

  categories.forEach((category) => {
    const parentId = category.parentCategoryId ?? null;

    if (!childrenMap.has(parentId)) {
      childrenMap.set(parentId, []);
    }

    childrenMap.get(parentId).push(category.categoryId);
  });

  const descendantIds = new Set();

  function collect(parentId) {
    const children = childrenMap.get(parentId) ?? [];

    children.forEach((childId) => {
      descendantIds.add(childId);
      collect(childId);
    });
  }

  collect(categoryId);

  return descendantIds;
}

function getAncestorIds(categories, targetId) {
  const expandedIds = new Set();

  function findTarget(categoryList, ancestors) {
    for (const category of categoryList) {
      if (category.categoryId === targetId) {
        ancestors.forEach((ancestorId) => {
          expandedIds.add(ancestorId);
        });

        return true;
      }

      if (category.children.length > 0) {
        const found = findTarget(category.children, [
          ...ancestors,
          category.categoryId,
        ]);

        if (found) {
          return true;
        }
      }
    }

    return false;
  }

  if (targetId) {
    findTarget(categories, []);
  }

  return expandedIds;
}

function CategoryTreeItem({
  category,
  level,
  selectedCategoryId,
  expandedIds,
  onToggle,
  onSelect,
}) {
  const hasChildren = category.children.length > 0;
  const isExpanded = expandedIds.has(category.categoryId);
  const isSelected = selectedCategoryId === category.categoryId;

  return (
    <div>
      <div
        className={`flex items-center rounded-lg px-2 py-1.5 transition-colors ${
          isSelected
            ? "bg-orange-50 text-primary"
            : "text-text-primary hover:bg-background-soft"
        }`}
      >
        <div
          className="mr-1 flex shrink-0 items-center"
          style={{ paddingLeft: `${level * 20}px` }}
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => onToggle(category.categoryId)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-white hover:text-text-primary"
              aria-label={
                isExpanded
                  ? `${category.name} kategorisini kapat`
                  : `${category.name} kategorisini aç`
              }
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="h-7 w-7" />
          )}
        </div>

        <button
          type="button"
          onClick={() => onSelect(category.categoryId)}
          className="flex min-w-0 flex-1 items-center gap-2 py-1 text-left"
        >
          {hasChildren ? (
            isExpanded ? (
              <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <Folder className="h-4 w-4 shrink-0 text-text-secondary" />
            )
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-text-secondary" />
          )}

          <span
            className={`min-w-0 flex-1 truncate text-sm ${
              isSelected
                ? "font-semibold text-primary"
                : "font-medium text-text-primary"
            }`}
          >
            {category.name}
          </span>

          {isSelected && (
            <Check className="mr-1 h-4 w-4 shrink-0 text-primary" />
          )}
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {category.children.map((child) => (
            <CategoryTreeItem
              key={child.categoryId}
              category={child}
              level={level + 1}
              selectedCategoryId={selectedCategoryId}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryParentSelector({
  categories,
  value,
  onChange,
  disabled = false,
  excludeCategoryId = null,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const containerRef = useRef(null);

  const availableCategories = useMemo(() => {
    if (!excludeCategoryId) {
      return categories;
    }

    const descendantIds = getDescendantIds(
      categories,
      excludeCategoryId,
    );

    return categories.filter(
      (category) =>
        category.categoryId !== excludeCategoryId &&
        !descendantIds.has(category.categoryId),
    );
  }, [categories, excludeCategoryId]);

  const parentOptions = useMemo(
    () =>
      availableCategories.filter(
        (category) => Number(category.level) < 2,
      ),
    [availableCategories],
  );

  const categoryTree = useMemo(
    () => buildCategoryTree(parentOptions),
    [parentOptions],
  );

  const selectedCategory = useMemo(
    () =>
      availableCategories.find(
        (category) => category.categoryId === value,
      ) ?? null,
    [availableCategories, value],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleOutsideClick(event) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, [isOpen]);

  function handleOpen() {
    if (disabled) {
      return;
    }

    setExpandedIds(getAncestorIds(categoryTree, value));
    setIsOpen((current) => !current);
  }

  function handleToggle(categoryId) {
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

  function handleSelect(categoryId) {
    onChange({
      target: {
        name: "parentCategoryId",
        value: categoryId,
      },
    });

    setIsOpen(false);
  }

  function handleSelectRoot() {
    onChange({
      target: {
        name: "parentCategoryId",
        value: "",
      },
    });

    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={`flex min-h-10 w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-left outline-none transition-colors ${
          isOpen
            ? "border-primary"
            : "border-border hover:border-gray-300"
        } disabled:cursor-not-allowed disabled:bg-background-soft`}
      >
        <div className="flex min-w-0 items-center gap-2">
          {selectedCategory ? (
            <>
              <Folder className="h-4 w-4 shrink-0 text-primary" />

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-text-primary">
                  {selectedCategory.name}
                </p>

                <p className="text-[11px] text-text-secondary">
                  {selectedCategory.level === 0
                    ? "Ana kategori"
                    : "Üst kategori"}
                </p>
              </div>
            </>
          ) : (
            <>
              <FolderOpen className="h-4 w-4 shrink-0 text-text-secondary" />

              <div>
                <p className="text-sm font-medium text-text-primary">
                  Ana Kategori
                </p>

                <p className="text-[11px] text-text-secondary">
                  Root seviyesinde oluştur
                </p>
              </div>
            </>
          )}
        </div>

        {isOpen ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-text-secondary" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary" />
        )}
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-border bg-white shadow-xl">
          <div className="border-b border-border bg-background-soft px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Üst Kategori Seç
            </p>

            <p className="mt-1 text-xs text-text-secondary">
              Kategoriyi mağaza hiyerarşisindeki konumuna göre seçin.
            </p>
          </div>

          <div className="max-h-72 overflow-y-auto p-2">
            <button
              type="button"
              onClick={handleSelectRoot}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left transition-colors ${
                !value
                  ? "bg-orange-50 text-primary"
                  : "text-text-primary hover:bg-background-soft"
              }`}
            >
              <FolderOpen className="h-4 w-4 shrink-0" />

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  Ana Kategori
                </p>

                <p className="mt-0.5 text-[11px] text-text-secondary">
                  Root seviyesinde
                </p>
              </div>

              {!value && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </button>

            {categoryTree.length > 0 && (
              <div className="border-t border-border pt-1">
                {categoryTree.map((category) => (
                  <CategoryTreeItem
                    key={category.categoryId}
                    category={category}
                    level={0}
                    selectedCategoryId={value}
                    expandedIds={expandedIds}
                    onToggle={handleToggle}
                    onSelect={handleSelect}
                  />
                ))}
              </div>
            )}

            {categoryTree.length === 0 && (
              <div className="px-3 py-5 text-center">
                <p className="text-sm font-medium text-text-primary">
                  Uygun üst kategori bulunamadı.
                </p>

                <p className="mt-1 text-xs text-text-secondary">
                  Bu kategori Root seviyesinde oluşturulabilir.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}