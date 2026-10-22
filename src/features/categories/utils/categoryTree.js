export function buildCategoryTree(categories) {
    const categoryIds = new Set(categories.map((category) => category.categoryId));
    const childrenMap = new Map();

    categories.forEach((category) => {
        const parentId = categoryIds.has(category.parentCategoryId) ? category.parentCategoryId : null;

        if (!childrenMap.has(parentId)) {
            childrenMap.set(parentId, []);
        }

        childrenMap.get(parentId).push(category);
    });

    childrenMap.forEach((children) => {
        children.sort((a, b) => a.name.localeCompare(b.name, "tr", { sensitivity: "base" }));
    });

    const result = [];
    const visited = new Set();

    function addCategory(category, ancestorIds) {
        if (visited.has(category.categoryId)) return;
        visited.add(category.categoryId);

        const children = childrenMap.get(category.categoryId) ?? [];
        result.push({ category, level: ancestorIds.length, ancestorIds, hasChildren: children.length > 0 });
        children.forEach((child) => addCategory(child, [...ancestorIds, category.categoryId]));
    }

    (childrenMap.get(null) ?? []).forEach((category) => addCategory(category, []));
    // Keep orphaned or malformed branches accessible without looping forever.
    categories.forEach((category) => addCategory(category, []));

    return result;
}

export function getVisibleCategoryTree(tree, collapsedIds) {
    return tree.filter(({ ancestorIds }) => !ancestorIds.some((id) => collapsedIds.has(id)));
}
