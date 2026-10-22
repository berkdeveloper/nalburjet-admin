export function getCartPagination(response, pageIndex, pageSize) {
    const count = Math.max(0, response.count ?? 0);
    const pages = Math.ceil(count / pageSize);

    return {
        count,
        pages,
        hasPrevious: pageIndex > 0,
        hasNext: pageIndex + 1 < pages,
    };
}
