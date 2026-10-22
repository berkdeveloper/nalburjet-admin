"use client";

import Image from "next/image";
import { BookOpen, ChevronLeft, ChevronRight, LoaderCircle, Pencil, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import StorefrontLink from "@/components/ui/StorefrontLink";
import BlogEditorModal from "./BlogEditorModal";
import { deleteBlog, getBlog, getBlogImageUrl, getBlogs } from "../services/blogService";

const PAGE_SIZE = 15;
const formatDate = (date) => new Date(date).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul" });

export default function BlogList() {
    const [result, setResult] = useState({ items: [], count: 0, pages: 0 });
    const [pageIndex, setPageIndex] = useState(0);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [version, setVersion] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState("");
    const [editor, setEditor] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteError, setDeleteError] = useState("");
    const closeEditor = useCallback(() => setEditor(null), []);

    useEffect(() => {
        const controller = new AbortController();
        let cancelled = false;
        async function load() {
            setIsLoading(true); setError("");
            try {
                const response = await getBlogs({ params: { pageIndex, pageSize: PAGE_SIZE, search }, signal: controller.signal });
                if (cancelled) return;
                const data = response.data;
                if (pageIndex > 0 && pageIndex >= Math.max(1, data.pages)) {
                    setPageIndex(Math.max(0, data.pages - 1)); return;
                }
                setResult(data);
            } catch (failure) { if (!cancelled) setError(failure.message || "Bloglar yüklenemedi."); }
            finally { if (!cancelled) setIsLoading(false); }
        }
        load();
        return () => { cancelled = true; controller.abort(); };
    }, [pageIndex, search, version]);

    async function edit(blog) {
        if (busyId) return;
        setBusyId(blog.blogId); setError("");
        try { setEditor({ blog: (await getBlog(blog.blogId)).data }); }
        catch (failure) { setError(failure.message || "Blog açılamadı."); }
        finally { setBusyId(null); }
    }

    async function remove() {
        if (!deleteTarget || busyId) return;
        setBusyId(deleteTarget.blogId); setDeleteError("");
        try { await deleteBlog(deleteTarget.blogId); setDeleteTarget(null); setVersion((current) => current + 1); }
        catch (failure) { setDeleteError(failure.message || "Blog silinemedi."); }
        finally { setBusyId(null); }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div><h1 className="text-2xl font-bold">Bloglar</h1><p className="mt-1 text-sm text-text-secondary">Blog yazılarını ve kapak görsellerini yönetin.</p></div>
                <button onClick={() => setEditor({ blog: null })} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover"><Plus size={18} />Blog Ekle</button>
            </div>
            <p className="rounded-xl border border-orange-100 bg-orange-50 px-4 py-3 text-sm leading-6 text-text-secondary">Eklenen bloglar ana sayfa slider’ında ve Blog sayfasında yayınlanır. Sitedeki sabit bloglar korunur; burada panelden eklenen yazılar yönetilir.</p>
            <div className="overflow-hidden rounded-xl border border-border bg-white">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5">
                    <div><h2 className="font-semibold">Blog Listesi</h2><p className="mt-1 text-xs text-text-secondary">{result.count} blog</p></div>
                    <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); setPageIndex(0); setSearch(searchInput.trim()); setVersion((current) => current + 1); }}>
                        <label className="relative"><Search size={16} className="absolute left-3 top-3 text-text-secondary" /><input aria-label="Blog başlığı ara" placeholder="Başlık ara..." value={searchInput} onChange={(event) => setSearchInput(event.target.value)} className="h-10 w-40 rounded-lg border border-border pl-9 pr-3 text-sm outline-none focus:border-primary sm:w-56" /></label>
                        <button className="rounded-lg border border-border px-3 text-sm hover:border-primary">Ara</button>
                        <button type="button" disabled={isLoading} onClick={() => setVersion((current) => current + 1)} aria-label="Blogları yenile" className="rounded-lg border border-border p-2.5 disabled:opacity-50"><RefreshCw size={17} className={isLoading ? "animate-spin" : ""} /></button>
                    </form>
                </div>
                {error && <p role="alert" className="m-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
                {isLoading ? <div className="flex justify-center p-16"><LoaderCircle className="animate-spin text-primary" /></div> : result.items.length === 0 ? (
                    <div className="py-16 text-center"><BookOpen size={32} className="mx-auto text-text-secondary" /><p className="mt-3 text-sm text-text-secondary">{search ? "Aramanıza uygun blog bulunamadı." : "Henüz blog eklenmedi."}</p></div>
                ) : <div className="divide-y divide-border">{result.items.map((blog) => (
                    <div key={blog.blogId} className="flex flex-wrap items-center gap-4 p-5">
                        <div className="relative h-16 w-24 shrink-0 overflow-hidden rounded-lg bg-background-soft"><Image src={getBlogImageUrl(blog.imageStorageKey)} alt={blog.title} fill unoptimized sizes="96px" className="object-cover" /></div>
                        <div className="min-w-0 flex-1"><StorefrontLink href={`https://nalburjet.com/blog/${blog.slug}`} className="font-semibold">{blog.title}</StorefrontLink><p className="mt-1 line-clamp-1 text-xs text-text-secondary">{blog.summary}</p><p className="mt-2 text-xs text-text-secondary">{formatDate(blog.createdDate)}{blog.updatedDate ? ` · Güncellendi: ${formatDate(blog.updatedDate)}` : ""}</p></div>
                        <div className="ml-auto flex gap-2"><button onClick={() => edit(blog)} disabled={!!busyId} aria-label={`${blog.title} blogunu düzenle`} className="rounded-lg border border-border p-2.5 text-text-secondary hover:border-primary hover:text-primary disabled:opacity-50">{busyId === blog.blogId ? <LoaderCircle size={17} className="animate-spin" /> : <Pencil size={17} />}</button><button onClick={() => { setDeleteError(""); setDeleteTarget(blog); }} disabled={!!busyId} aria-label={`${blog.title} blogunu kalıcı sil`} className="rounded-lg border border-red-100 p-2.5 text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 size={17} /></button></div>
                    </div>
                ))}</div>}
                <div className="flex items-center justify-between border-t border-border px-5 py-4 text-sm">
                    <p className="text-text-secondary">Sayfa {Math.min(pageIndex + 1, Math.max(1, result.pages))} / {Math.max(1, result.pages)}</p>
                    <div className="flex gap-2"><button aria-label="Önceki sayfa" disabled={isLoading || pageIndex === 0} onClick={() => setPageIndex((current) => current - 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><ChevronLeft size={18} /></button><button aria-label="Sonraki sayfa" disabled={isLoading || pageIndex + 1 >= result.pages} onClick={() => setPageIndex((current) => current + 1)} className="rounded-lg border border-border p-2 disabled:opacity-40"><ChevronRight size={18} /></button></div>
                </div>
            </div>
            {editor && <BlogEditorModal blog={editor.blog} onClose={closeEditor} onSaved={() => { setEditor(null); setPageIndex(0); setVersion((current) => current + 1); }} />}
            {deleteTarget && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="delete-blog-title" aria-describedby="delete-blog-description" className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"><h2 id="delete-blog-title" className="text-lg font-bold">Blogu Kalıcı Sil</h2><p id="delete-blog-description" className="mt-3 text-sm leading-6 text-text-secondary"><strong className="text-text-primary">{deleteTarget.title}</strong> yazısı ve kapak görseli kalıcı olarak silinecek. Bu işlem geri alınamaz.</p>{deleteError && <p role="alert" className="mt-3 text-sm text-red-600">{deleteError}</p>}<div className="mt-6 flex justify-end gap-3"><button autoFocus disabled={!!busyId} onClick={() => setDeleteTarget(null)} className="rounded-lg border border-border px-4 py-2 text-sm">Vazgeç</button><button disabled={!!busyId} onClick={remove} className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busyId && <LoaderCircle size={15} className="animate-spin" />}{busyId ? "Siliniyor..." : "Kalıcı Sil"}</button></div></section></div>}
        </div>
    );
}
