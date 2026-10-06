import { adminApi, api } from "@/lib/api/client";

export async function getDashboardData() {
    const [
        ordersResponse,
        usersResponse,
        productsResponse,
        categoriesResponse,
        cartsResponse,
        newsletterResponse,
        shippingMethodsResponse,
        productCollectionsResponse,
        orderAnalyticsResponse,
    ] = await Promise.all([
        adminApi.get("/Orders", {
            params: {
                "PageRequest.PageIndex": 0,
                "PageRequest.PageSize": 1,
            },
        }),
        adminApi.get("/Users", {
            params: {
                "PageRequest.PageIndex": 0,
                "PageRequest.PageSize": 1,
            },
        }),
        api.get("/Products", {
            params: {
                "PageRequest.PageIndex": 0,
                "PageRequest.PageSize": 1,
                IsActive: true,
            },
        }),
        adminApi.get("/Categories", {
            params: {
                "PageRequest.PageIndex": 0,
                "PageRequest.PageSize": 1,
            },
        }),
        adminApi.get("/Carts", {
            params: {
                "PageRequest.PageIndex": 0,
                "PageRequest.PageSize": 1,
            },
        }),
        adminApi.get("/newsletter-subscribers", {
            params: {
                "PageRequest.PageIndex": 0,
                "PageRequest.PageSize": 1,
                IsActive: true,
            },
        }),
        adminApi.get("/ShippingMethods", {
            params: {
                "PageRequest.PageIndex": 0,
                "PageRequest.PageSize": 1,
                IsActive: true,
            },
        }),
        adminApi.get("/ProductCollections", {
            params: {
                "PageRequest.PageIndex": 0,
                "PageRequest.PageSize": 1,
            },
        }),
        adminApi.get("/Orders/dashboard-analytics"),
    ]);

    return {
        orders: ordersResponse.count ?? 0,
        users: usersResponse.count ?? 0,
        activeProducts: productsResponse.count ?? 0,
        categories: categoriesResponse.count ?? 0,
        carts: cartsResponse.count ?? 0,
        activeNewsletterSubscribers: newsletterResponse.count ?? 0,
        activeShippingMethods: shippingMethodsResponse.count ?? 0,
        productCollections: productCollectionsResponse.count ?? 0,
        last30DaysOrderCount:
            orderAnalyticsResponse.data?.last30DaysOrderCount ?? 0,
        last30DaysRevenue:
            orderAnalyticsResponse.data?.last30DaysRevenue ?? 0,
    };
}