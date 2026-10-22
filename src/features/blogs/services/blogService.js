import { adminApi } from "@/lib/api/client";
import { API_BASE_URL } from "@/lib/api/config";

export const BLOG_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_BLOG_IMAGE_BYTES = 5 * 1024 * 1024;

export function getBlogImageUrl(storageKey) {
    return storageKey ? `${API_BASE_URL.replace(/\/api\/?$/, "")}/uploads/${storageKey}` : null;
}

export function getBlogs(options = {}) {
    return adminApi.get("/Blogs", { ...options, cache: "no-store" });
}

export function getBlog(id, options = {}) {
    return adminApi.get(`/Blogs/${id}`, { ...options, cache: "no-store" });
}

export function saveBlog(blogId, { title, contentHtml, image }) {
    const form = new FormData();
    form.append("Title", title.trim());
    form.append("ContentHtml", contentHtml);
    if (image) form.append("Image", image);
    return blogId ? adminApi.putForm(`/Blogs/${blogId}`, form) : adminApi.postForm("/Blogs", form);
}

export function deleteBlog(blogId) {
    return adminApi.del(`/Blogs/${blogId}`);
}
