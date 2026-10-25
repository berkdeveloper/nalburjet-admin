"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api/client";

export const emptyVariant = () => ({ groupId: null, groupName: "", options: {}, isNewGroup: false });

export default function ProductVariantEditor({ productId, value, onChange, disabled }) {
    const [groups, setGroups] = useState([]);
    const [search, setSearch] = useState("");
    const [error, setError] = useState("");
    const [loadedProduct, setLoadedProduct] = useState(null);
    const loading = !!productId && loadedProduct !== productId;
    const rows = value.rows ?? Object.entries(value.options ?? {});
    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(() => {
            adminApi.get("/ProductVariants/groups", { params: { search } }).then(r => {
                if (!cancelled) setGroups(r.data ?? []);
            }).catch(e => { if (!cancelled) setError(e.message); });
        }, 250);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [search]);
    useEffect(() => {
        if (!productId) return;
        let cancelled = false;
        adminApi.get(`/ProductVariants/${productId}`).then(r => {
            if (!cancelled) onChange({ groupId: r.data.groupId, groupName: r.data.groupName ?? "", options: r.data.options ?? {} });
        }).catch(e => { if (!cancelled) setError(e.message); })
            .finally(() => { if (!cancelled) setLoadedProduct(productId); });
        return () => { cancelled = true; };
    }, [productId, onChange]);

    function updateRow(index, key, text) {
        const next = rows.map(([k, v], i) => i === index ? (key === "name" ? [text, v] : [k, text]) : [k, v]);
        commitRows(next);
    }
    function commitRows(next) {
        const names = next.map(([k]) => k.trim().normalize("NFKC").toUpperCase());
        onChange({ ...value, rows: next, options: Object.fromEntries(next),
            validationError: new Set(names).size !== names.length ? "Seçenek başlıkları birbirinden farklı olmalıdır." : "" });
    }
    const input = "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm disabled:opacity-60";
    return <section className="space-y-3 rounded-xl border border-border bg-background-soft p-4">
        <h3 className="font-semibold">Ürün cinsi ve seçenekleri <span className="text-xs font-normal text-text-secondary">(isteğe bağlı)</span></h3>
        <p className="text-xs leading-5 text-text-secondary">Her renk/beden ayrı ürün olarak listelenir. Aynı gruptaki ürünler mağazada birbirine bağlanır. Tüm üyelerde aynı başlıkları, her üyede farklı bir birleşim kullanın.</p>
        {loading && <p role="status" className="text-sm">Seçenekler yükleniyor…</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error} Seçenekleri yüklemeden ürünü kaydetmeyin.</p>}
        {value.validationError && <p role="alert" className="text-sm text-red-600">{value.validationError}</p>}
        <fieldset disabled={disabled || loading || !!error} className="space-y-3">
            <label className="block text-sm">Grup ara<input className={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Ör. iş ayakkabısı, iç cephe boya" maxLength={150} /></label>
            <label className="block text-sm">Seçenek grubu<select className={input} value={value.groupId ?? (value.isNewGroup || value.groupName ? "new" : "")} onChange={e => {
                const id = e.target.value;
                onChange(id === "" ? emptyVariant() : id === "new" ? { ...emptyVariant(), isNewGroup: true }
                    : { ...value, groupId: id, groupName: groups.find(g => g.id === id)?.name ?? "" });
            }}>
                <option value="">Seçenek grubu yok</option><option value="new">+ Yeni grup oluştur</option>
                {value.groupId && !groups.some(g => g.id === value.groupId) && <option value={value.groupId}>{value.groupName}</option>}
                {groups.map(g => <option key={g.id} value={g.id}>{g.name} ({g.productCount} ürün)</option>)}
            </select></label>
            {!value.groupId && (value.isNewGroup || value.groupName) && <label className="block text-sm">Yeni grubun adı<input className={input} value={value.groupName} maxLength={150} required onChange={e => onChange({ ...value, groupName: e.target.value })} /></label>}
            {(value.groupId || value.isNewGroup || value.groupName) && <>
                {rows.map(([name, text], i) => <div className="flex gap-2" key={i}>
                    <input aria-label={`Seçenek ${i + 1} adı`} className={input} maxLength={40} placeholder="Renk / Numara / Hacim" value={name} required onChange={e => updateRow(i, "name", e.target.value)} />
                    <input aria-label={`Seçenek ${i + 1} değeri`} className={input} maxLength={80} placeholder="Lacivert / 42 / 2,5 L" value={text} required onChange={e => updateRow(i, "value", e.target.value)} />
                    <button type="button" aria-label="Seçeneği kaldır" className="px-2 text-red-600" onClick={() => commitRows(rows.filter((_, j) => j !== i))}>×</button>
                </div>)}
                <button type="button" disabled={rows.length >= 8 || rows.some(([key]) => !key)} className="text-sm font-medium text-primary disabled:opacity-50" onClick={() => commitRows([...rows, ["", ""]])}>+ Seçenek başlığı ekle</button>
                <p className="text-xs text-text-secondary">Örnek: Renk = Lacivert ve Numara = 42. Bu grupta aynı birleşim ikinci kez kaydedilemez.</p>
            </>}
        </fieldset>
    </section>;
}
