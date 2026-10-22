"use client";

import Image from "next/image";
import { ImagePlus, LoaderCircle, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import RichTextEditor from "@/components/ui/RichTextEditor";
import { BLOG_IMAGE_TYPES, MAX_BLOG_IMAGE_BYTES, getBlogImageUrl, saveBlog } from "../services/blogService";

export default function BlogEditorModal({ blog, onClose, onSaved }) {
    const [title, setTitle] = useState(blog?.title ?? "");
    const [contentHtml, setContentHtml] = useState(blog?.contentHtml ?? "");
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const inputRef = useRef(null);
    const dialogRef = useRef(null);
    const savingRef = useRef(false);

    useEffect(() => {
        return () => { if (preview) URL.revokeObjectURL(preview); };
    }, [preview]);

    useEffect(() => {
        const previousFocus = document.activeElement;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialogRef.current?.querySelector("input")?.focus();
        function handleKey(event) {
            if (event.key === "Escape" && !savingRef.current) onClose();
            if (event.key !== "Tab") return;
            const controls = Array.from(dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), [contenteditable="true"], a[href]') ?? [])
                .filter((element) => element.getClientRects().length > 0);
            const first = controls[0], last = controls.at(-1);
            if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
            else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }
        document.addEventListener("keydown", handleKey);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener("keydown", handleKey);
            previousFocus?.focus();
        };
    }, [onClose]);

    function chooseImage(event) {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";
        if (!files.length) return;
        if (files.length !== 1) { setError("Yalnızca bir görsel seçebilirsiniz."); return; }
        const file = files[0];
        if (!BLOG_IMAGE_TYPES.includes(file.type) || file.size > MAX_BLOG_IMAGE_BYTES || file.size === 0) {
            setError("En fazla 5 MB boyutunda bir JPG, PNG veya WebP görseli seçin."); return;
        }
        setError("");
        setPreview(URL.createObjectURL(file));
        setImage(file);
    }

    async function submit(event) {
        event.preventDefault();
        if (savingRef.current) return;
        if (!image && !blog?.imageStorageKey) { setError("Bir blog görseli seçmelisiniz."); return; }
        if (!contentHtml.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim()) {
            setError("Blog metnini yazmalısınız."); return;
        }
        savingRef.current = true;
        setIsSaving(true); setError("");
        try {
            await saveBlog(blog?.blogId, { title, contentHtml, image });
            onSaved();
        } catch (failure) {
            setError(failure.message || "Blog kaydedilemedi.");
        } finally {
            savingRef.current = false;
            setIsSaving(false);
        }
    }

    const imageUrl = image ? preview : getBlogImageUrl(blog?.imageStorageKey);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-3 sm:p-6">
            <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="blog-editor-title" className="flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-7">
                    <h2 id="blog-editor-title" className="text-lg font-bold">{blog ? "Blogu Düzenle" : "Yeni Blog Ekle"}</h2>
                    <button type="button" onClick={onClose} disabled={isSaving} aria-label="Kapat" className="rounded-lg p-2 hover:bg-background-soft disabled:opacity-50"><X size={20} /></button>
                </div>
                <form onSubmit={submit} className="overflow-y-auto">
                    <fieldset disabled={isSaving} className="space-y-6 px-5 py-5 disabled:opacity-70 sm:px-7">
                        {error && <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                        <label className="block text-sm font-semibold">Başlık <span className="text-primary">*</span>
                            <input required minLength={3} maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 h-11 w-full rounded-lg border border-border px-3 font-normal outline-none focus:border-primary" placeholder="Blog başlığı" />
                        </label>
                        <div>
                            <p className="text-sm font-semibold">Kapak Görseli <span className="text-primary">*</span></p>
                            <div className="mt-2 flex flex-col gap-4 rounded-xl border border-dashed border-border bg-background-soft p-4 sm:flex-row sm:items-center">
                                <div className="relative flex h-32 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white sm:w-48">
                                    {imageUrl ? <Image src={imageUrl} alt="Blog kapak görseli önizlemesi" fill unoptimized className="object-contain" /> : <ImagePlus size={32} className="text-text-secondary" />}
                                </div>
                                <div className="space-y-2 text-sm">
                                    <button type="button" onClick={() => inputRef.current?.click()} className="rounded-lg border border-border bg-white px-4 py-2 font-semibold hover:border-primary hover:text-primary">{imageUrl ? "Görseli Değiştir" : "Görsel Seç"}</button>
                                    {image && <button type="button" onClick={() => { setImage(null); setPreview(null); }} className="ml-3 text-text-secondary underline">Seçimi kaldır</button>}
                                    <p className="text-xs leading-5 text-text-secondary">Tek görsel · JPG, PNG veya WebP · En fazla 5 MB</p>
                                    {image && <p className="max-w-xs break-all text-xs text-text-secondary">{image.name}</p>}
                                </div>
                                <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} className="hidden" aria-label="Blog kapak görseli" />
                            </div>
                        </div>
                        <div>
                            <p className="mb-2 text-sm font-semibold">Blog Metni <span className="text-primary">*</span></p>
                            <RichTextEditor value={contentHtml} onChange={setContentHtml} disabled={isSaving} />
                            <p className="mt-2 text-xs leading-5 text-text-secondary">Başlıkları, listeleri ve yazı biçimini araç çubuğundan düzenleyebilir; bağlantı simgesiyle link ekleyebilirsiniz.</p>
                        </div>
                    </fieldset>
                    <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-white px-5 py-4 sm:px-7">
                        <button type="button" onClick={onClose} disabled={isSaving} className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium disabled:opacity-50">Vazgeç</button>
                        <button disabled={isSaving} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">{isSaving && <LoaderCircle size={16} className="animate-spin" />}{isSaving ? "Kaydediliyor..." : blog ? "Değişiklikleri Kaydet" : "Blogu Yayınla"}</button>
                    </div>
                </form>
            </section>
        </div>
    );
}
