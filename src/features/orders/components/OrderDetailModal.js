"use client";
import { useEffect, useState } from "react";
import {
    FileText,
    LoaderCircle,
    X,
} from "lucide-react";
import {
    DeliveryStatusBadge,
    OrderStatusBadge,
    PaymentStatusBadge,
} from "@/features/orders/components/OrderStatusBadge";

import {
    DELIVERY_STATUS_LABELS,
    ORDER_FREE_SHIPPING_THRESHOLD,
    ORDER_STATUS_LABELS,
    PAYMENT_STATUS_LABELS,
} from "@/features/orders/constants/orderConstants";

import OrderOperationConfirmModal from "@/features/orders/components/OrderOperationConfirmModal";

import { getShippingMethodById } from "@/features/shippingMethods/services/shippingMethodService";

function formatPrice(value) {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency: "TRY",
    }).format(value ?? 0);
}

function formatOrderDate(value) {
    if (!value) {
        return "—";
    }

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value));
}

function getFullName(address) {
    const firstName = address?.firstName?.trim() || "";
    const lastName = address?.lastName?.trim() || "";

    return `${firstName} ${lastName}`.trim() || "—";
}

function getAddressLines(address) {
    if (!address) {
        return [];
    }

    return [
        address.addressLine1,
        address.addressLine2,
        [address.district, address.city].filter(Boolean).join(", "),
        address.postalCode,
        address.country,
    ].filter(Boolean);
}

function getPaymentMethodLabel(paymentMethod) {
    switch (paymentMethod) {
        case "BankTransfer":
            return "Havale / EFT";
        case "CreditCard":
            return "Kredi Kartı";
        case "CashOnDelivery":
            return "Kapıda Ödeme";
        default:
            return paymentMethod || "—";
    }
}

function getInvoiceTypeLabel(invoiceType) {
    switch (invoiceType) {
        case "Individual":
            return "Bireysel";
        case "Corporate":
            return "Kurumsal";
        default:
            return "—";
    }
}

function getOrderStatusLabel(status) {
    return ORDER_STATUS_LABELS[status] || status || "—";
}

function getPaymentStatusLabel(status) {
    return PAYMENT_STATUS_LABELS[status] || status || "—";
}

function getDeliveryStatusLabel(status) {
    return DELIVERY_STATUS_LABELS[status] || status || "—";
}

function canConfirmOrder(order) {
    return order.orderStatus === "Pending";
}

function canPrepareOrder(order) {
    return order.orderStatus === "Confirmed";
}

function canCancelOrder(order) {
    return (
        order.orderStatus === "Pending" ||
        order.orderStatus === "Confirmed" ||
        order.orderStatus === "Preparing"
    );
}

function canMarkPaymentAsPaid(order) {
    return (
        order.orderStatus !== "Cancelled" &&
        order.orderStatus !== "Completed" &&
        order.paymentStatus !== "Paid"
    );
}

function canMarkPaymentAsFailed(order) {
    return (
        order.orderStatus !== "Cancelled" &&
        order.orderStatus !== "Completed" &&
        order.paymentStatus === "Pending"
    );
}

function canShipOrder(order) {
    return (
        order.orderStatus === "Preparing" &&
        order.paymentStatus === "Paid" &&
        order.deliveryStatus === "Pending"
    );
}

function canDeliverOrder(order) {
    return (
        order.orderStatus === "Preparing" &&
        order.deliveryStatus === "Shipped"
    );
}

function canCompleteOrder(order) {
    return (
        order.orderStatus === "Preparing" &&
        order.paymentStatus === "Paid" &&
        order.deliveryStatus === "Delivered"
    );
}

export default function OrderDetailModal({
    order,
    onClose,
    onPrint,
    onShowDetail,
    isPrinting = false,
    operationLoading = false,
    onOperation
}) {

    const [selectedOperation, setSelectedOperation] = useState(null);
    const [shippingMethod, setShippingMethod] = useState(null);

    useEffect(() => {
        async function loadShippingMethod() {
            if (!order?.shippingMethodId) {
                setShippingMethod(null);
                return;
            }

            try {
                const response = await getShippingMethodById(
                    order.shippingMethodId,
                );

                setShippingMethod(response.data);
            } catch {
                setShippingMethod(null);
            }
        }

        loadShippingMethod();
    }, [order?.shippingMethodId]);

    if (!order) {
        return null;
    }

    const shippingAddress = order.shippingAddress;
    const billingAddress = order.billingAddress;

    const shippingAddressLines = getAddressLines(shippingAddress);
    const billingAddressLines = getAddressLines(billingAddress);

    const isFreeShipping = order.productsTotal >= ORDER_FREE_SHIPPING_THRESHOLD;

    const shippingPaymentType = isFreeShipping
        ? "Gönderici Ödemeli"
        : "Alıcı Ödemeli";

    const shippingCost = isFreeShipping
        ? shippingMethod?.price ?? 0
        : order.shippingCost;

    async function handleOperationConfirm() {
        if (!selectedOperation) {
            return;
        }

        const isSuccessful = await onOperation(selectedOperation);

        if (isSuccessful) {
            setSelectedOperation(null);
        }
    }

    return (
        <>
            <div
                className="orders-page fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="order-detail-modal-title"
            >
                <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4 sm:px-6">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3">
                                <h2
                                    id="order-detail-modal-title"
                                    className="text-lg font-bold text-text-primary"
                                >
                                    {order.orderNumber}
                                </h2>

                                <OrderStatusBadge status={order.orderStatus} />
                            </div>

                            <p className="mt-1 text-sm text-text-secondary">
                                Sipariş detayları
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-soft hover:text-text-primary"
                            aria-label="Kapat"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                        <div className="space-y-6 p-5 sm:p-6">
                            <div className="grid gap-4 lg:grid-cols-3">
                                <div className="rounded-xl border border-border bg-background-soft p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Sipariş Durumu
                                    </p>

                                    <div className="mt-3">
                                        <OrderStatusBadge
                                            status={order.orderStatus}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border bg-background-soft p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Ödeme Durumu
                                    </p>

                                    <div className="mt-3">
                                        <PaymentStatusBadge
                                            status={order.paymentStatus}
                                        />
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border bg-background-soft p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                        Teslimat Durumu
                                    </p>

                                    <div className="mt-3">
                                        <DeliveryStatusBadge
                                            status={order.deliveryStatus}
                                        />
                                    </div>
                                </div>
                            </div>

                            <section>
                                <h3 className="mb-3 text-sm font-bold text-text-primary">
                                    Sipariş Bilgileri
                                </h3>

                                <div className="grid gap-1 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-5">
                                    <div>
                                        <p className="text-xs text-text-secondary">
                                            Sipariş No
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-text-primary">
                                            {order.orderNumber}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-text-secondary">
                                            Oluşturulma Tarihi
                                        </p>
                                        <p className="mt-1 break-all text-sm font-medium text-text-primary">
                                            {formatOrderDate(order.audit?.createdDate)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-text-secondary">
                                            Ödeme Yöntemi
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-text-primary">
                                            {getPaymentMethodLabel(
                                                order.paymentMethod,
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-text-secondary">
                                            Kargo Firması
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-text-primary">
                                            {shippingMethod?.name || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-text-secondary">
                                            Kargo Durumu
                                        </p>
                                        <p
                                            className={`mt-1 text-sm font-medium ${order.shippingCost === 0
                                                    ? "text-red-700"
                                                    : "text-green-700"
                                                }`}
                                        >
                                            {order.shippingCost === 0
                                                ? "Ücretsiz Kargo"
                                                : "Ücretli Kargo"}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="mb-3 text-sm font-bold text-text-primary">
                                    Müşteri Bilgileri
                                </h3>

                                <div className="grid gap-4 rounded-xl border border-border p-4 sm:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <p className="text-xs text-text-secondary">
                                            Ad Soyad
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-text-primary">
                                            {getFullName(shippingAddress)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-text-secondary">
                                            E-posta
                                        </p>
                                        <p className="mt-1 break-all text-sm font-medium text-text-primary">
                                            {shippingAddress?.email || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-text-secondary">
                                            Telefon
                                        </p>
                                        <p className="mt-1 text-sm font-medium text-text-primary">
                                            {shippingAddress?.phoneNumber || "—"}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-text-secondary">
                                            Kullanıcı ID
                                        </p>
                                        <p className="mt-1 text-xs font-medium text-text-primary">
                                            {order.userId || "—"}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <h3 className="mb-3 text-sm font-bold text-text-primary">
                                    Adresler
                                </h3>

                                <div className="grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-xl border border-border p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <h4 className="text-sm font-semibold text-text-primary">
                                                Teslimat Adresi
                                            </h4>
                                        </div>

                                        <div className="mt-3 text-sm leading-6 text-text-secondary">
                                            <p className="font-semibold text-text-primary">
                                                {getFullName(shippingAddress)}
                                            </p>

                                            {shippingAddressLines.map(
                                                (line, index) => (
                                                    <p key={`${line}-${index}`}>
                                                        {line}
                                                    </p>
                                                ),
                                            )}

                                            {shippingAddress?.phoneNumber && (
                                                <p className="mt-2">
                                                    Telefon:{" "}
                                                    {shippingAddress.phoneNumber}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-border p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <h4 className="text-sm font-semibold text-text-primary">
                                                Fatura Adresi
                                            </h4>

                                            {order.billingAddressSameAsShippingAddress && (
                                                <span className="text-xs font-medium text-text-secondary">
                                                    Teslimat adresi ile aynı
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-3 text-sm leading-6 text-text-secondary">
                                            <p className="font-semibold text-text-primary">
                                                {getFullName(billingAddress)}
                                            </p>

                                            {billingAddressLines.map(
                                                (line, index) => (
                                                    <p key={`${line}-${index}`}>
                                                        {line}
                                                    </p>
                                                ),
                                            )}

                                            {billingAddress?.phoneNumber && (
                                                <p className="mt-2">
                                                    Telefon:{" "}
                                                    {billingAddress.phoneNumber}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <div className="mb-3 flex items-center justify-between gap-4">
                                    <h3 className="text-sm font-bold text-text-primary">
                                        Sipariş Ürünleri
                                    </h3>

                                    <span className="text-sm text-text-secondary">
                                        {order.items?.length ?? 0} ürün
                                    </span>
                                </div>

                                <div className="overflow-x-auto rounded-xl border border-border">
                                    <table className="min-w-[720px] w-full">
                                        <thead>
                                            <tr className="border-b border-border bg-background-soft text-left">
                                                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                                    Ürün
                                                </th>
                                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                                    Adet
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                                    Birim Fiyat
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                                    KDV
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                                    Toplam
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {(order.items ?? []).map((item) => (
                                                <tr
                                                    key={item.orderItemId}
                                                    className="border-b border-border last:border-b-0"
                                                >
                                                    <td className="px-4 py-4">
                                                        <p className="max-w-md font-medium text-text-primary">
                                                            {item.productName}
                                                        </p>

                                                        <p className="mt-1 text-xs text-text-secondary">
                                                            Ürün ID:{" "}
                                                            {item.productId}
                                                        </p>
                                                    </td>

                                                    <td className="px-4 py-4 text-center text-sm text-text-primary">
                                                        {item.quantity}
                                                    </td>

                                                    <td className="px-4 py-4 text-right text-sm text-text-primary">
                                                        {formatPrice(
                                                            item.unitPrice,
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4 text-right text-sm text-text-primary">
                                                        %{item.taxRate}
                                                    </td>

                                                    <td className="px-4 py-4 text-right text-sm font-semibold text-text-primary">
                                                        {formatPrice(
                                                            item.totalPrice,
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <section>
                                    <h3 className="mb-3 text-sm font-bold text-text-primary">
                                        Fatura Bilgileri
                                    </h3>

                                    <div className="rounded-xl border border-border p-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <p className="text-xs text-text-secondary">
                                                    Fatura Tipi
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-text-primary">
                                                    {getInvoiceTypeLabel(
                                                        order.billingInfo
                                                            ?.invoiceType,
                                                    )}
                                                </p>
                                            </div>

                                            <div>
                                                <p className="text-xs text-text-secondary">
                                                    E-Fatura
                                                </p>
                                                <p className="mt-1 text-sm font-medium text-text-primary">
                                                    {order.billingInfo?.isEInvoice
                                                        ? "Evet"
                                                        : "Hayır"}
                                                </p>
                                            </div>

                                            {order.billingInfo?.companyName && (
                                                <div>
                                                    <p className="text-xs text-text-secondary">
                                                        Firma
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-text-primary">
                                                        {
                                                            order.billingInfo
                                                                .companyName
                                                        }
                                                    </p>
                                                </div>
                                            )}

                                            {order.billingInfo
                                                ?.taxOrIdentityNumber && (
                                                    <div>
                                                        <p className="text-xs text-text-secondary">
                                                            Vergi / T.C. Kimlik No
                                                        </p>
                                                        <p className="mt-1 text-sm font-medium text-text-primary">
                                                            {
                                                                order.billingInfo
                                                                    .taxOrIdentityNumber
                                                            }
                                                        </p>
                                                    </div>
                                                )}

                                            {order.billingInfo?.taxOffice && (
                                                <div>
                                                    <p className="text-xs text-text-secondary">
                                                        Vergi Dairesi
                                                    </p>
                                                    <p className="mt-1 text-sm font-medium text-text-primary">
                                                        {
                                                            order.billingInfo
                                                                .taxOffice
                                                        }
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section>
                                    <h3 className="mb-3 text-sm font-bold text-text-primary">
                                        Sipariş Özeti
                                    </h3>

                                    <div className="rounded-xl border border-border p-4">
                                        <div className="space-y-3 text-sm">
                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-text-secondary">
                                                    Ürünler
                                                </span>
                                                <span className="font-medium text-text-primary">
                                                    {formatPrice(
                                                        order.productsTotal,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-text-secondary">
                                                    Ara Toplam
                                                </span>
                                                <span className="font-medium text-text-primary">
                                                    {formatPrice(
                                                        order.subTotal,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-text-secondary">
                                                    KDV
                                                </span>
                                                <span className="font-medium text-text-primary">
                                                    {formatPrice(
                                                        order.taxAmount,
                                                    )}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-text-secondary">
                                                    Kargo Ödemesi
                                                </span>
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isFreeShipping
                                                        ? "bg-red-50 text-red-700"
                                                        : "bg-green-50 text-green-700"
                                                        }`}
                                                >
                                                    {shippingPaymentType}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between gap-4">
                                                <span className="text-text-secondary">
                                                    Kargo Ücreti
                                                </span>
                                                <span className="font-medium text-text-primary">
                                                    {isFreeShipping ? "-" : "+"}
                                                    {formatPrice(shippingCost)}
                                                </span>
                                            </div>

                                            <div className="border-t border-border pt-3">
                                                <div className="flex items-center justify-between gap-4">
                                                    <span className="font-bold text-text-primary">
                                                        Genel Toplam
                                                    </span>
                                                    <span className="text-lg font-bold text-primary">
                                                        {formatPrice(
                                                            order.grandTotal,
                                                        )}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {order.orderNotes && (
                                <section>
                                    <h3 className="mb-3 text-sm font-bold text-text-primary">
                                        Sipariş Notu
                                    </h3>

                                    <div className="rounded-xl border border-border bg-background-soft p-4 text-sm leading-6 text-text-secondary">
                                        {order.orderNotes}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-4 border-t border-border bg-background-soft px-5 py-4 sm:px-6">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                Sipariş İşlemleri
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                                {canConfirmOrder(order) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOperation("confirm")}
                                        disabled={operationLoading}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {operationLoading && (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        )}
                                        Siparişi Onayla
                                    </button>
                                )}

                                {canPrepareOrder(order) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOperation("prepare")}
                                        disabled={operationLoading}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {operationLoading && (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        )}
                                        Hazırlamaya Başla
                                    </button>
                                )}

                                {canMarkPaymentAsPaid(order) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOperation("paymentPaid")}
                                        disabled={operationLoading}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-green-600 px-4 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {operationLoading && (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        )}
                                        Ödeme Alındı
                                    </button>
                                )}

                                {canMarkPaymentAsFailed(order) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOperation("paymentFailed")}
                                        disabled={operationLoading}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-600 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {operationLoading && (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        )}
                                        Ödeme Başarısız
                                    </button>
                                )}

                                {canShipOrder(order) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOperation("ship")}
                                        disabled={operationLoading}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {operationLoading && (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        )}
                                        Kargoya Ver
                                    </button>
                                )}

                                {canDeliverOrder(order) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOperation("deliver")}
                                        disabled={operationLoading}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {operationLoading && (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        )}
                                        Teslim Edildi
                                    </button>
                                )}

                                {canCompleteOrder(order) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOperation("complete")}
                                        disabled={operationLoading}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {operationLoading && (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        )}
                                        Siparişi Tamamla
                                    </button>
                                )}

                                {canCancelOrder(order) && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedOperation("cancel")}
                                        disabled={operationLoading}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-red-600 px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {operationLoading && (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        )}
                                        Siparişi İptal Et
                                    </button>
                                )}

                                {!canConfirmOrder(order) &&
                                    !canPrepareOrder(order) &&
                                    !canMarkPaymentAsPaid(order) &&
                                    !canMarkPaymentAsFailed(order) &&
                                    !canShipOrder(order) &&
                                    !canDeliverOrder(order) &&
                                    !canCompleteOrder(order) &&
                                    !canCancelOrder(order) && (
                                        <p className="text-sm text-text-secondary">
                                            Bu sipariş için gerçekleştirilebilecek başka bir işlem bulunmuyor.
                                        </p>
                                    )}
                            </div>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-border bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-background-soft"
                        >
                            Kapat
                        </button>

                        <button
                            type="button"
                            onClick={onPrint}
                            disabled={isPrinting}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-background-soft disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {isPrinting ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <FileText className="h-4 w-4" />
                            )}

                            Siparişi Yazdır
                        </button>

                        <button
                            type="button"
                            onClick={onShowDetail}
                            className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                        >
                            Sipariş Detayını Göster
                        </button>
                    </div>
                </div>
                {selectedOperation && (
                    <OrderOperationConfirmModal
                        order={order}
                        operation={selectedOperation}
                        onClose={() => setSelectedOperation(null)}
                        onConfirm={handleOperationConfirm}
                        isLoading={operationLoading}
                    />
                )}
            </div>

            <div className="order-print-document">
                <div className="print-header">
                    <div>
                        <div className="print-logo">NalburJet</div>
                        <div className="print-subtitle">
                            Yapı Market &amp; Nalbur
                        </div>
                    </div>

                    <div className="print-document-title">
                        <h1>SİPARİŞ DETAYI</h1>
                        <p>{order.orderNumber}</p>
                        <p>
                            {formatOrderDate(order.audit?.createdDate)}
                        </p>
                    </div>
                </div>

                <div className="print-divider" />

                <section className="print-section">
                    <h2>Müşteri Bilgileri</h2>

                    <div className="print-info-grid">
                        <div>
                            <span>Ad Soyad</span>
                            <strong>{getFullName(shippingAddress)}</strong>
                        </div>

                        <div>
                            <span>E-posta</span>
                            <strong>{shippingAddress?.email || "—"}</strong>
                        </div>

                        <div>
                            <span>Telefon</span>
                            <strong>
                                {shippingAddress?.phoneNumber || "—"}
                            </strong>
                        </div>

                        <div>
                            <span>Ödeme Yöntemi</span>
                            <strong>
                                {getPaymentMethodLabel(order.paymentMethod)}
                            </strong>
                        </div>

                        <div>
                            <span>Sipariş Durumu</span>
                            <strong>{getOrderStatusLabel(order.orderStatus)}</strong>
                        </div>

                        <div>
                            <span>Ödeme Durumu</span>
                            <strong>{getPaymentStatusLabel(order.paymentStatus)}</strong>
                        </div>

                        <div>
                            <span>Teslimat Durumu</span>
                            <strong>{getDeliveryStatusLabel(order.deliveryStatus)}</strong>
                        </div>

                        <div>
                            <span>Fatura Tipi</span>
                            <strong>
                                {getInvoiceTypeLabel(
                                    order.billingInfo?.invoiceType,
                                )}
                            </strong>
                        </div>
                    </div>
                </section>

                <div className="print-address-grid">
                    <section className="print-section">
                        <h2>Teslimat Adresi</h2>

                        <div className="print-info-box">
                            <p className="print-strong">
                                {getFullName(shippingAddress)}
                            </p>

                            {shippingAddressLines.map((line, index) => (
                                <p key={`shipping-${line}-${index}`}>
                                    {line}
                                </p>
                            ))}

                            {shippingAddress?.phoneNumber && (
                                <p className="print-contact">
                                    <span>Telefon:</span>{" "}
                                    {shippingAddress.phoneNumber}
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="print-section">
                        <h2>Fatura Adresi</h2>

                        <div className="print-info-box">
                            <p className="print-strong">
                                {getFullName(billingAddress)}
                            </p>

                            {billingAddressLines.map((line, index) => (
                                <p key={`billing-${line}-${index}`}>
                                    {line}
                                </p>
                            ))}

                            {billingAddress?.phoneNumber && (
                                <p className="print-contact">
                                    <span>Telefon:</span>{" "}
                                    {billingAddress.phoneNumber}
                                </p>
                            )}
                        </div>
                    </section>
                </div>

                <section className="print-section">
                    <h2>Sipariş Ürünleri</h2>

                    <table className="print-products-table">
                        <thead>
                            <tr>
                                <th>Ürün</th>
                                <th>Ürün ID</th>
                                <th className="print-align-center">
                                    Adet
                                </th>
                                <th className="print-align-right">
                                    Birim Fiyat
                                </th>
                                <th className="print-align-right">
                                    KDV
                                </th>
                                <th className="print-align-right">
                                    Toplam
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {(order.items ?? []).map((item) => (
                                <tr key={`print-${item.orderItemId}`}>
                                    <td>{item.productName}</td>
                                    <td>{item.productId}</td>
                                    <td className="print-align-center">
                                        {item.quantity}
                                    </td>
                                    <td className="print-align-right">
                                        {formatPrice(item.unitPrice)}
                                    </td>
                                    <td className="print-align-right">
                                        %{item.taxRate}
                                    </td>
                                    <td className="print-align-right">
                                        {formatPrice(item.totalPrice)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <div className="print-total-section">
                    <div className="print-totals">
                        <div>
                            <span>Ürünler</span>
                            <strong>
                                {formatPrice(order.productsTotal)}
                            </strong>
                        </div>

                        <div>
                            <span>Ara Toplam</span>
                            <strong>
                                {formatPrice(order.subTotal)}
                            </strong>
                        </div>

                        <div>
                            <span>KDV</span>
                            <strong>
                                {formatPrice(order.taxAmount)}
                            </strong>
                        </div>

                        <div>
                            <span>Kargo Ödemesi</span>
                            <strong>
                                {isFreeShipping
                                    ? "Gönderici Ödemeli"
                                    : "Alıcı Ödemeli"}
                            </strong>
                        </div>

                        <div>
                            <span>Kargo Ücreti</span>
                            <strong>
                                {isFreeShipping ? "-" : "+"}
                                {formatPrice(
                                    isFreeShipping
                                        ? shippingMethod?.price ?? 0
                                        : order.shippingCost,
                                )}
                            </strong>
                        </div>

                        <div className="print-grand-total">
                            <span>Genel Toplam</span>
                            <strong>
                                {formatPrice(order.grandTotal)}
                            </strong>
                        </div>
                    </div>
                </div>

                {order.billingInfo && (
                    <section className="print-section">
                        <h2>Fatura Bilgileri</h2>

                        <div className="print-info-grid">
                            <div>
                                <span>Fatura Tipi</span>
                                <strong>
                                    {getInvoiceTypeLabel(
                                        order.billingInfo.invoiceType,
                                    )}
                                </strong>
                            </div>

                            <div>
                                <span>E-Fatura</span>
                                <strong>
                                    {order.billingInfo.isEInvoice
                                        ? "Evet"
                                        : "Hayır"}
                                </strong>
                            </div>

                            {order.billingInfo.companyName && (
                                <div>
                                    <span>Firma</span>
                                    <strong>
                                        {order.billingInfo.companyName}
                                    </strong>
                                </div>
                            )}

                            {order.billingInfo.taxOrIdentityNumber && (
                                <div>
                                    <span>Vergi / T.C. Kimlik No</span>
                                    <strong>
                                        {
                                            order.billingInfo
                                                .taxOrIdentityNumber
                                        }
                                    </strong>
                                </div>
                            )}

                            {order.billingInfo.taxOffice && (
                                <div>
                                    <span>Vergi Dairesi</span>
                                    <strong>
                                        {order.billingInfo.taxOffice}
                                    </strong>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {order.orderNotes && (
                    <section className="print-section">
                        <h2>Sipariş Notu</h2>

                        <div className="print-note">
                            {order.orderNotes}
                        </div>
                    </section>
                )}
            </div>
        </>
    );
}