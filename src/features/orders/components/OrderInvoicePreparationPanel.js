"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, LoaderCircle } from "lucide-react";
import InvoiceRecoveryPanel from "./InvoiceRecoveryPanel";
import { getOrderInvoicePreparation, getTestInvoicePreparation, getOrderInvoiceState,
    createOrderInvoiceDraft, finalizeOrderInvoice, refreshOrderInvoice, getOrderInvoiceFile,
    investigateOrderInvoice, retryOrderInvoiceRecovery, getOrderInvoiceRecoveryHistory } from "@/features/orders/services/orderService";

const invoiceLabels = {
    CreatingDraft: "Taslak işlemi sürüyor — sonucu kontrol edin",
    Draft: "Taslak hazır — henüz gönderilmedi",
    CreateRejected: "Taslak isteği kabul edilmedi",
    CreateUnknown: "Taslak sonucu belirsiz — mevcut belge kontrol edilmeli",
    Finalizing: "Gönderim işlemi sürüyor — sonucu kontrol edin",
    FinalizeRejected: "Gönderim isteği kabul edilmedi",
    FinalizeUnknown: "Gönderim sonucu doğrulanmalı — yeniden göndermeyin",
    Submitted: "Fatura gönderimi kaydedildi",
    ProviderReview: "Sağlayıcı durumu inceleme gerektiriyor",
};

const environmentLabels = { Test: "Test ortamı", Production: "Canlı ortam" };
const emailLabels = {
    WaitingForDelivery: "Teslimat onayı bekleniyor",
    Queued: "E-posta gönderim sırasında",
    WaitingForInvoice: "Kesin fatura çıktısı bekleniyor",
    Retrying: "Gönderim yeniden denenecek",
    Sent: "PDF ekli e-posta gönderildi",
    Skipped: "Gönderilmedi",
};

function dateTime(value) {
    return value ? new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "—";
}

function money(value) {
    return value == null ? "Belirlenmedi" : new Intl.NumberFormat("tr-TR", {
        style: "currency", currency: "TRY",
    }).format(value);
}

export default function OrderInvoicePreparationPanel({ orderId }) {
    const [preparation, setPreparation] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [testAvailable, setTestAvailable] = useState(false);
    const requestRef = useRef(null);
    const [invoice, setInvoice] = useState(null);
    const [invoiceLoadedFor, setInvoiceLoadedFor] = useState(null);
    const [recovery, setRecovery] = useState(null);
    const [recoveryHistory, setRecoveryHistory] = useState([]);
    const currentInvoice = invoice?.orderId === orderId ? invoice : null;
    const currentPreparation = preparation?.orderId === orderId && !preparation?.isTestScenario ? preparation : null;

    useEffect(() => {
        const controller = new AbortController();
        getOrderInvoiceState(orderId, { signal: controller.signal }).then(response => {
            if (controller.signal.aborted) return;
            setInvoice(response.data);
            setInvoiceLoadedFor(orderId);
            getOrderInvoiceRecoveryHistory(orderId, { signal: controller.signal }).then(history => {
                if (!controller.signal.aborted) {
                    setRecoveryHistory(history.data || []);
                    setRecovery(history.data?.[0] || null);
                }
            }).catch(() => { /* Invoice details remain usable if history is unavailable. */ });
        }).catch(exception => {
            if (!controller.signal.aborted) setError(exception.message || "Fatura kaydı alınamadı.");
        });
        return () => controller.abort();
    }, [orderId]);

    async function invoiceAction(action, xml = false, recoveryRequest = null) {
        if (requestRef.current) return;
        if ((action === "draft" || action === "finalize") && !currentPreparation?.isPreparationComplete) {
            setError("Önce bu siparişin fatura hazırlığını kontrol edip eksik bilgileri tamamlayın.");
            return;
        }
        const controller = new AbortController();
        requestRef.current = controller; setLoading(true); setError("");
        try {
            if (action === "investigate") {
                const response = await investigateOrderInvoice(orderId, { signal: controller.signal });
                if (!controller.signal.aborted && response.data?.invoice?.orderId === orderId) {
                    setRecovery(response.data); setInvoice(response.data.invoice);
                }
            } else if (action === "retryRecovery") {
                setRecovery(null);
                const response = await retryOrderInvoiceRecovery(orderId, recoveryRequest, { signal: controller.signal });
                if (!controller.signal.aborted && response.data?.orderId === orderId) setInvoice(response.data);
            } else if (action === "file") {
                const file = await getOrderInvoiceFile(orderId, xml, { signal: controller.signal });
                if (controller.signal.aborted) return;
                const url = URL.createObjectURL(file);
                const link = document.createElement("a");
                link.href = url; link.download = `fatura-${currentInvoice?.invoiceNumber || orderId}.${xml ? "xml" : "pdf"}`;
                link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
            } else {
                const operation = action === "draft" ? createOrderInvoiceDraft
                    : action === "finalize" ? finalizeOrderInvoice : refreshOrderInvoice;
                const response = await operation(orderId, { signal: controller.signal });
                if (!controller.signal.aborted && response.data?.orderId === orderId) setInvoice(response.data);
            }
        } catch (exception) {
            if (!controller.signal.aborted) {
                setError(exception.message || "Fatura işlemi tamamlanamadı. Yeniden belge oluşturmadan durumunu kontrol edin.");
                // A lost response may still have created a provider document. Recover server state only.
                try {
                    const response = await getOrderInvoiceState(orderId, { signal: controller.signal });
                    if (!controller.signal.aborted) setInvoice(response.data);
                } catch { /* Keep the error and disable automatic retries. */ }
            }
        } finally {
            if (!controller.signal.aborted && (action === "investigate" || action === "retryRecovery")) {
                try {
                    const response = await getOrderInvoiceRecoveryHistory(orderId, { signal: controller.signal });
                    if (!controller.signal.aborted) {
                        setRecoveryHistory(response.data || []);
                        setRecovery(response.data?.[0] || null);
                        if (response.data?.[0]?.invoice?.orderId === orderId) setInvoice(response.data[0].invoice);
                    }
                } catch { /* Preserve the primary operation result if history cannot be loaded. */ }
            }
            if (!controller.signal.aborted) { setLoading(false); requestRef.current = null; }
        }
    }

    useEffect(() => () => requestRef.current?.abort(), []);

    async function prepare(testScenario = false) {
        if (requestRef.current) return;
        const controller = new AbortController();
        requestRef.current = controller;
        setLoading(true);
        setError("");
        setPreparation(null);
        try {
            const response = testScenario
                ? await getTestInvoicePreparation({ signal: controller.signal })
                : await getOrderInvoicePreparation(orderId, { signal: controller.signal });
            if (controller.signal.aborted) return;
            const result = response?.data;
            const sourceMatches = testScenario
                ? result?.isTestScenario === true && result?.environment === "Test"
                : result?.orderId === orderId && !result?.isTestScenario;
            if (!result || !sourceMatches || !Array.isArray(result.issues) || !Array.isArray(result.lines)) {
                throw new Error("Fatura hazırlık bilgileri beklenen biçimde alınamadı.");
            }
            setPreparation(result);
            setTestAvailable(result.environment === "Test");
        } catch (exception) {
            if (!controller.signal.aborted) {
                setError(exception.message || "Fatura hazırlığı kontrol edilemedi.");
            }
        } finally {
            if (!controller.signal.aborted) {
                setLoading(false);
                requestRef.current = null;
            }
        }
    }

    return (
        <section className="rounded-xl border border-border p-4 print:hidden" aria-label="Fatura hazırlığı">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-text-primary">
                        <FileText className="h-4 w-4" aria-hidden="true" /> Fatura hazırlığı
                    </h3>
                    <p className="mt-1 text-xs text-text-secondary">
                        Sevk öncesi alıcı, kalem ve tutar kontrolü. Bu işlem fatura kesmez.
                    </p>
                </div>
                <button type="button" onClick={() => prepare()} disabled={loading}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-primary hover:bg-background-soft disabled:opacity-50">
                    {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
                    {loading ? "Kontrol ediliyor…" : "Fatura hazırlığını kontrol et"}
                </button>
            </div>

            {testAvailable && (
                <div className="mt-3 rounded-lg border border-border p-3 text-xs text-text-secondary">
                    <p>%20 KDV’li örnek ürün ve kargo ile kontrol edin. Mevcut sipariş değişmez; örnek sipariş kaydedilmez.</p>
                    <button type="button" onClick={() => prepare(true)} disabled={loading}
                        className="mt-2 rounded-lg border border-border px-3 py-2 font-semibold text-text-primary hover:bg-background-soft disabled:opacity-50">
                        Örnek test senaryosunu kontrol et
                    </button>
                </div>
            )}

            <div aria-live="polite" aria-busy={loading}>
                {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                {preparation && (
                    <div className="mt-4 space-y-3 text-sm">
                        {preparation.isTestScenario && (
                            <p className="rounded-lg bg-blue-50 p-3 font-semibold text-blue-900">
                                Örnek test senaryosu — aşağıdaki bilgiler açık siparişe ait değildir. Sipariş ve ödeme kaydı oluşturulmadı.
                            </p>
                        )}
                        <p className="font-semibold text-text-primary">
                            {preparation.isPreparationComplete ? "Hazırlık bilgileri tamamlandı" : "Tamamlanması gereken bilgiler var"}
                            <span className="ml-2 text-xs text-text-secondary">
                                {environmentLabels[preparation.environment] || "Ortam doğrulanmadı"}
                            </span>
                        </p>
                        <dl className="grid gap-3 rounded-lg bg-background-soft p-3 sm:grid-cols-2">
                            <div><dt className="text-xs text-text-secondary">Alıcı</dt><dd>{preparation.customer?.name || "—"}</dd></div>
                            <div><dt className="text-xs text-text-secondary">Belge türü</dt><dd>{preparation.invoiceProfile === "EARSIVFATURA" ? "e-Arşiv" : preparation.invoiceProfile === "TICARIFATURA" ? "e-Fatura" : "Henüz doğrulanmadı"}</dd></div>
                        </dl>
                        {preparation.issues.length > 0 && (
                            <ul className="list-disc space-y-1 rounded-lg bg-amber-50 py-3 pr-3 pl-7 text-amber-900">
                                {preparation.issues.map((issue, index) => <li key={`${issue.code}-${index}`}>{issue.message}</li>)}
                            </ul>
                        )}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <caption className="sr-only">Hazırlanan fatura kalemleri</caption>
                                <thead><tr className="border-b border-border text-text-secondary">
                                    <th scope="col" className="py-2 pr-3">Ürün / hizmet</th>
                                    <th scope="col" className="py-2 pr-3">Adet</th>
                                    <th scope="col" className="py-2 pr-3">KDV</th>
                                    <th scope="col" className="py-2 pr-3">KDV tutarı</th>
                                    <th scope="col" className="py-2 text-right">Toplam</th>
                                </tr></thead>
                                <tbody>{preparation.lines.map((line, index) => (
                                    <tr key={line.productId || `shipping-${index}`} className="border-b border-border">
                                        <td className="py-2 pr-3">{line.productName}</td>
                                        <td className="py-2 pr-3">{line.quantity}</td>
                                        <td className="py-2 pr-3">{line.taxRate == null ? "Belirlenmedi" : `%${line.taxRate}`}</td>
                                        <td className="py-2 pr-3">{money(line.taxAmount)}</td>
                                        <td className="py-2 text-right">{money(line.grossAmount)}</td>
                                    </tr>
                                ))}</tbody>
                            </table>
                        </div>
                        <dl className="flex flex-wrap justify-end gap-5 border-t border-border pt-3">
                            <div><dt className="text-xs text-text-secondary">KDV hariç</dt><dd>{money(preparation.netAmount)}</dd></div>
                            <div><dt className="text-xs text-text-secondary">KDV</dt><dd>{money(preparation.taxAmount)}</dd></div>
                            <div><dt className="text-xs text-text-secondary">Genel toplam</dt><dd className="font-bold">{money(preparation.grossAmount)}</dd></div>
                        </dl>
                        {!currentInvoice && <p className="text-xs text-text-secondary">
                            Fatura henüz oluşturulmadı. Kesinleştirme ve çıktı alma adımı ayrıca tamamlanacak.
                        </p>}
                    </div>
                )}
                {invoiceLoadedFor === orderId && (
                    <div className="mt-4 space-y-3 rounded-lg border border-border p-3 text-sm">
                        <h4 className="font-semibold text-text-primary">Fatura işlemleri</h4>
                        {currentPreparation && <p className="rounded-lg bg-background-soft p-3">
                            Sipariş: <strong>{currentPreparation.orderNumber}</strong>
                            {" · "}Fatura toplamı: <strong>{money(currentPreparation.grossAmount)}</strong>
                            {" · "}{environmentLabels[currentPreparation.environment] || "Ortam doğrulanmadı"}
                        </p>}
                        {!currentPreparation && (!currentInvoice || currentInvoice.canFinalize) && (
                            <p className="text-xs text-text-secondary">Fatura işlemleri için önce açık siparişin fatura hazırlığını kontrol edin.</p>
                        )}
                        {currentInvoice && <>
                            <p>{invoiceLabels[currentInvoice.status] || "Belge durumu kontrol edilmeli"}
                                <span className="ml-2 text-xs">{environmentLabels[currentInvoice.environment] || "Ortam doğrulanmadı"}</span></p>
                            {currentInvoice.invoiceNumber && <p>Fatura no: <strong>{currentInvoice.invoiceNumber}</strong></p>}
                            {currentInvoice.providerStatus && <p>Faturaport durumu: {currentInvoice.providerStatus}</p>}
                            {currentInvoice.lastStatusCheckAt && <p className="text-xs text-text-secondary">Son durum kontrolü: {dateTime(currentInvoice.lastStatusCheckAt)}</p>}
                            <p>Müşteri e-postası: {emailLabels[currentInvoice.emailStatus] || "Teslimat onayı bekleniyor"}</p>
                            {currentInvoice.emailSentAt && <p className="text-xs text-text-secondary">Gönderim zamanı: {dateTime(currentInvoice.emailSentAt)}</p>}
                            {currentInvoice.emailError && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-900">{currentInvoice.emailError}</p>}
                            {currentInvoice.lastError && <p role="alert" className="rounded-lg bg-amber-50 p-3 text-amber-900">{currentInvoice.lastError}</p>}
                        </>}
                        <div className="flex flex-wrap gap-2">
                            {(!currentInvoice || currentInvoice.status === "CreateRejected") && (
                                <button type="button" disabled={loading || !currentPreparation?.isPreparationComplete}
                                    onClick={() => invoiceAction("draft")}
                                    className="rounded-lg bg-primary px-3 py-2 font-semibold text-white disabled:opacity-50">
                                    {currentInvoice ? "Taslak isteğini yeniden gönder" : "Fatura taslağı oluştur"}
                                </button>
                            )}
                            {currentInvoice?.canFinalize && <button type="button" disabled={loading || !currentPreparation?.isPreparationComplete}
                                onClick={() => invoiceAction("finalize")}
                                className="rounded-lg bg-primary px-3 py-2 font-semibold text-white disabled:opacity-50">
                                Faturayı kesinleştir ve gönder
                            </button>}
                            {currentInvoice && <button type="button" disabled={loading}
                                onClick={() => invoiceAction("refresh")}
                                className="rounded-lg border border-border px-3 py-2 font-semibold disabled:opacity-50">
                                Fatura durumunu kontrol et
                            </button>}
                            {currentInvoice?.status === "Submitted" && currentInvoice.invoiceId && <>
                                <button type="button" disabled={loading} onClick={() => invoiceAction("file")}
                                    className="rounded-lg border border-border px-3 py-2 font-semibold disabled:opacity-50">PDF indir</button>
                                <button type="button" disabled={loading} onClick={() => invoiceAction("file", true)}
                                    className="rounded-lg border border-border px-3 py-2 font-semibold disabled:opacity-50">XML indir</button>
                            </>}
                        </div>
                        {currentInvoice && <InvoiceRecoveryPanel key={`${orderId}-${recovery?.checkId || "initial"}`}
                            invoice={currentInvoice} recovery={recovery?.invoice?.orderId === orderId ? recovery : null}
                            history={recoveryHistory.filter(item => item.invoice?.orderId === orderId)} loading={loading}
                            onInvestigate={() => invoiceAction("investigate")}
                            onRetry={body => invoiceAction("retryRecovery", false, body)} />}
                        <p className="text-xs text-text-secondary">
                            Taslak oluşturma faturayı göndermez. Sevkten önce faturayı kesinleştirin.
                            Sipariş “Teslim Edildi” olduğunda PDF ekli fatura e-postası otomatik gönderilir.
                            Faturaport’taki bekleyen belge durumları otomatik kontrol edilir.
                            Gönderim yanıtı tek başına GİB kabulünü veya e-Arşiv rapor kabulünü doğrulamaz.
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
