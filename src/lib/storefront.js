const STOREFRONT_URL = "https://nalburjet.com";

export function getProductStorefrontUrl(product) {
    return product?.slug ? `${STOREFRONT_URL}/urun/${encodeURIComponent(product.slug)}` : null;
}

export function getCategoryStorefrontUrl(category, categoryMap) {
    const segments = [];
    const visited = new Set();
    let current = category;

    while (current) {
        if (!current.slug || visited.has(current.categoryId)) return null;
        visited.add(current.categoryId);
        segments.unshift(encodeURIComponent(current.slug));

        if (!current.parentCategoryId) {
            return `${STOREFRONT_URL}/kategori/${segments.join("/")}`;
        }

        current = categoryMap.get(current.parentCategoryId);
    }

    return null;
}
