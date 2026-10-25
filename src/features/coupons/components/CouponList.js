"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { PauseCircle, Pencil, PlayCircle, Plus, Search, TicketPercent, Trash2, X } from "lucide-react";
import { adminApi, api } from "@/lib/api/client";

const fresh = () => ({ code: "", discountType: "Amount", value: "", isActive: true, usageLimit: "", assignedUserId: "", productIds: [], categoryIds: [] });
const money = n => Number(n).toLocaleString("tr-TR", { style: "currency", currency: "TRY" });
const input = "w-full rounded-lg border border-border bg-white px-3 py-2.5 text-sm outline-none focus:border-primary";
const actionButton = "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-40";

function RecordPicker({ type, ids, onChange, disabled }) {
    const [search, setSearch] = useState("");
    const [results, setResults] = useState([]);
    const [known, setKnown] = useState({});
    const [page, setPage] = useState(0);
    const [error, setError] = useState("");
    const product = type === "Products";
    useEffect(() => {
        const abort = new AbortController();
        const timer = setTimeout(() => {
            api.get(`/${type}`, { params: { Search: search, "PageRequest.PageIndex": page, "PageRequest.PageSize": 20 }, signal: abort.signal }).then(r => {
                const rows = r.items ?? [];
                setResults(rows);
                setKnown(old => ({ ...old, ...Object.fromEntries(rows.map(x => [product ? x.productId : x.categoryId, x.name])) }));
                setError("");
            }).catch(e => { if (!abort.signal.aborted) setError(e.message); });
        }, 250);
        return () => { clearTimeout(timer); abort.abort(); };
    }, [search, page, product, type]);
    return <fieldset disabled={disabled} className="space-y-2 rounded-lg border border-border p-3">
        <legend className="px-1 text-sm font-semibold">{product ? "Geçerli ürünler" : "Geçerli kategoriler"}</legend>
        <p className="text-xs text-text-secondary">{product ? "Ürünleri arayıp ekleyin." : "Seçilen kategorilerin alt kategorileri de kapsanır."}</p>
        <input aria-label={product ? "Kupona ürün ara" : "Kupona kategori ara"} className={input} placeholder="Adıyla ara…" value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} />
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
        <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">{ids.map(id => <button key={id} type="button" className="rounded bg-orange-50 px-2 py-1 text-xs text-primary" title={id} onClick={() => onChange(ids.filter(x => x !== id))}>{known[id] ?? id} ×</button>)}</div>
        <div className="max-h-36 space-y-1 overflow-y-auto">{results.map(row => {
            const id = product ? row.productId : row.categoryId;
            return <label key={id} className="flex cursor-pointer items-start gap-2 text-xs"><input type="checkbox" checked={ids.includes(id)} onChange={e => onChange(e.target.checked ? [...ids, id] : ids.filter(x => x !== id))} /><span>{row.name}</span></label>;
        })}</div>
        <div className="flex justify-between text-xs"><button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>Önceki</button><span>Sayfa {page + 1}</span><button type="button" disabled={results.length < 20} onClick={() => setPage(p => p + 1)}>Sonraki</button></div>
    </fieldset>;
}

function CouponEditor({ coupon, onClose, onSaved }) {
    const [form, setForm] = useState(() => coupon ? { ...coupon, value: String(coupon.value), usageLimit: coupon.usageLimit ?? "", assignedUserId: coupon.assignedUserId ?? "" } : fresh());
    const [scope, setScope] = useState(() => coupon?.productIds?.length || coupon?.categoryIds?.length ? "selected" : "all");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);
    const lock = useRef(false);
    const closeRef = useRef(null);
    useEffect(() => { closeRef.current?.focus(); }, []);
    const change = (key, value) => setForm(f => ({ ...f, [key]: value }));
    async function save(e) {
        e.preventDefault(); if (lock.current) return;
        if (scope === "selected" && !form.productIds.length && !form.categoryIds.length) { setError("En az bir ürün veya kategori seçin."); return; }
        lock.current = true; setBusy(true); setError("");
        try {
            const body = { code: form.code, discountType: form.discountType, value: Number(form.value), isActive: form.isActive,
                usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit), assignedUserId: form.assignedUserId.trim() || null,
                productIds: scope === "all" ? [] : form.productIds, categoryIds: scope === "all" ? [] : form.categoryIds,
                version: coupon?.version ?? null };
            if (coupon) await adminApi.put(`/Coupons/${coupon.id}`, body); else await adminApi.post("/Coupons", body);
            await onSaved(); onClose();
        } catch (e) { setError(e.message ?? "Kupon kaydedilemedi."); }
        finally { lock.current = false; setBusy(false); }
    }
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3" onKeyDown={e => { if (e.key === "Escape" && !busy) onClose(); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="coupon-title" className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <header className="flex items-center justify-between border-b border-border px-5 py-4"><h2 id="coupon-title" className="text-lg font-bold">{coupon ? "Kuponu düzenle" : "İndirim kuponu oluştur"}</h2><button ref={closeRef} type="button" disabled={busy} aria-label="Kapat" onClick={onClose}><X size={22} /></button></header>
            <form onSubmit={save} className="space-y-4 overflow-y-auto p-5">
                <p className="rounded-lg bg-orange-50 p-3 text-xs leading-5 text-text-secondary">Kupon için müşteri girişi gerekir. Her müşteri bir kullanım döneminde bir kez yararlanır. Pasiften aktife geçiş yeni dönem başlatır; dönem limiti ve kişi başına kullanım hakkı yenilenir. Devam eden ödemeler limitten yer ayırır.</p>
                <fieldset disabled={busy} className="space-y-4">
                    <label className="block text-sm">Kupon kodu<input className={input} required minLength={5} maxLength={32} pattern="[A-Z0-9]{5,32}" readOnly={!!coupon} value={form.code} onChange={e => change("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder="Ör. 1KASIM" /></label>
                    <div className="grid grid-cols-2 gap-3"><label className="text-sm">İndirim türü<select className={input} value={form.discountType} onChange={e => change("discountType", e.target.value)}><option value="Amount">Tutar (TL)</option><option value="Percent">Yüzde (%)</option></select></label><label className="text-sm">Değer<input type="number" step="0.01" min="0.01" max={form.discountType === "Percent" ? 100 : 10000000} required className={input} value={form.value} onChange={e => change("value", e.target.value)} /></label></div>
                    <label className="block text-sm">Dönem kullanım limiti <span className="text-xs text-text-secondary">(boşsa sınırsız)</span><input type="number" min="1" step="1" max="2147483647" className={input} value={form.usageLimit} onChange={e => change("usageLimit", e.target.value)} /></label>
                    <label className="block text-sm">Özel kullanıcı ID <span className="text-xs text-text-secondary">(boşsa tüm üyeler)</span><input className={input} value={form.assignedUserId} onChange={e => change("assignedUserId", e.target.value)} placeholder="Kullanıcı kaydındaki ID" /></label>
                    <label className="block text-sm">Geçerlilik<select className={input} value={scope} onChange={e => setScope(e.target.value)}><option value="all">Tüm ürünler</option><option value="selected">Seçili ürün ve/veya kategoriler</option></select></label>
                    {scope === "selected" && <><p className="text-xs text-text-secondary">Her iki alanda seçim varsa, ürünlerden veya kategorilerden birine uyan ürünlerde indirim uygulanır. Kargo bedeli indirime dahil değildir.</p><RecordPicker type="Products" ids={form.productIds} onChange={v => change("productIds", v)} disabled={busy} /><RecordPicker type="Categories" ids={form.categoryIds} onChange={v => change("categoryIds", v)} disabled={busy} /></>}
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.isActive} onChange={e => change("isActive", e.target.checked)} /> Kupon aktif</label>
                </fieldset>
                {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
                <div className="flex justify-end gap-3 border-t border-border pt-4"><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-border px-4 py-2">Vazgeç</button><button disabled={busy} className="rounded-lg bg-primary px-5 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Kaydediliyor…" : "Kaydet"}</button></div>
            </form>
        </section>
    </div>;
}

export default function CouponList() {
    const [rows, setRows] = useState([]), [search, setSearch] = useState(""), [page, setPage] = useState(0);
    const [editor, setEditor] = useState(null), [error, setError] = useState(""), [busy, setBusy] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const lock = useRef(false), version = useRef(0);
    const load = useCallback(async () => {
        const seq = ++version.current;
        try { const r = await adminApi.get("/Coupons", { params: { search, page } }); if (seq === version.current) { setRows(r.data ?? []); setError(""); } }
        catch (e) { if (seq === version.current) setError(e.message); }
    }, [search, page]);
    const invalidate = useCallback(() => { version.current += 1; }, []);
    useEffect(() => { const timer = setTimeout(load, 250); return () => { clearTimeout(timer); invalidate(); }; }, [load, invalidate]);
    async function act(c, remove = false) {
        if (lock.current) return; lock.current = true; setBusy(true); setError("");
        try {
            if (remove) await adminApi.del(`/Coupons/${c.id}`, { params: { version: c.version } });
            else await adminApi.put(`/Coupons/${c.id}`, { ...c, isActive: !c.isActive });
            setDeleting(null); await load();
        } catch (e) { setError(e.message); } finally { lock.current = false; setBusy(false); }
    }
    return <div className="space-y-5">
        <header className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-bold"><TicketPercent className="text-primary" /> İndirim Kuponları</h1><p className="mt-1 text-sm text-text-secondary">Tutar ve yüzde indirimlerini, kapsamı ve dönem kullanım haklarını yönetin.</p></div><button className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-white" onClick={() => setEditor({ coupon: null })}><Plus size={18} /> Kupon Ekle</button></header>
        <label className="flex max-w-sm items-center gap-2 rounded-lg border border-border bg-white px-3"><Search size={18} /><input aria-label="Kupon kodu ara" className="w-full py-3 text-sm outline-none" value={search} maxLength={32} placeholder="Kupon kodu ara" onChange={e => { setSearch(e.target.value); setPage(0); }} /></label>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {deleting && <div role="alert" className="flex flex-wrap items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm"><span><strong>{deleting.code}</strong> kalıcı silinsin mi? Eski siparişlerin indirim geçmişi korunur.</span><button disabled={busy} className="font-bold text-red-700" onClick={() => act(deleting, true)}>Kalıcı sil</button><button disabled={busy} onClick={() => setDeleting(null)}>Vazgeç</button></div>}
        <div className="overflow-x-auto rounded-xl border border-border bg-white"><table className="w-full text-left text-sm"><thead className="bg-background-soft text-xs text-text-secondary"><tr>{["Kod", "İndirim", "Kapsam", "Kullanım / rezervasyon", "Durum", "İşlem"].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead><tbody>{rows.map(c => <tr key={c.id} className="border-t border-border"><td className="px-4 py-4 font-semibold">{c.code}<small className="block font-normal text-text-secondary">Dönem {c.activation}</small></td><td className="whitespace-nowrap px-4">{c.discountType === "Percent" ? `%${c.value}` : money(c.value)}</td><td className="px-4 text-xs">{!c.productIds.length && !c.categoryIds.length ? "Tüm ürünler" : `${c.productIds.length} ürün / ${c.categoryIds.length} kategori`}{c.assignedUserId && <span className="block">Kullanıcıya özel</span>}</td><td className="px-4">{c.usedCount} kullanıldı · {c.reservedCount} bekliyor<small className="block text-text-secondary">Limit: {c.usageLimit ?? "Sınırsız"}</small></td><td className="px-4"><span className={`rounded-full px-2 py-1 text-xs ${c.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{c.isActive ? "Aktif" : "Pasif"}</span></td><td className="px-4"><div className="flex flex-wrap gap-2 whitespace-nowrap py-3">
            <button type="button" disabled={busy} className={`${actionButton} border-orange-200 bg-orange-50 text-primary hover:border-primary hover:bg-orange-100`} onClick={() => setEditor({ coupon: c })}><Pencil aria-hidden="true" size={14} />Düzenle</button>
            <button type="button" disabled={busy} className={`${actionButton} ${c.isActive ? "border-amber-200 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100" : "border-green-200 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100"}`} onClick={() => act(c)}>{c.isActive ? <PauseCircle aria-hidden="true" size={14} /> : <PlayCircle aria-hidden="true" size={14} />}{c.isActive ? "Pasife al" : "Aktife al"}</button>
            <button type="button" disabled={busy} className={`${actionButton} border-red-200 bg-red-50 text-red-600 hover:border-red-400 hover:bg-red-100`} onClick={() => setDeleting(c)}><Trash2 aria-hidden="true" size={14} />Sil</button>
        </div></td></tr>)}</tbody></table>{!rows.length && <p className="p-8 text-center text-sm text-text-secondary">Kupon bulunamadı.</p>}</div>
        <div className="flex items-center justify-between text-sm"><button disabled={page === 0} onClick={() => setPage(p => p - 1)}>Önceki</button><span>Sayfa {page + 1}</span><button disabled={rows.length < 30} onClick={() => setPage(p => p + 1)}>Sonraki</button></div>
        {editor && <CouponEditor coupon={editor.coupon} onClose={() => setEditor(null)} onSaved={load} />}
    </div>;
}
