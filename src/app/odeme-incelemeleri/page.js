"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function PaymentReviewsPage() {
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    const [rows, setRows] = useState([]);
    const [resolved, setResolved] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [references, setReferences] = useState({});
    const [busy, setBusy] = useState(null);
    const load = useCallback(async (signal) => {
        setLoading(true);
        try {
            const response = await adminApi.get("/paytr-duplicate-payments", { params: { resolved }, signal });
            if (signal?.aborted) return;
            setRows(response?.data ?? response ?? []);
            setError("");
        } catch (e) { if (!signal?.aborted) setError(e.message ?? "Ödeme kayıtları alınamadı."); }
        finally { if (!signal?.aborted) setLoading(false); }
    }, [resolved]);
    useEffect(() => {
        if (isAuthLoading || !isAuthenticated) return;
        const controller = new AbortController();
        const task = window.setTimeout(() => { void load(controller.signal); }, 0);
        return () => { window.clearTimeout(task); controller.abort(); };
    }, [load, isAuthLoading, isAuthenticated]);
    async function verify(id) {
        if (busy) return;
        setBusy(id); setError("");
        try {
            await adminApi.post(`/paytr-duplicate-payments/${id}/verify-refund`, { referenceNo: references[id]?.trim() });
            await load();
        } catch (e) { setError(e.message ?? "İade doğrulanamadı."); }
        finally { setBusy(null); }
    }
    return <AdminLayout><div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-text-primary">Ödeme incelemeleri</h1>
            <p className="mt-2 text-sm text-text-secondary">Eski sepet sürümüne ait veya mükerrer PayTR tahsilatları. İadeyi PayTR panelinde bu işlem numarası üzerinden tamamlayın; ardından iade referansıyla doğrulayın. Bu ekran para iadesi başlatmaz.</p></div>
        <div className="flex gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={resolved} onChange={e => setResolved(e.target.checked)} />İadesi doğrulananları göster</label>
            <button type="button" onClick={() => load()} disabled={loading} className="text-sm font-semibold text-primary">Yenile</button></div>
        {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {loading ? <p role="status">Kayıtlar yükleniyor…</p> : rows.length === 0 ? <p className="rounded-xl border border-border bg-white p-6">{resolved ? "Doğrulanmış iade kaydı bulunmuyor." : "İnceleme bekleyen mükerrer tahsilat bulunmuyor."}</p> :
            <div className="space-y-4">{rows.map(row => <section key={row.id} className="space-y-3 rounded-xl border border-border bg-white p-5">
                <div className="flex flex-wrap justify-between gap-3"><span className="break-all font-mono text-sm">{row.merchantOid}</span><strong>{Number(row.amount).toLocaleString("tr-TR", { style: "currency", currency: "TRY" })}</strong></div>
                <p className="text-sm text-text-secondary">Tahsilat: {row.paidAt ? new Date(row.paidAt).toLocaleString("tr-TR") : "—"}</p>
                <div className="flex gap-4 text-sm text-primary">{row.orderId && <Link href={`/siparisler/${row.orderId}`}>Siparişi görüntüle</Link>}
                    <a href={`https://www.paytr.com/magaza/islemler?merchant_oid=${encodeURIComponent(row.merchantOid)}`} target="_blank" rel="noopener noreferrer">PayTR işlemini görüntüle</a></div>
                {row.resolvedAt ? <p className="text-sm text-green-700">İade doğrulandı: {row.refundReference}</p> :
                    <form className="flex flex-wrap gap-3" onSubmit={e => { e.preventDefault(); void verify(row.id); }}>
                        <label className="flex flex-col gap-1 text-sm">PayTR iade referansı<input required maxLength={64} pattern="[A-Za-z0-9]+" value={references[row.id] ?? ""} onChange={e => setReferences(current => ({ ...current, [row.id]: e.target.value }))} className="rounded-lg border border-border px-3 py-2" /></label>
                        <button disabled={!!busy} className="self-end rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy === row.id ? "Doğrulanıyor…" : "Tam tutarlı iadeyi doğrula"}</button>
                    </form>}
            </section>)}</div>}
    </div></AdminLayout>;
}
