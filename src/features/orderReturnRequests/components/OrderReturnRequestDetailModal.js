/* eslint-disable react/no-unescaped-entities */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getOrderById } from "@/features/orders/services/orderService";
import { AlertTriangle, Banknote, CheckCircle2, CreditCard, LoaderCircle, Package, ShieldCheck, X } from "lucide-react";
import {
    approveOrderReturnRequest,
    completeManualBankRefund,
    getOrderReturnRequestById,
    executePaymentRefund,
    executePaymentRefundRetry,
    getPaymentRefundByReturnRequest,
    verifyPaymentRefund,
    rejectOrderReturnRequest,
} from "@/features/orderReturnRequests/services/orderReturnRequestService";
import {
    formatDate, formatMoney, getStatusClasses, getStatusLabel, getTypeLabel, normalizeStatus, normalizeType,
} from "@/features/orderReturnRequests/constants/returnRequestConstants";

function extractDetail(response) {
    const detail = response?.data ?? response;
    if (!detail || !detail.id || !Array.isArray(detail.items)) {
        throw new Error("Talep detayları API yanıtında bulunamadı.");
    }
    return detail;
}

function getErrorMessage(error) {
    return error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || "İşlem sırasında hata oluştu.";
}


// PaymentRefundStatus enum: Prepared=1, Processing=2, Accepted=3, Failed=4, VerificationRequired=5
const REFUND_STATUS = { Prepared: 1, Processing: 2, Accepted: 3, Failed: 4, VerificationRequired: 5 };

function normalizeRefundStatus(value) {
    if (typeof value === "number") return value;
    if (Object.hasOwn(REFUND_STATUS, String(value))) return REFUND_STATUS[String(value)];
    const parsed = Number(value);
    return Number.isInteger(parsed) && String(value).trim() !== "" ? parsed : null;
}

function getRefundStatusText(value) {
    switch (normalizeRefundStatus(value)) {
        case 1: return "Hazırlandı";
        case 2: return "İşleniyor / sonuç araştırılıyor";
        case 3: return "PayTR tarafından kabul edildi, tamamlanma doğrulanıyor";
        case 4: return "Başarısız - manuel inceleme gerekli";
        case 5: return "PayTR doğrulaması gerekli";
        default: return "Henüz bilinmiyor";
    }
}

function isNotFound(error) {
    return error?.status === 404 || error?.response?.status === 404 ||
        /(bulunamad[ıi]|bulunmuyor|not found)/i.test(error?.message ?? "");
}

function calculateRefundPreview(detail, order) {
    const orderItems = Array.isArray(order.items) ? order.items : [];
    const requestItems = Array.isArray(detail.items) ? detail.items : [];
    const coversEntireOrder = orderItems.length > 0 && orderItems.every((orderItem) =>
        requestItems.some((requestItem) =>
            requestItem.orderItemId === orderItem.orderItemId &&
            Number(requestItem.quantity) === Number(orderItem.quantity),
        ),
    );

    const itemsTotal = Number(detail.requestedItemsTotal ?? 0);
    const refundableShipping = coversEntireOrder ? Number(order.shippingCost ?? 0) : 0;
    const maximumForRequest = Math.round((itemsTotal + refundableShipping) * 100) / 100;
    const orderTotal = Number(order.grandTotal);

    // UI önerisi: backend ayrıca gerçekleşen ödeme ve diğer iadeleri kontrol eder.
    const suggestedAmount = Number.isFinite(orderTotal)
        ? Math.max(0, Math.min(maximumForRequest, orderTotal))
        : maximumForRequest;

    return { itemsTotal, refundableShipping, maximumForRequest, orderTotal, coversEntireOrder, suggestedAmount };
}

// Tarayicinin window.confirm kutusu yerine tum islemlerde kullanilan erisilebilir onay penceresi.
function ActionConfirmationModal({ confirmation, requestNumber, isSaving, onCancel, onConfirm }) {
    const cancelButtonRef = useRef(null);
    const dialogRef = useRef(null);

    useEffect(() => {
        const previousFocus = document.activeElement;
        cancelButtonRef.current?.focus();
        return () => {
            if (previousFocus?.isConnected && typeof previousFocus.focus === "function") {
                previousFocus.focus();
            }
        };
    }, []);

    function handleKeyDown(event) {
        if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            if (!isSaving) onCancel();
            return;
        }

        if (event.key !== "Tab") return;

        const focusable = Array.from(dialogRef.current?.querySelectorAll("button:not([disabled])") ?? []);
        if (focusable.length === 0) {
            event.preventDefault();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || !dialogRef.current?.contains(document.activeElement))) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !dialogRef.current?.contains(document.activeElement))) {
            event.preventDefault();
            first.focus();
        }
    }

    const isApprove = confirmation.kind === "approve";
    const isReject = confirmation.kind === "reject";
    const isRetry = confirmation.kind === "retry";
    const isManual = confirmation.kind === "manual";
    const isCancelWithoutRefund = confirmation.kind === "cancelNoPayment";
    const config = isCancelWithoutRefund
        ? {
            title: "Ödeme almadan siparişi iptal et",
            description: "Banka havalesi tahsil edilmediğini doğruladığınız bu sipariş tamamen iptal edilecek. Müşteriye para iadesi yapılmayacak ve iptal bildirimi gönderilecek.",
            buttonText: "Evet, Para İadesiz İptali Onayla",
            buttonClass: "bg-amber-700 hover:bg-amber-800",
            iconClass: "bg-amber-50 text-amber-800",
            Icon: AlertTriangle,
        }
        : isApprove
            ? {
                title: "İptal / iade talebini onayla",
                description: "Bu kararı kaydetmeden önce onaylanan tutarı ve değerlendirme notunu kontrol edin.",
                buttonText: "Evet, Talebi Onayla",
                buttonClass: "bg-green-700 hover:bg-green-800",
                iconClass: "bg-green-50 text-green-700",
                Icon: ShieldCheck,
            }
            : isReject
                ? {
                    title: "Talebi reddetmek istiyor musunuz?",
                    description: "Ret gerekçesiyle birlikte talep reddedilecek. İşlemi onaylamadan önce gerekçeyi kontrol edin.",
                    buttonText: "Evet, Talebi Reddet",
                    buttonClass: "bg-red-700 hover:bg-red-800",
                    iconClass: "bg-red-50 text-red-700",
                    Icon: AlertTriangle,
                }
                : isManual
                    ? {
                        title: "Havale / EFT ücret iadesini tamamla",
                        description: "Banka transferini gerçekten gerçekleştirdiğinizi ve dekont bilgilerini doğrulayın. Bu işlem müşteri kaydını iade tamamlandı olarak günceller.",
                        buttonText: "Evet, Ücret İadesini Tamamla",
                        buttonClass: "bg-green-700 hover:bg-green-800",
                        iconClass: "bg-green-50 text-green-700",
                        Icon: Banknote,
                    }
                    : isRetry
                        ? {
                            title: "PayTR finansal iadeyi yeniden dene",
                            description: "Önceki başarısız deneme saklanır; aşağıda yazan onaylı tutar için yeni bir PayTR iade denemesi oluşturulur.",
                            buttonText: "Evet, Yeni İade Denemesini Başlat",
                            buttonClass: "bg-primary hover:bg-primary-hover",
                            iconClass: "bg-amber-50 text-amber-700",
                            Icon: CreditCard,
                        }
                        : {
                            title: "PayTR para iadesini başlat",
                            description: "Bu onayla finansal iade kaydı hazırlanacak ve PayTR'ye iade API isteği gönderilecek.",
                            buttonText: "Evet, Para İadesini Başlat",
                            buttonClass: "bg-primary hover:bg-primary-hover",
                            iconClass: "bg-orange-50 text-primary",
                            Icon: CreditCard,
                        };
    const IconComponent = config.Icon;

    return (
        <div
            role="presentation"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-[2px] sm:p-5"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !isSaving) onCancel();
            }}
        >
            <section
                ref={dialogRef}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="refund-confirm-title"
                aria-describedby="refund-confirm-description"
                aria-busy={isSaving}
                onKeyDown={handleKeyDown}
                className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl"
            >
                <div className="border-b border-border px-5 py-5 sm:px-6">
                    <div className="flex items-start gap-3">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}>
                            <IconComponent className="h-6 w-6" strokeWidth={1.8} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h3 id="refund-confirm-title" className="text-lg font-bold text-text-primary">
                                {config.title}
                            </h3>
                            <p id="refund-confirm-description" className="mt-1 text-sm leading-6 text-text-secondary">
                                {config.description}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={isSaving}
                            aria-label="Onay penceresini kapat"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-background-soft disabled:opacity-50"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="space-y-4 px-5 py-5 sm:px-6">
                    <dl className="divide-y divide-border rounded-xl border border-border px-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 py-3">
                            <dt className="text-xs font-medium text-text-secondary">Talep numarası</dt>
                            <dd className="break-all text-right text-xs font-bold text-text-primary">{requestNumber}</dd>
                        </div>
                        {!isReject && (
                            <div className="flex items-center justify-between gap-2 py-3">
                                <dt className="text-xs font-medium text-text-secondary">{isCancelWithoutRefund ? "Para iadesi" : isApprove ? "Onaylanacak tutar" : isManual ? "Manuel iade tutarı" : "PayTR iade tutarı"}</dt>
                                <dd className="text-lg font-bold text-text-primary">{formatMoney(confirmation.amount)}</dd>
                            </div>
                        )}
                        {!isReject && !isApprove && (
                            <div className="flex items-center justify-between gap-2 py-3">
                                <dt className="text-xs font-medium text-text-secondary">Ödeme yöntemi</dt>
                                <dd className="text-sm font-bold text-text-primary">{isManual || isCancelWithoutRefund ? "Havale / EFT" : "PayTR"}</dd>
                            </div>
                        )}
                    </dl>

                    {(isApprove || isCancelWithoutRefund) && confirmation.note && (
                        <div className="rounded-xl bg-background-soft px-4 py-3">
                            <p className="text-xs font-semibold text-text-secondary">Admin notu</p>
                            <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-text-primary">{confirmation.note}</p>
                        </div>
                    )}
                    {isCancelWithoutRefund && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
                            Siparişte kayıtlı tahsilat bulunmadığını kontrol ettim. Bu işlem siparişin tamamını iptal eder; ücret iadesi oluşturmaz.
                        </div>
                    )}
                    {isManual && (
                        <div className="space-y-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-950">
                            <div>
                                <p className="text-xs font-bold">Banka işlem / dekont referansı</p>
                                <p className="mt-1 break-all font-semibold">{confirmation.bankTransferReference}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold">Transfer tarihi</p>
                                <p className="mt-1">{formatDate(confirmation.transferredAtUtc)}</p>
                            </div>
                            {confirmation.adminNote && (
                                <div>
                                    <p className="text-xs font-bold">Admin açıklaması</p>
                                    <p className="mt-1 whitespace-pre-wrap break-words">{confirmation.adminNote}</p>
                                </div>
                            )}
                        </div>
                    )}
                    {isRetry && (
                        <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                            <p className="font-bold">PayTR teyit referansı</p>
                            <p className="break-all">{confirmation.providerConfirmationReference}</p>
                            <p className="font-bold">Yeniden deneme gerekçesi</p>
                            <p className="whitespace-pre-wrap break-words">{confirmation.approvalReason}</p>
                        </div>
                    )}
                    {isReject && (
                        <div className="rounded-xl bg-red-50 px-4 py-3">
                            <p className="text-xs font-semibold text-red-800">Ret gerekçesi</p>
                            <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-sm leading-6 text-red-900">{confirmation.reason}</p>
                        </div>
                    )}

                    <div className={`flex items-start gap-2 rounded-xl border p-3 text-sm leading-6 ${isReject ? "border-red-200 bg-red-50 text-red-800"
                        : isApprove ? "border-green-200 bg-green-50 text-green-800"
                            : "border-amber-200 bg-amber-50 text-amber-900"
                        }`}>
                        <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
                        <p>
                            {isApprove
                                ? "Bu işlem yalnızca talebi onaylar. EFT/Havale için banka iadesi manuel yapılır; PayTR için ayrı finansal iade işlemi gerekir."
                                : isReject
                                    ? "Talep reddedilecek; bu ekrandan aynı talebi tekrar onaylayamazsınız."
                                    : isManual
                                        ? "Bu buton bankadan para göndermez. Gerçek transferi doğruladıysanız iade tamamlandı olarak kaydedilecek ve müşteri e-posta bildirimi tetiklenecek."
                                        : isRetry
                                            ? "Bu onay yeni bir PayTR iade isteği gönderir. Önceki isteğin iade oluşturmadığını sağlayıcı üzerinden doğrulamış olmalısınız. Yanıt belirsizse asla yeniden göndermeyin."
                                            : "Bu işlem PayTR'ye iade isteği gönderir. Sonuç hemen kesinleşmeyebilir; belirsiz durumda aynı iade tekrar gönderilmemelidir."}
                        </p>
                    </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border bg-background-soft/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                    <button
                        ref={cancelButtonRef}
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="h-11 rounded-lg border border-border bg-white px-5 text-sm font-semibold text-text-primary hover:bg-background-soft disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Vazgeç
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isSaving}
                        className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${config.buttonClass}`}
                    >
                        {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                        {isSaving ? "İşlem gerçekleştiriliyor..." : config.buttonText}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default function OrderReturnRequestDetailModal({ requestId, onClose, onUpdated }) {
    const [request, setRequest] = useState(null);
    const [order, setOrder] = useState(null);
    const [orderLoadError, setOrderLoadError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [confirmation, setConfirmation] = useState(null);
    const confirmInFlight = useRef(false);
    const [approvedAmount, setApprovedAmount] = useState("");
    const [adminNote, setAdminNote] = useState("");
    const [rejectReason, setRejectReason] = useState("");
    const [refund, setRefund] = useState(null);
    const [refundLoadError, setRefundLoadError] = useState("");
    const [refundVerificationError, setRefundVerificationError] = useState("");
    const [retryApprovalReason, setRetryApprovalReason] = useState("");
    const [retryProviderReference, setRetryProviderReference] = useState("");
    const [retryProviderConfirmed, setRetryProviderConfirmed] = useState(false);
    const [manualRefundReference, setManualRefundReference] = useState("");
    const [manualRefundDateTime, setManualRefundDateTime] = useState("");
    const [manualRefundNote, setManualRefundNote] = useState("");
    const [manualRefundConfirmed, setManualRefundConfirmed] = useState(false);
    const [unpaidCancellationNote, setUnpaidCancellationNote] = useState("");
    const [unpaidCancellationConfirmed, setUnpaidCancellationConfirmed] = useState(false);
    const verificationInFlight = useRef(false);

    const load = useCallback(async () => {
        const detail = extractDetail(await getOrderReturnRequestById(requestId));
        setRequest(detail);
    }, [requestId]);

    useEffect(() => {
        let active = true;

        getOrderReturnRequestById(requestId)
            .then(async (result) => {
                const detail = extractDetail(result);
                if (!active) return;

                setRequest(detail);
                setAdminNote(detail.adminNote ?? "");

                try {
                    const orderResponse = await getOrderById(detail.orderId);
                    if (!active) return;

                    const orderData = orderResponse?.data ?? orderResponse;
                    if (orderData?.orderId !== detail.orderId || !Array.isArray(orderData?.items)) {
                        throw new Error("Sipariş detayı API yanıtı eksik veya uyuşmuyor.");
                    }

                    const preview = calculateRefundPreview(detail, orderData);
                    setOrder(orderData);
                    setApprovedAmount(String(detail.approvedRefundAmount ?? preview.suggestedAmount));
                } catch (orderError) {
                    if (!active) return;
                    setOrderLoadError(`Sipariş ve kargo tutarı alınamadı: ${getErrorMessage(orderError)}`);
                    // Yanlışlıkla ürün toplamını tam sipariş iadesi olarak kullanma.
                    setApprovedAmount("");
                }
            })
            .catch((err) => { if (active) setError(getErrorMessage(err)); })
            .finally(() => { if (active) setIsLoading(false); });

        return () => { active = false; };
    }, [requestId]);

    // Finansal iade kaydi ve PayTR dogrulamasi YALNIZCA PayTR siparisleri icindir.
    // BankTransfer siparislerinde bu endpoint 404 doner ve cagrilmamasi gerekir.
    useEffect(() => {
        if (!request || order?.paymentMethod !== "PayTR" || normalizeStatus(request.status) < 3) return;
        let active = true;
        getPaymentRefundByReturnRequest(requestId)
            .then((response) => {
                if (!active) return;
                const value = response?.data ?? response;
                setRefund(value);
                setRefundLoadError("");
            })
            .catch((err) => {
                if (!active) return;
                if (isNotFound(err)) {
                    setRefund(null);
                    setRefundLoadError("");
                    return;
                }
                setRefundLoadError(getErrorMessage(err));
            });
        return () => { active = false; };
    }, [requestId, request?.status, order?.paymentMethod]);

    // Yalnizca mevcut iadenin sonucunu sorgular. YENI iade gondermez.
    // Bu kontrol modal acikken surer; kalici arka plan takibi ayri ele alinmalidir.
    useEffect(() => {
        const refundId = String(refund?.id ?? refund?.paymentRefundId ?? "");
        const requestStatus = normalizeStatus(request?.status);
        const financialStatus = normalizeRefundStatus(refund?.status);
        if (order?.paymentMethod !== "PayTR" || !refundId || ![4, 5].includes(requestStatus) || ![2, 3, 5].includes(financialStatus)) return;

        let active = true;
        let attemptCount = 0;
        const check = async () => {
            if (!active || verificationInFlight.current || attemptCount >= 12) return;
            attemptCount += 1;
            verificationInFlight.current = true;
            try {
                const response = await verifyPaymentRefund(refundId);
                if (!active) return;
                setRefund(response?.data ?? response);
                setRefundVerificationError("");
                await load();
            } catch (err) {
                if (active) setRefundVerificationError(`PayTR doğrulaması henüz sonuçlanmadı: ${getErrorMessage(err)}`);
            } finally {
                verificationInFlight.current = false;
            }
        };
        const initial = setTimeout(check, 5000);
        const interval = setInterval(check, 30000);
        return () => {
            active = false;
            clearTimeout(initial);
            clearInterval(interval);
        };
    }, [refund?.id, refund?.paymentRefundId, refund?.status, request?.status, order?.paymentMethod, load]);

    useEffect(() => {
        function onKeyDown(event) {
            if (event.key === "Escape" && !isSaving && !confirmation) onClose();
        }
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isSaving, onClose, confirmation]);

    async function runAction(action, message) {
        if (isSaving || !request) return;
        setIsSaving(true);
        setError("");
        setSuccess("");
        try {
            await action();
            if (message) setSuccess(message);
            await load();
            onUpdated();
        } catch (err) {
            console.error("İade / iptal talebi işlemi başarısız:", err);
            setError(getErrorMessage(err));
        } finally {
            setIsSaving(false);
        }
    }

    function handleApprove(event) {
        event.preventDefault();
        if (!refundPreview || orderLoadError) {
            setError("Sipariş tutarı doğrulanamadı. Önce sipariş bilgilerini kontrol edin.");
            return;
        }
        const amount = Number(approvedAmount.trim().replace(",", "."));
        if (!/^\d+([.,]\d{1,2})?$/.test(approvedAmount.trim()) || !Number.isFinite(amount) || amount <= 0) {
            setError("İki ondalık basamağı aşmayan pozitif bir iade tutarı girin.");
            return;
        }
        if (amount > refundPreview.maximumForRequest) {
            setError(`Bu talep için hesaplanan azami iade ${formatMoney(refundPreview.maximumForRequest)}.`);
            return;
        }
        setError("");
        setConfirmation({ kind: "approve", amount, note: adminNote.trim() || null });
    }

    function handleCancellationWithoutRefund(event) {
        event.preventDefault();
        if (isSaving || !canCancelWithoutRefund || !unpaidCancellationConfirmed) return;
        setError("");
        setConfirmation({
            kind: "cancelNoPayment",
            amount: 0,
            note: unpaidCancellationNote.trim() || null,
        });
    }

    function handleReject(event) {
        event.preventDefault();
        if (!rejectReason.trim()) {
            setError("Ret gerekçesi zorunludur.");
            return;
        }
        setError("");
        setConfirmation({ kind: "reject", reason: rejectReason.trim() });
    }

    // EFT/Havale: once banka transferi yapilir, sonra bu kayit admin tarafindan dogrulanir.
    // datetime-local tarayicinin yerel saat dilimindedir; API'ye UTC ISO gonderilir.
    function handleManualRefundSubmit(event) {
        event.preventDefault();
        if (isSaving || normalizeStatus(request?.status) !== 7 || order?.paymentMethod !== "BankTransfer") return;

        const bankTransferReference = manualRefundReference.trim();
        if (!bankTransferReference || bankTransferReference.length > 100) {
            setError("Banka işlem/dekont referansı zorunludur ve en fazla 100 karakter olabilir.");
            return;
        }

        if (!manualRefundDateTime) {
            setError("Banka transferinin gerçekleştiği tarih ve saati girin.");
            return;
        }
        const transferDate = new Date(manualRefundDateTime);
        if (Number.isNaN(transferDate.getTime()) || transferDate.getTime() <= 0 || transferDate.getTime() > Date.now()) {
            setError("Gerçekleşmiş bir transferin geçerli tarih ve saatini girin. Gelecekteki tarih kabul edilmez.");
            return;
        }
        const note = manualRefundNote.trim();
        if (note.length > 1000) {
            setError("Admin açıklaması en fazla 1000 karakter olabilir.");
            return;
        }
        if (!manualRefundConfirmed) {
            setError("Banka transferinin gerçekten gerçekleştiğini doğrulamanız gerekiyor.");
            return;
        }
        const amount = Number(request.approvedRefundAmount);
        if (!Number.isFinite(amount) || amount <= 0) {
            setError("Onaylanan iade tutarı geçersiz.");
            return;
        }

        setError("");
        setConfirmation({
            kind: "manual",
            amount,
            bankTransferReference,
            transferredAtUtc: transferDate.toISOString(),
            adminNote: note || null,
        });
    }

    async function completeManualRefundNow(confirmed) {
        if (normalizeStatus(request?.status) !== 7 || order?.paymentMethod !== "BankTransfer") return;
        setIsSaving(true);
        setError("");
        setSuccess("");
        try {
            const result = await completeManualBankRefund(requestId, {
                bankTransferReference: confirmed.bankTransferReference,
                transferredAtUtc: confirmed.transferredAtUtc,
                adminNote: confirmed.adminNote,
            });
            const updated = result?.data ?? result;
            if (normalizeStatus(updated?.status) !== 8) {
                throw new Error("İade işleminin tamamlandığı API tarafından doğrulanmadı. Lütfen talep detaylarını yenileyin.");
            }
            setRequest((current) => ({ ...current, ...updated }));
            setManualRefundConfirmed(false);
            setSuccess("Banka üzerinden yapılan ücret iadesi tamamlandı olarak kaydedildi. Müşteri bilgilendirmesi Outbox üzerinden gerçekleştirilecek.");
            await load();
            onUpdated();
        } catch (err) {
            // Ağ hatası, sunucu işlemi tamamladıktan SONRA da meydana gelebilir.
            // Bu nedenle otomatik ikinci POST yok; once GET ile kesin durumu kontrol et.
            let latest = null;
            try {
                latest = extractDetail(await getOrderReturnRequestById(requestId));
                setRequest(latest);
            } catch { /* Ilk hatayi koru. */ }

            if (normalizeStatus(latest?.status) === 8 && latest?.manualRefundReference === confirmed.bankTransferReference) {
                setSuccess("İadenin tamamlandığı, kayıtlı banka referansı üzerinden doğrulandı.");
                setManualRefundConfirmed(false);
                onUpdated();
            } else {
                setError(`Manuel iadenin sonucu doğrulanamadı: ${getErrorMessage(err)}. Banka kaydını ve talebin güncel durumunu kontrol etmeden işlemi tekrar göndermeyin.`);
            }
        } finally {
            setIsSaving(false);
        }
    }

    function handleExecuteRefund() {
        if (isSaving || normalizeStatus(request?.status) !== 3 || refundLoadError || (refund && normalizeRefundStatus(refund.status) !== 1)) return;
        if (order?.paymentMethod !== "PayTR") {
            setError("Bu otomatik finansal iade işlemi yalnızca PayTR ile ödenen siparişler içindir. Havale/EFT iadesi manuel doğrulanmalıdır.");
            return;
        }
        if (!Number.isFinite(Number(request.approvedRefundAmount)) || Number(request.approvedRefundAmount) <= 0) {
            setError("Onaylanan finansal iade tutarı geçerli değil.");
            return;
        }
        setError("");
        setConfirmation({ kind: "refund", amount: Number(request.approvedRefundAmount) });
    }

    async function executeRefundNow() {
        setIsSaving(true);
        setError("");
        setSuccess("");
        try {
            const response = await executePaymentRefund(requestId);
            const result = response?.data ?? response;
            setRefund(result);
            const paymentStatus = normalizeRefundStatus(result?.status);
            if (paymentStatus === 4) {
                setError("Finansal iade başarısız görünüyor. Aynı iadeyi tekrar göndermeyin; sağlayıcı kaydını inceleyin.");
            } else {
                setSuccess(`Finansal iade kaydı: ${getRefundStatusText(result?.status)}. Kesin sonuç için doğrulama beklenir.`);
            }
            await load();
            onUpdated();
        } catch (err) {
            // Istek zaman asimina ugramis olabilir; PayTR'ye gonderilmis bir iade
            // otomatik tekrar gonderilmemelidir. Once mevcut durumu sorgula.
            setError(`Finansal iade sonucunda belirsizlik olabilir: ${getErrorMessage(err)}. Tekrar göndermeden önce kayıt ve PayTR durumunu kontrol edin.`);
            await load().catch(() => { });
        } finally {
            setIsSaving(false);
        }
    }

    function handleRetryRefund(event) {
        event.preventDefault();
        const refundId = String(refund?.id ?? refund?.paymentRefundId ?? "");
        if (isSaving || normalizeStatus(request?.status) !== 6 ||
            normalizeRefundStatus(refund?.status) !== 4 || !refundId || refundLoadError || order?.paymentMethod !== "PayTR") return;

        const approvalReason = retryApprovalReason.trim();
        const providerConfirmationReference = retryProviderReference.trim();
        if (approvalReason.length < 10 || approvalReason.length > 1000) {
            setError("Yeniden deneme gerekçesi 10-1000 karakter olmalı.");
            return;
        }
        if (providerConfirmationReference.length < 5 || providerConfirmationReference.length > 200) {
            setError("PayTR teyit referansı 5-200 karakter olmalı. Hata kodunu veya rastgele metin girmeyin.");
            return;
        }
        if (!retryProviderConfirmed) {
            setError("İlk denemede PayTR tarafında iade oluşmadığını teyit etmeden tekrar göndermeyin.");
            return;
        }
        setError("");
        setConfirmation({ kind: "retry", amount: Number(request.approvedRefundAmount), approvalReason, providerConfirmationReference });
    }

    async function executeRetryNow(approvalReason, providerConfirmationReference) {
        const refundId = String(refund?.id ?? refund?.paymentRefundId ?? "");
        setIsSaving(true);
        setError("");
        setSuccess("");
        try {
            const response = await executePaymentRefundRetry(refundId, approvalReason, providerConfirmationReference);
            const result = response?.data ?? response;
            setRefund(result);
            if (normalizeRefundStatus(result?.status) === 4) {
                setError("PayTR yeni iade girişimini de reddetti. Tekrar göndermeyin; hata kaydını inceleyin.");
            } else {
                setSuccess(`Yeni iade denemesi: ${getRefundStatusText(result?.status)}. Kesin sonuç doğrulanacak.`);
            }
            await load();
            onUpdated();
        } catch (err) {
            setError(`Retry sırasında sonuç belirsiz olabilir: ${getErrorMessage(err)}. İkinci kez göndermeden önce PayTR işlemini kontrol edin.`);
            await load().catch(() => { });
            // Pencere kapanıp yeniden açıldığında güncel finansal durumu GET'den tekrar oku.
            try {
                const latest = await getPaymentRefundByReturnRequest(requestId);
                setRefund(latest?.data ?? latest);
            } catch { /* mevcut uyarı korunur */ }
        } finally {
            setIsSaving(false);
        }
    }

    async function handleConfirmAction() {
        if (!confirmation || isSaving || confirmInFlight.current) return;

        const selected = confirmation;
        confirmInFlight.current = true;
        try {
            if (selected.kind === "cancelNoPayment") {
                await runAction(async () => {
                    const result = await approveOrderReturnRequest(requestId, 0, selected.note);
                    const updated = result?.data ?? result;
                    if (normalizeStatus(updated?.status) !== 9) {
                        throw new Error("İptal talebi iadesiz tamamlandı durumuna geçmedi. Sipariş durumunu kontrol edin.");
                    }
                }, "Ödeme alınmamış sipariş iptal edildi. Para iadesi oluşturulmadı; müşteri bildirimi Outbox'a eklendi.");
            } else if (selected.kind === "approve") {
                await runAction(
                    () => approveOrderReturnRequest(requestId, selected.amount, selected.note),
                    order?.paymentMethod === "BankTransfer"
                        ? "Talep onaylandı. Banka üzerinden manuel ücret iadesi bekleniyor."
                        : "Talep onaylandı. PayTR finansal iadesi henüz başlatılmadı.",
                );
            } else if (selected.kind === "reject") {
                await runAction(
                    () => rejectOrderReturnRequest(requestId, selected.reason),
                    "Talep reddedildi.",
                );
            } else if (selected.kind === "manual") {
                await completeManualRefundNow(selected);
            } else if (selected.kind === "refund") {
                await executeRefundNow();
            } else if (selected.kind === "retry") {
                await executeRetryNow(selected.approvalReason, selected.providerConfirmationReference);
            }
        } finally {
            confirmInFlight.current = false;
            setConfirmation(null);
        }
    }

    const status = normalizeStatus(request?.status);
    const refundPreview = request && order ? calculateRefundPreview(request, order) : null;
    const isUnpaidBankTransfer = order?.paymentMethod === "BankTransfer" &&
        ["Pending", "Failed"].includes(order?.paymentStatus);
    const canCancelWithoutRefund = status === 1 && isUnpaidBankTransfer &&
        normalizeType(request?.requestType) === 1 &&
        Boolean(refundPreview?.coversEntireOrder) &&
        order?.deliveryStatus === "Pending" &&
        !["Cancelled", "Completed"].includes(order?.orderStatus);
    const canApprovePositiveRefund = status === 1 && order?.paymentStatus === "Paid";

    return (
        <div role="presentation" className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-3 sm:p-5"
            onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving && !confirmation) onClose(); }}>
            <section role="dialog" aria-modal="true" aria-labelledby="return-request-modal-title"
                className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6">
                    <div className="min-w-0">
                        <h2 id="return-request-modal-title" className="text-lg font-bold text-text-primary">İade / İptal Talebi</h2>
                        <p className="mt-1 break-all text-xs text-text-secondary">{request?.requestNumber ?? requestId}</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={isSaving || Boolean(confirmation)} aria-label="Pencereyi kapat"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-background-soft disabled:opacity-50">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
                    {isLoading ? (
                        <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-text-secondary"><LoaderCircle className="h-5 w-5 animate-spin" /> Talep yükleniyor...</div>
                    ) : !request ? (
                        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error || "Talep bulunamadı."}</div>
                    ) : (
                        <>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(request.status)}`}>{getStatusLabel(request.status)}</span>
                                <span className="rounded-full border border-border px-3 py-1 text-xs font-medium text-text-secondary">{getTypeLabel(request.requestType)}</span>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-xl border border-border p-4"><p className="text-xs text-text-secondary">Talep edilen ürün toplamı</p><p className="mt-2 font-bold text-text-primary">{formatMoney(request.requestedItemsTotal)}</p></div>
                                <div className="rounded-xl border border-border p-4"><p className="text-xs text-text-secondary">İadeye dahil kargo</p><p className="mt-2 font-bold text-text-primary">{refundPreview ? formatMoney(refundPreview.refundableShipping) : "Hesaplanamadı"}</p></div>
                                <div className="rounded-xl border border-border p-4"><p className="text-xs text-text-secondary">Önerilen iade tutarı</p><p className="mt-2 font-bold text-primary">{refundPreview ? formatMoney(refundPreview.suggestedAmount) : "Hesaplanamadı"}</p></div>
                                <div className="rounded-xl border border-border p-4"><p className="text-xs text-text-secondary">Onaylanan iade tutarı</p><p className="mt-2 font-bold text-text-primary">{request.approvedRefundAmount == null ? "Henüz onaylanmadı" : formatMoney(request.approvedRefundAmount)}</p></div>
                            </div>
                            {orderLoadError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{orderLoadError} Onay işlemi güvenlik amacıyla kapatıldı.</div>}
                            {refundPreview && <p className="text-xs text-text-secondary">Sipariş toplamı: {formatMoney(order.grandTotal)} · {refundPreview.coversEntireOrder ? "Talep siparişin tüm ürünlerini kapsıyor; kargo iadeye dahil." : "Kısmi talep; kargo iadeye dahil değil."} Öneri nihai değildir; backend gerçekleşen ödeme ve önceki iadeleri ayrıca denetler.</p>}
                            <p className="text-xs text-text-secondary">İnceleme tarihi: {formatDate(request.reviewedDate)}</p>

                            <div className="rounded-xl border border-border p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <h3 className="text-sm font-bold text-text-primary">Sipariş bilgileri</h3>
                                    <Link href={`/siparisler/${request.orderId}`} className="text-sm font-semibold text-primary hover:underline">Siparişi Gör</Link>
                                </div>
                                <p className="mt-3 break-all text-xs text-text-secondary">Sipariş ID: {request.orderId}</p>
                                <p className="mt-1 break-all text-xs text-text-secondary">Müşteri ID: {request.userId ?? "Misafir siparişi"}</p>
                            </div>

                            <section>
                                <div className="mb-3 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /><h3 className="text-sm font-bold text-text-primary">Talep edilen ürünler</h3></div>
                                <div className="space-y-3">
                                    {(request.items ?? []).map((item) => (
                                        <article key={item.id} className="rounded-xl border border-border p-4">
                                            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                                                <div className="min-w-0"><p className="break-words text-sm font-bold text-text-primary">{item.productName}</p><p className="mt-1 text-xs text-text-secondary">Adet: {item.quantity} · Birim fiyat: {formatMoney(item.unitPrice)} · KDV: %{item.taxRate}</p></div>
                                                <p className="shrink-0 text-sm font-bold text-text-primary">{formatMoney(item.totalPrice)}</p>
                                            </div>
                                            <div className="mt-3 border-t border-border pt-3 text-sm"><p className="font-semibold text-text-primary">Neden: {item.reason}</p>{item.description && <p className="mt-1 whitespace-pre-wrap break-words text-text-secondary">{item.description}</p>}</div>
                                        </article>
                                    ))}
                                </div>
                            </section>

                            {request.adminNote && <div className="rounded-xl border border-border p-4"><p className="text-xs font-semibold text-text-secondary">Admin notu</p><p className="mt-2 whitespace-pre-wrap text-sm text-text-primary">{request.adminNote}</p></div>}

                            {error && <div role="alert" className="flex gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
                            {success && <div role="status" className="flex gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />{success}</div>}
                            {order?.paymentMethod === "BankTransfer" && status === 7 && (
                                <form onSubmit={handleManualRefundSubmit} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:p-5">
                                    <div className="flex items-start gap-3">
                                        <div className="rounded-lg bg-blue-100 p-2 text-blue-800"><Banknote className="h-5 w-5" /></div>
                                        <div>
                                            <h3 className="text-sm font-bold text-blue-950">Havale / EFT — Manuel Ücret İadesi</h3>
                                            <p className="mt-1 text-sm leading-6 text-blue-900">Onaylanan tutarı müşteriye banka üzerinden iade ettikten sonra transfer bilgilerini kaydedin. Bu form para transferi gerçekleştirmez.</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3">
                                        <span className="text-sm font-medium text-text-secondary">Onaylanan iade tutarı</span>
                                        <strong className="text-lg text-text-primary">{formatMoney(request.approvedRefundAmount)}</strong>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="min-w-0 space-y-1.5">
                                            <label htmlFor="manual-refund-reference" className="block text-xs font-bold text-text-primary">Banka işlem / dekont referansı <span className="text-red-600">*</span></label>
                                            <input id="manual-refund-reference" type="text" value={manualRefundReference} onChange={(event) => setManualRefundReference(event.target.value)} maxLength={100} required autoComplete="off" placeholder="Banka dekontundaki işlem referansı"
                                                className="h-11 w-full min-w-0 rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none focus:border-primary" />
                                        </div>
                                        <div className="min-w-0 space-y-1.5">
                                            <label htmlFor="manual-refund-date" className="block text-xs font-bold text-text-primary">Banka transfer tarihi ve saati <span className="text-red-600">*</span></label>
                                            <input id="manual-refund-date" type="datetime-local" value={manualRefundDateTime} onChange={(event) => setManualRefundDateTime(event.target.value)} required
                                                className="h-11 w-full min-w-0 rounded-lg border border-border bg-white px-3 text-sm text-text-primary outline-none focus:border-primary" />
                                            <p className="text-xs text-text-secondary">Yerel saatinizle girin; sistem UTC'ye dönüştürür.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label htmlFor="manual-refund-note" className="block text-xs font-bold text-text-primary">Admin açıklaması (isteğe bağlı)</label>
                                        <textarea id="manual-refund-note" value={manualRefundNote} onChange={(event) => setManualRefundNote(event.target.value)} maxLength={1000} rows={3}
                                            placeholder="Bankadan yapılan iadeyle ilgili ek not"
                                            className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-text-primary outline-none focus:border-primary" />
                                    </div>
                                    <label className="flex items-start gap-3 rounded-lg border border-blue-200 bg-white p-3 text-sm leading-6 text-text-primary">
                                        <input type="checkbox" checked={manualRefundConfirmed} onChange={(event) => setManualRefundConfirmed(event.target.checked)} className="mt-1.5 h-4 w-4 shrink-0" />
                                        <span>Banka hareketlerinden ücret iadesinin <strong>gerçekten gerçekleştiğini</strong> ve yukarıdaki referansın doğru olduğunu doğruladım. Bu işlem müşteriye tamamlandı bildirimi gönderir.</span>
                                    </label>
                                    <button type="submit" disabled={isSaving || !manualRefundConfirmed || !manualRefundReference.trim() || !manualRefundDateTime}
                                        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-green-700 px-5 text-sm font-bold text-white transition-colors hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                                        {isSaving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                        {isSaving ? "Kaydediliyor..." : "Ücret İadesini Tamamla"}
                                    </button>
                                </form>
                            )}

                            {(status === 8 && (order?.paymentMethod === "BankTransfer" || Boolean(request.manualRefundReference))) && (
                                <section className="space-y-3 rounded-xl border border-green-200 bg-green-50 p-4 sm:p-5">
                                    <div className="flex items-center gap-2 text-green-800"><CheckCircle2 className="h-5 w-5" /><h3 className="text-sm font-bold">Manuel Ücret İadesi Tamamlandı</h3></div>
                                    <p className="text-sm leading-6 text-green-900">Banka transferi, admin tarafından tamamlandı olarak kaydedildi. Gerçek transferin kanıtı banka/dekont kayıtlarıdır.</p>
                                    <dl className="grid gap-3 rounded-lg border border-green-200 bg-white p-4 text-sm sm:grid-cols-2">
                                        <div className="min-w-0"><dt className="text-xs text-text-secondary">İade edilen tutar</dt><dd className="mt-1 font-bold text-text-primary">{formatMoney(request.approvedRefundAmount)}</dd></div>
                                        <div className="min-w-0"><dt className="text-xs text-text-secondary">Transfer tarihi</dt><dd className="mt-1 font-semibold text-text-primary">{formatDate(request.manualRefundDateUtc)}</dd></div>
                                        <div className="min-w-0"><dt className="text-xs text-text-secondary">Banka referansı</dt><dd className="mt-1 break-all font-semibold text-text-primary">{request.manualRefundReference || "—"}</dd></div>
                                        <div className="min-w-0"><dt className="text-xs text-text-secondary">İşlemi tamamlayan admin ID</dt><dd className="mt-1 break-all font-semibold text-text-primary">{request.manualRefundCompletedByUserId || "—"}</dd></div>
                                        {request.manualRefundNote && <div className="min-w-0 sm:col-span-2"><dt className="text-xs text-text-secondary">Admin açıklaması</dt><dd className="mt-1 whitespace-pre-wrap break-words text-text-primary">{request.manualRefundNote}</dd></div>}
                                    </dl>
                                </section>
                            )}

                            {order?.paymentMethod === "PayTR" && (refund?.id || refund?.paymentRefundId) && <p className="break-all rounded-lg bg-background-soft p-3 text-xs text-text-secondary">Finansal iade ID: {refund.id ?? refund.paymentRefundId}</p>}
                            {order?.paymentMethod === "PayTR" && refund && <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                                <p className="font-bold">Finansal iade: {getRefundStatusText(refund.status)}</p>
                                <p className="mt-1">PayTR isteğinin kabul edilmesi, iadenin kesin olarak tamamlandığı anlamına gelmez.</p>
                                {normalizeStatus(request.status) === 8 && <p className="mt-1 font-semibold text-green-800">İade doğrulandı ve tamamlandı. Sonuç maili Outbox üzerinden gönderilecektir.</p>}
                            </div>}
                            {order?.paymentMethod === "PayTR" && refundLoadError && <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">Finansal iade kaydı okunamadı: {refundLoadError}</div>}
                            {order?.paymentMethod === "PayTR" && refundVerificationError && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">{refundVerificationError}</div>}

                            {(status === 3 || status === 7) && !order && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Ödeme yöntemi doğrulanamadı. İade işlemleri için önce sipariş bilgilerinin yüklenmesi gerekir.</div>
                            )}
                            {status === 1 && isUnpaidBankTransfer && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                                    Bu EFT/Havale siparişi için ödeme alınmış görünmüyor. Pozitif tutarlı para iadesi onaylanamaz.
                                    {canCancelWithoutRefund
                                        ? " Talep siparişin tamamını kapsadığı için para iadesiz iptal işlemini kullanabilirsiniz."
                                        : " Para iadesiz iptal yalnızca sevkiyat başlamadan önce, siparişin tüm ürün ve adetlerini kapsayan iptal talepleri için kullanılabilir."}
                                </div>
                            )}
                            {status === 1 && !isUnpaidBankTransfer && order?.paymentStatus !== "Paid" && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                                    Ödeme doğrulanmadığı için finansal iade onayı verilemez. Önce siparişin ödeme durumunu kontrol edin.
                                </div>
                            )}
                            {status === 1 && canCancelWithoutRefund && (
                                <form onSubmit={handleCancellationWithoutRefund} className="space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                                    <h3 className="text-sm font-bold text-amber-950">Ödeme Almadan Siparişi İptal Et</h3>
                                    <p className="text-sm leading-6 text-amber-900">
                                        Siparişin bütün ürünleri iptal edilir. İade tutarı 0,00 TL olacak; PayTR veya banka iadesi oluşturulmayacak.
                                        İşlemden önce banka hesabınıza ödeme ulaşmadığını doğrulayın.
                                    </p>
                                    <label htmlFor="unpaid-cancel-note" className="block text-xs font-bold text-amber-950">Admin notu (isteğe bağlı)</label>
                                    <textarea id="unpaid-cancel-note" rows={3} maxLength={1000} value={unpaidCancellationNote}
                                        onChange={(event) => setUnpaidCancellationNote(event.target.value)}
                                        placeholder="Banka tahsilatı kontrol edildi, ödeme alınmadı."
                                        className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-text-primary" />
                                    <label className="flex items-start gap-3 text-sm font-medium leading-6 text-amber-950">
                                        <input type="checkbox" checked={unpaidCancellationConfirmed}
                                            onChange={(event) => setUnpaidCancellationConfirmed(event.target.checked)} className="mt-1.5 h-4 w-4 shrink-0" />
                                        Bu sipariş için EFT/Havale ödemesinin hesabımıza geçmediğini kontrol ettim.
                                    </label>
                                    <button type="submit" disabled={isSaving || !unpaidCancellationConfirmed}
                                        className="h-11 w-full rounded-lg bg-amber-700 px-4 text-sm font-bold text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
                                        {isSaving ? "İşleniyor..." : "Para İadesi Yapmadan İptali Onayla"}
                                    </button>
                                </form>
                            )}
                            {status === 1 && (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    {canApprovePositiveRefund && <form onSubmit={handleApprove} className="space-y-3 rounded-xl border border-green-200 p-4">
                                        <h3 className="text-sm font-bold text-green-800">Talebi Onayla</h3>
                                        <label className="block text-xs font-semibold text-text-secondary" htmlFor="refund-approved-amount">Onaylanan iade tutarı (TL)</label>
                                        <input id="refund-approved-amount" inputMode="decimal" value={approvedAmount} onChange={(event) => setApprovedAmount(event.target.value)} required
                                            className="h-10 w-full rounded-lg border border-border px-3 text-sm" placeholder="Örn: 500,00" />
                                        <label className="block text-xs font-semibold text-text-secondary" htmlFor="refund-admin-note">Admin notu (isteğe bağlı)</label>
                                        <textarea id="refund-admin-note" value={adminNote} onChange={(event) => setAdminNote(event.target.value)} rows={3} maxLength={1000}
                                            className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Değerlendirme notu" />
                                        <button disabled={isSaving || !refundPreview || Boolean(orderLoadError)} type="submit" className="h-10 w-full rounded-lg bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-50">{isSaving ? "İşleniyor..." : "Talebi Onayla"}</button>
                                    </form>}
                                    <form onSubmit={handleReject} className="space-y-3 rounded-xl border border-red-200 p-4">
                                        <h3 className="text-sm font-bold text-red-700">Talebi Reddet</h3>
                                        <label className="block text-xs font-semibold text-text-secondary" htmlFor="refund-reject-reason">Ret gerekçesi</label>
                                        <textarea id="refund-reject-reason" value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} rows={4} required maxLength={1000}
                                            className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Müşteriye açıklanabilecek gerekçeyi yazın" />
                                        <button disabled={isSaving} type="submit" className="h-10 w-full rounded-lg border border-red-600 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">{isSaving ? "İşleniyor..." : "Talebi Reddet"}</button>
                                    </form>
                                </div>
                            )}

                            {status === 9 && (
                                <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-950">
                                    <p className="font-bold">Sipariş para iadesi yapılmadan iptal edildi.</p>
                                    <p className="mt-1">Ödeme alınmadığından ücret iadesi oluşturulmadı. İptal işlemini yapan admin ve notu talep kayıtlarında saklandı.</p>
                                    {request.adminNote && <p className="mt-2 whitespace-pre-wrap break-words">Admin notu: {request.adminNote}</p>}
                                </div>
                            )}
                            {status === 3 && order?.paymentMethod === "PayTR" && (
                                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                                    <h3 className="font-bold text-blue-900">Finansal iadeyi gerçekleştir</h3>
                                    <p className="mt-2 text-sm text-blue-800">Önce finansal kayıt güvenle hazırlanır; ardından PayTR iade API'si çağrılır. Sonuç kesinleşene kadar durum doğrulanır.</p>
                                    {order?.paymentMethod === "PayTR" ? (
                                        <button type="button" disabled={isSaving || refundLoadError !== "" || (refund && normalizeRefundStatus(refund.status) !== 1)} onClick={handleExecuteRefund}
                                            className="mt-4 h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">
                                            {isSaving ? "İşlem başlatılıyor..." : "Finansal İadeyi Gerçekleştir"}
                                        </button>
                                    ) : <p className="mt-3 text-sm font-semibold text-blue-900">Havale/EFT için otomatik PayTR iadesi yapılamaz; banka transferi ayrıca doğrulanmalıdır.</p>}
                                </div>
                            )}

                            {status === 6 && normalizeRefundStatus(refund?.status) === 4 && order?.paymentMethod === "PayTR" && (
                                <form onSubmit={handleRetryRefund} className="space-y-4 rounded-xl border border-amber-300 bg-amber-50 p-4">
                                    <h3 className="font-bold text-amber-950">Finansal iadeyi yeniden dene</h3>
                                    <p className="text-sm leading-6 text-amber-900">
                                        Yalnızca PayTR'nin önceki iadeyi oluşturmadığını doğruladıysanız kullanın.
                                        İlk girişim kayıtları silinmez; yeni referansla yeni bir deneme başlatılır.
                                    </p>
                                    <div className="space-y-1">
                                        <label htmlFor="refund-retry-reason" className="block text-xs font-bold text-amber-950">Admin yeniden deneme gerekçesi</label>
                                        <textarea id="refund-retry-reason" value={retryApprovalReason} onChange={(event) => setRetryApprovalReason(event.target.value)}
                                            maxLength={1000} rows={3} required placeholder="Önceki 001 hatası giderildi, mağaza ayarları doğrulandı..."
                                            className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-text-primary" />
                                    </div>
                                    <div className="space-y-1">
                                        <label htmlFor="refund-retry-reference" className="block text-xs font-bold text-amber-950">PayTR teyit / destek kaydı referansı</label>
                                        <input id="refund-retry-reference" value={retryProviderReference} onChange={(event) => setRetryProviderReference(event.target.value)}
                                            maxLength={200} required placeholder="PayTR'den alınan gerçek teyit referansı"
                                            className="h-11 w-full rounded-lg border border-amber-300 bg-white px-3 text-sm text-text-primary" />
                                    </div>
                                    <label className="flex items-start gap-3 text-sm font-medium leading-6 text-amber-950">
                                        <input type="checkbox" checked={retryProviderConfirmed} onChange={(event) => setRetryProviderConfirmed(event.target.checked)}
                                            className="mt-1.5 h-4 w-4 shrink-0" />
                                        İlk iadenin PayTR'de gerçekleşmediğini sağlayıcı kayıtlarından doğruladım.
                                    </label>
                                    <button type="submit" disabled={isSaving || !retryProviderConfirmed || Boolean(refundLoadError)}
                                        className="h-11 rounded-lg bg-primary px-5 text-sm font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50">
                                        {isSaving ? "İşlem başlatılıyor..." : "Finansal İadeyi Yeniden Dene"}
                                    </button>
                                </form>
                            )}

                            {order?.paymentMethod === "PayTR" && (status === 4 || status === 5 || status === 6) && (
                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                                    Finansal iade süreci devam ediyor veya ayrıca inceleme gerektiriyor. Bu ekran yeni bir iade göndermeden mevcut PayTR işlemini sorgular. Durum doğrulaması pencere açıkken periyodik yürütülür.
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex shrink-0 justify-end border-t border-border bg-white px-4 py-3 sm:px-6">
                    <button type="button" onClick={onClose} disabled={isSaving || Boolean(confirmation)} className="h-10 rounded-lg border border-border px-5 text-sm font-semibold text-text-primary hover:bg-background-soft disabled:opacity-50">Kapat</button>
                </div>
            </section>
            {confirmation && (
                <ActionConfirmationModal
                    confirmation={confirmation}
                    requestNumber={request?.requestNumber ?? requestId}
                    isSaving={isSaving}
                    onCancel={() => { if (!isSaving) setConfirmation(null); }}
                    onConfirm={handleConfirmAction}
                />
            )}
        </div>
    );
}
