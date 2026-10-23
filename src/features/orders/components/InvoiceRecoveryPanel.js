"use client";

import { useEffect, useState } from "react";
import { SearchCheck, ShieldCheck } from "lucide-react";

const uncertainStates = ["CreateUnknown", "CreatingDraft", "FinalizeUnknown", "Finalizing"];
const time = value => new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short", timeStyle: "short", timeZone: "Europe/Istanbul",
}).format(new Date(value));

export default function InvoiceRecoveryPanel({ invoice, recovery, history, loading, onInvestigate, onRetry }) {
    const [confirmed, setConfirmed] = useState(false);
    const [reason, setReason] = useState("");
    const [expired, setExpired] = useState(false);
    useEffect(() => {
        if (!recovery?.expiresAt) return;
        const timer = setTimeout(() => setExpired(true), Math.max(0, new Date(recovery.expiresAt).getTime() - Date.now()));
        return () => clearTimeout(timer);
    }, [recovery?.expiresAt]);
    const uncertain = uncertainStates.includes(invoice.status);
    const current = recovery?.invoice?.id === invoice.id ? recovery : null;
    if (!uncertain && !current && !history.length) return null;
    const retryAllowed = current?.canRetry && !current.retriedAt
        && current.invoice.status === invoice.status && !expired;
    const finalize = current?.retryAction === "Finalize";

    return (
        <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50/60 p-3" aria-label="Kontrollü fatura kurtarma">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <h5 className="flex items-center gap-2 font-semibold text-text-primary">
                    <ShieldCheck className="h-4 w-4 text-amber-700" aria-hidden="true" /> Kontrollü fatura kurtarma
                </h5>
                {uncertain && <button type="button" disabled={loading} onClick={() => {
                    setConfirmed(false); setReason(""); onInvestigate();
                }} className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 font-semibold hover:bg-amber-100 disabled:opacity-50">
                    <SearchCheck className="h-4 w-4" aria-hidden="true" /> Sorunu araştır
                </button>}
            </div>
            {uncertain && <p className="text-xs text-text-secondary">
                Referans, taslaklar ve giden faturalar kontrol edilir. Doğrulanan belge mevcut siparişe bağlanır.
                Araştırma yeni fatura oluşturmaz. Son belge isteğinden sonra 5 dakika beklenir.
            </p>}
            {current && <div className="space-y-2 rounded-lg border border-amber-200 bg-white p-3" role="status">
                {current.retriedAt && <p className="font-semibold text-text-primary">Bu incelemenin yeniden deneme onayı kullanıldı. Güncel fatura durumu yukarıda gösterilir.</p>}
                <p className="text-sm">{current.message}</p>
                <p className="text-xs text-text-secondary">Kontrol: {time(current.checkedAt)}
                    {["NotFound", "DraftStillPresent", "DraftRecovered", "InvoiceRecovered"].includes(current.outcome)
                        && <> · Taranan taslak: {current.draftCount} · Giden belge: {current.outgoingCount}</>}
                </p>
                {retryAllowed && <div className="space-y-3 border-t border-border pt-3">
                    <p className="text-xs text-amber-900">
                        {finalize ? "Aynı taslak kesinleştirilecektir; yeni taslak oluşturulmaz. " : "Aynı sipariş referansıyla bir taslak oluşturma isteği gönderilecektir. "}
                        Faturaport portalında bu siparişin taslak, giden ve imza/gönderim bekleyen kayıtlarını kontrol edin.
                        Sağlayıcıda geç görünen kayıtlar olabilir; yalnızca boş sorgu sonucu yeterli değildir.
                    </p>
                    <label className="flex items-start gap-2 text-sm">
                        <input type="checkbox" checked={confirmed} disabled={loading} onChange={event => setConfirmed(event.target.checked)} className="mt-1 accent-orange-500" />
                        <span>{finalize
                            ? "Portalda kesin fatura veya bekleyen gönderim olmadığını ve aynı taslağın yeniden gönderilebilir olduğunu teyit ettim."
                            : "Portalda bu siparişe ait taslak, kesin fatura veya bekleyen gönderim olmadığını teyit ettim."}</span>
                    </label>
                    <label className="block text-xs font-semibold text-text-secondary">
                        İnceleme açıklaması (10–500 karakter)
                        <textarea value={reason} maxLength={500} rows={2} disabled={loading}
                            onChange={event => setReason(event.target.value)}
                            className="mt-1 w-full rounded-lg border border-border bg-white p-2 text-sm font-normal text-text-primary"
                            placeholder="Portalda kontrol ettiğiniz kayıtları ve sonucu belirtin." />
                    </label>
                    <p className="text-xs text-text-secondary">Onay {time(current.expiresAt)} tarihine kadar, incelemeyi yapan yönetici için geçerlidir.
                        Göndermeden önce sistem tekrar kontrol eder.</p>
                    <button type="button" disabled={loading || !confirmed || reason.trim().length < 10}
                        onClick={() => { setConfirmed(false); onRetry({ checkId: current.checkId, portalConfirmed: true, reason: reason.trim() }); }}
                        className="rounded-lg bg-primary px-3 py-2 font-semibold text-white disabled:opacity-50">
                        {finalize ? "Teyit ettim, aynı taslağı yeniden gönder" : "Teyit ettim, aynı referansla yeniden dene"}
                    </button>
                </div>}
            </div>}
            {history.length > 0 && <details className="text-xs text-text-secondary">
                <summary className="cursor-pointer font-semibold">Son incelemeler ve onay kayıtları</summary>
                <ul className="mt-2 space-y-2">
                    {history.map(item => <li key={item.checkId} className="rounded-lg border border-amber-200 bg-white p-2">
                        <p>{time(item.checkedAt)} · Yönetici: {item.checkedBy}</p>
                        <p className="mt-1">{item.message}</p>
                        {item.retriedAt && <p className="mt-1 font-semibold text-amber-900">Yeniden deneme onayı: {time(item.retriedAt)}</p>}
                        {item.reason && <p className="mt-1">İnceleme açıklaması: {item.reason}</p>}
                    </li>)}
                </ul>
            </details>}
        </div>
    );
}
