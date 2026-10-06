import { adminApi } from "@/lib/api/client";

export function getNewsletterSubscribers(options = {}) {
    return adminApi.get("/newsletter-subscribers", options);
}

export function getNewsletterSubscriberById(id, options = {}) {
    return adminApi.get(`/newsletter-subscribers/${id}`, options);
}