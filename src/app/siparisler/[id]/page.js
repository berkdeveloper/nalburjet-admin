"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    FileText,
    LoaderCircle,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { useAuth } from "@/features/auth/context/AuthContext";
import OrderOperationConfirmModal from "@/features/orders/components/OrderOperationConfirmModal";
import {
    DeliveryStatusBadge,
    OrderStatusBadge,
    PaymentStatusBadge,
} from "@/features/orders/components/OrderStatusBadge";
import {
    DELIVERY_STATUS_LABELS,
    ORDER_STATUS_LABELS,
    PAYMENT_STATUS_LABELS,
    ORDER_FREE_SHIPPING_THRESHOLD
} from "@/features/orders/constants/orderConstants";
import {
    cancelOrder,
    completeOrder,
    confirmOrder,
    deliverOrder,
    getOrderById,
    markOrderPaymentAsFailed,
    markOrderPaymentAsPaid,
    prepareOrder,
    shipOrder,
} from "@/features/orders/services/orderService";

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
        case "PayTR":
            return "PayTR";
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

export default function OrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
    
    const [order, setOrder] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [operationLoading, setOperationLoading] = useState(false);
    const [selectedOperation, setSelectedOperation] = useState(null);
    const [error, setError] = useState(null);
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

    useEffect(() => {
        if (isAuthLoading || !isAuthenticated || !params?.id) {
            return;
        }
    
        async function loadOrder() {
            setIsLoading(true);
            setError(null);
    
            try {
                const response = await getOrderById(params.id);
                setOrder(response.data);
            } catch (error) {
                console.error("Sipariş detayı alınamadı:", error);
    
                setError(
                    error?.response?.data?.error?.message ||
                    error?.response?.data?.message ||
                    "Sipariş detayı alınırken bir hata oluştu.",
                );
            } finally {
                setIsLoading(false);
            }
        }
    
        loadOrder();
    }, [isAuthLoading, isAuthenticated, params?.id]);

    async function handleOperation(operation) {
        if (!order || operationLoading) {
            return false;
        }

        setOperationLoading(true);

        try {
            switch (operation) {
                case "confirm":
                    await confirmOrder(order.orderId);
                    break;

                case "prepare":
                    await prepareOrder(order.orderId);
                    break;

                case "paymentPaid":
                    await markOrderPaymentAsPaid(order.orderId);
                    break;

                case "paymentFailed":
                    await markOrderPaymentAsFailed(order.orderId);
                    break;

                case "ship":
                    await shipOrder(order.orderId);
                    break;

                case "deliver":
                    await deliverOrder(order.orderId);
                    break;

                case "complete":
                    await completeOrder(order.orderId);
                    break;

                case "cancel":
                    await cancelOrder(order.orderId);
                    break;

                default:
                    return false;
            }

            const response = await getOrderById(order.orderId);

            setOrder(response.data);

            return true;
        } catch (error) {
            console.error("Sipariş işlemi başarısız oldu:", error);

            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                "Sipariş işlemi sırasında bir hata oluştu.";

            window.alert(message);

            return false;
        } finally {
            setOperationLoading(false);
        }
    }

    async function handleOperationConfirm() {
        if (!selectedOperation) {
            return;
        }

        const isSuccessful = await handleOperation(selectedOperation);

        if (isSuccessful) {
            setSelectedOperation(null);
        }
    }

    function handlePrint() {
        window.print();
    }

    if (isAuthLoading || isLoading) {
        return (
            <AdminLayout>
                <main className="flex min-h-[60vh] items-center justify-center">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </main>
            </AdminLayout>
        );
    }

    if (error || !order) {
        return (
            <AdminLayout>
                <main className="space-y-6">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Siparişlere Dön
                    </button>

                    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
                        <h1 className="text-lg font-bold text-red-700">
                            Sipariş Bulunamadı
                        </h1>

                        <p className="mt-2 text-sm text-red-600">
                            {error || "İstenen sipariş bulunamadı."}
                        </p>
                    </div>
                </main>
            </AdminLayout>
        );
    }

    const shippingAddressLines = getAddressLines(order.shippingAddress);
    const billingAddressLines = getAddressLines(order.billingAddress);

    const isFreeShipping = order.productsTotal >= ORDER_FREE_SHIPPING_THRESHOLD;

    const shippingPaymentType = isFreeShipping
        ? "Gönderici Ödemeli"
        : "Alıcı Ödemeli";

    const shippingCost = isFreeShipping
        ? shippingMethod?.price ?? 0
        : order.shippingCost;

    return (
        <>
            <div className="orders-detail-page">
                <AdminLayout>
                    <main className="space-y-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Siparişlere Dön
                                </button>

                                <div className="flex flex-wrap items-center gap-3">
                                    <h1 className="text-2xl font-bold text-text-primary">
                                        {order.orderNumber}
                                    </h1>

                                    <OrderStatusBadge
                                        status={order.orderStatus}
                                    />
                                </div>

                                <p className="mt-1 text-sm text-text-secondary">
                                    Sipariş detayları ve yönetim işlemleri
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-background-soft"
                            >
                                <FileText className="h-4 w-4" />
                                Siparişi Yazdır
                            </button>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-3">
                            <div className="rounded-xl border border-border bg-white p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    Sipariş Durumu
                                </p>

                                <div className="mt-3">
                                    <OrderStatusBadge
                                        status={order.orderStatus}
                                    />
                                </div>

                                <p className="mt-3 text-sm text-text-secondary">
                                    {getOrderStatusLabel(order.orderStatus)}
                                </p>
                            </div>

                            <div className="rounded-xl border border-border bg-white p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    Ödeme Durumu
                                </p>

                                <div className="mt-3">
                                    <PaymentStatusBadge
                                        status={order.paymentStatus}
                                    />
                                </div>

                                <p className="mt-3 text-sm text-text-secondary">
                                    {getPaymentStatusLabel(
                                        order.paymentStatus,
                                    )}
                                </p>
                            </div>

                            <div className="rounded-xl border border-border bg-white p-5">
                                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                    Teslimat Durumu
                                </p>

                                <div className="mt-3">
                                    <DeliveryStatusBadge
                                        status={order.deliveryStatus}
                                    />
                                </div>

                                <p className="mt-3 text-sm text-text-secondary">
                                    {getDeliveryStatusLabel(
                                        order.deliveryStatus,
                                    )}
                                </p>
                            </div>
                        </div>

                        <section className="rounded-xl border border-border bg-white">
                            <div className="border-b border-border px-5 py-4">
                                <h2 className="text-base font-bold text-text-primary">
                                    Sipariş Bilgileri
                                </h2>
                            </div>

                            <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-5">
                                <div>
                                    <p className="text-xs text-text-secondary">
                                        Sipariş No
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-text-primary">
                                        {order.orderNumber || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-text-secondary">
                                        Oluşturulma Tarihi
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-text-primary">
                                        {formatOrderDate(
                                            order.audit?.createdDate,
                                        )}
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

                        <section className="rounded-xl border border-border bg-white">
                            <div className="border-b border-border px-5 py-4">
                                <h2 className="text-base font-bold text-text-primary">
                                    Müşteri Bilgileri
                                </h2>
                            </div>

                            <div className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <p className="text-xs text-text-secondary">
                                        Ad Soyad
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-text-primary">
                                        {getFullName(
                                            order.shippingAddress,
                                        )}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-text-secondary">
                                        E-posta
                                    </p>
                                    <p className="mt-1 break-all text-sm font-medium text-text-primary">
                                        {order.shippingAddress?.email || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-text-secondary">
                                        Telefon
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-text-primary">
                                        {order.shippingAddress
                                            ?.phoneNumber || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs text-text-secondary">
                                        Kullanıcı ID
                                    </p>
                                    <p className="mt-1 text-sm font-medium text-text-primary">
                                        {order.userId || "—"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h2 className="mb-3 text-base font-bold text-text-primary">
                                Adresler
                            </h2>

                            <div className="grid gap-5 lg:grid-cols-2">
                                <div className="rounded-xl border border-border bg-white p-5">
                                    <h3 className="text-sm font-semibold text-text-primary">
                                        Teslimat Adresi
                                    </h3>

                                    <div className="mt-4 text-sm leading-6 text-text-secondary">
                                        <p className="font-semibold text-text-primary">
                                            {getFullName(
                                                order.shippingAddress,
                                            )}
                                        </p>

                                        {shippingAddressLines.map(
                                            (line, index) => (
                                                <p key={`${line}-${index}`}>
                                                    {line}
                                                </p>
                                            ),
                                        )}

                                        {order.shippingAddress
                                            ?.phoneNumber && (
                                                <p className="mt-2">
                                                    Telefon:{" "}
                                                    {
                                                        order.shippingAddress
                                                            .phoneNumber
                                                    }
                                                </p>
                                            )}
                                    </div>
                                </div>

                                <div className="rounded-xl border border-border bg-white p-5">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-text-primary">
                                            Fatura Adresi
                                        </h3>

                                        {order.billingAddressSameAsShippingAddress && (
                                            <span className="text-xs font-medium text-text-secondary">
                                                Teslimat adresi ile aynı
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-4 text-sm leading-6 text-text-secondary">
                                        <p className="font-semibold text-text-primary">
                                            {getFullName(
                                                order.billingAddress,
                                            )}
                                        </p>

                                        {billingAddressLines.map(
                                            (line, index) => (
                                                <p key={`${line}-${index}`}>
                                                    {line}
                                                </p>
                                            ),
                                        )}

                                        {order.billingAddress
                                            ?.phoneNumber && (
                                                <p className="mt-2">
                                                    Telefon:{" "}
                                                    {
                                                        order.billingAddress
                                                            .phoneNumber
                                                    }
                                                </p>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border border-border bg-white">
                            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
                                <h2 className="text-base font-bold text-text-primary">
                                    Sipariş Ürünleri
                                </h2>

                                <span className="text-sm text-text-secondary">
                                    {order.items?.length ?? 0} ürün
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-[760px] w-full">
                                    <thead>
                                        <tr className="border-b border-border bg-background-soft text-left">
                                            <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                                Ürün
                                            </th>

                                            <th className="px-5 py-3 text-center text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                                Adet
                                            </th>

                                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                                Birim Fiyat
                                            </th>

                                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">
                                                KDV
                                            </th>

                                            <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-text-secondary">
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
                                                <td className="px-5 py-4">
                                                    <p className="font-medium text-text-primary">
                                                        {item.productName}
                                                    </p>

                                                    <p className="mt-1 text-xs text-text-secondary">
                                                        Ürün ID:{" "}
                                                        {item.productId}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4 text-center text-sm text-text-primary">
                                                    {item.quantity}
                                                </td>

                                                <td className="px-5 py-4 text-right text-sm text-text-primary">
                                                    {formatPrice(
                                                        item.unitPrice,
                                                    )}
                                                </td>

                                                <td className="px-5 py-4 text-right text-sm text-text-primary">
                                                    %{item.taxRate}
                                                </td>

                                                <td className="px-5 py-4 text-right text-sm font-semibold text-text-primary">
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

                        <div className="grid gap-5 lg:grid-cols-2">
                            <section className="rounded-xl border border-border bg-white">
                                <div className="border-b border-border px-5 py-4">
                                    <h2 className="text-base font-bold text-text-primary">
                                        Fatura Bilgileri
                                    </h2>
                                </div>

                                <div className="grid gap-5 p-5 sm:grid-cols-2">
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
                            </section>

                            <section className="rounded-xl border border-border bg-white">
                                <div className="border-b border-border px-5 py-4">
                                    <h2 className="text-base font-bold text-text-primary">
                                        Sipariş Özeti
                                    </h2>
                                </div>

                                <div className="space-y-3 p-5 text-sm">
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
                                            {formatPrice(order.subTotal)}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-text-secondary">
                                            KDV
                                        </span>

                                        <span className="font-medium text-text-primary">
                                            {formatPrice(order.taxAmount)}
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

                                            <span className="text-xl font-bold text-primary">
                                                {formatPrice(
                                                    order.grandTotal,
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>

                        {order.orderNotes && (
                            <section className="rounded-xl border border-border bg-white">
                                <div className="border-b border-border px-5 py-4">
                                    <h2 className="text-base font-bold text-text-primary">
                                        Sipariş Notu
                                    </h2>
                                </div>

                                <div className="p-5 text-sm leading-6 text-text-secondary">
                                    {order.orderNotes}
                                </div>
                            </section>
                        )}

                        <section className="rounded-xl border border-border bg-white">
                            <div className="border-b border-border px-5 py-4">
                                <h2 className="text-base font-bold text-text-primary">
                                    Sipariş İşlemleri
                                </h2>
                            </div>

                            <div className="flex flex-wrap gap-2 p-5">
                                {canConfirmOrder(order) && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedOperation("confirm")
                                        }
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
                                        onClick={() =>
                                            setSelectedOperation("prepare")
                                        }
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
                                        onClick={() =>
                                            setSelectedOperation(
                                                "paymentPaid",
                                            )
                                        }
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
                                        onClick={() =>
                                            setSelectedOperation(
                                                "paymentFailed",
                                            )
                                        }
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
                                        onClick={() =>
                                            setSelectedOperation("ship")
                                        }
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
                                        onClick={() =>
                                            setSelectedOperation("deliver")
                                        }
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
                                        onClick={() =>
                                            setSelectedOperation("complete")
                                        }
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
                                        onClick={() =>
                                            setSelectedOperation("cancel")
                                        }
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
                                            Bu sipariş için
                                            gerçekleştirilebilecek başka bir
                                            işlem bulunmuyor.
                                        </p>
                                    )}
                            </div>
                        </section>

                        {selectedOperation && (
                            <OrderOperationConfirmModal
                                order={order}
                                operation={selectedOperation}
                                onClose={() =>
                                    setSelectedOperation(null)
                                }
                                onConfirm={handleOperationConfirm}
                                isLoading={operationLoading}
                            />
                        )}
                    </main>
                </AdminLayout>
            </div>

            <div className="order-print-document">
                <div className="print-header">
                    <div>
                        <div className="print-logo">NalburJet</div>
                        <p className="print-subtitle">
                            Yapı Market ve Nalbur Ürünleri
                        </p>
                    </div>

                    <div className="print-document-title">
                        <h1>SİPARİŞ</h1>
                        <p>{order.orderNumber}</p>
                    </div>
                </div>

                <div className="print-divider" />

                <section className="print-section">
                    <h2>Sipariş Bilgileri</h2>

                    <div className="print-info-grid">
                        <div>
                            <span>Sipariş No</span>
                            <strong>{order.orderNumber || "—"}</strong>
                        </div>

                        <div>
                            <span>Oluşturulma Tarihi</span>
                            <strong>
                                {formatOrderDate(
                                    order.audit?.createdDate,
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Sipariş Durumu</span>
                            <strong>
                                {getOrderStatusLabel(order.orderStatus)}
                            </strong>
                        </div>

                        <div>
                            <span>Ödeme Durumu</span>
                            <strong>
                                {getPaymentStatusLabel(
                                    order.paymentStatus,
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Teslimat Durumu</span>
                            <strong>
                                {getDeliveryStatusLabel(
                                    order.deliveryStatus,
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>Ödeme Yöntemi</span>
                            <strong>
                                {getPaymentMethodLabel(
                                    order.paymentMethod,
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
                                {getFullName(order.shippingAddress)}
                            </p>

                            {shippingAddressLines.map(
                                (line, index) => (
                                    <p key={`${line}-${index}`}>
                                        {line}
                                    </p>
                                ),
                            )}

                            {order.shippingAddress?.phoneNumber && (
                                <p className="print-contact">
                                    <span>Telefon:</span>{" "}
                                    {order.shippingAddress.phoneNumber}
                                </p>
                            )}

                            {order.shippingAddress?.email && (
                                <p>
                                    <span>E-posta:</span>{" "}
                                    {order.shippingAddress.email}
                                </p>
                            )}
                        </div>
                    </section>

                    <section className="print-section">
                        <h2>Fatura Adresi</h2>

                        <div className="print-info-box">
                            <p className="print-strong">
                                {getFullName(order.billingAddress)}
                            </p>

                            {billingAddressLines.map(
                                (line, index) => (
                                    <p key={`${line}-${index}`}>
                                        {line}
                                    </p>
                                ),
                            )}

                            {order.billingAddress?.phoneNumber && (
                                <p className="print-contact">
                                    <span>Telefon:</span>{" "}
                                    {order.billingAddress.phoneNumber}
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
                                <tr key={item.orderItemId}>
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

                <section className="print-total-section">
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
                                {shippingPaymentType}
                            </strong>
                        </div>

                        <div>
                            <span>Kargo Ücreti</span>
                            <strong>
                                {isFreeShipping ? "-" : "+"}
                                {formatPrice(shippingCost)}
                            </strong>
                        </div>

                        <div className="print-grand-total">
                            <span>Genel Toplam</span>
                            <strong>
                                {formatPrice(order.grandTotal)}
                            </strong>
                        </div>
                    </div>
                </section>

                <section className="print-section">
                    <h2>Fatura Bilgileri</h2>

                    <div className="print-info-grid">
                        <div>
                            <span>Fatura Tipi</span>
                            <strong>
                                {getInvoiceTypeLabel(
                                    order.billingInfo?.invoiceType,
                                )}
                            </strong>
                        </div>

                        <div>
                            <span>E-Fatura</span>
                            <strong>
                                {order.billingInfo?.isEInvoice
                                    ? "Evet"
                                    : "Hayır"}
                            </strong>
                        </div>

                        {order.billingInfo?.companyName && (
                            <div>
                                <span>Firma</span>
                                <strong>
                                    {order.billingInfo.companyName}
                                </strong>
                            </div>
                        )}

                        {order.billingInfo
                            ?.taxOrIdentityNumber && (
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

                        {order.billingInfo?.taxOffice && (
                            <div>
                                <span>Vergi Dairesi</span>
                                <strong>
                                    {order.billingInfo.taxOffice}
                                </strong>
                            </div>
                        )}
                    </div>
                </section>

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