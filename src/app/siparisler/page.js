"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import OrderDetailModal from "@/features/orders/components/OrderDetailModal";
import OrderList from "@/features/orders/components/OrderList";
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

export default function OrdersPage() {
    const router = useRouter();

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [operationLoading, setOperationLoading] = useState(false);
    const [orderListKey, setOrderListKey] = useState(0);

    function handleCloseModal() {
        if (operationLoading) {
            return;
        }

        setSelectedOrder(null);
    }

    function handleShowDetail() {
        if (!selectedOrder) {
            return;
        }

        router.push(`/siparisler/${selectedOrder.orderId}`);
    }

    function handlePrint() {
        window.print();
    }

    async function handleOperation(operation) {
        if (!selectedOrder || operationLoading) {
            return false;
        }

        setOperationLoading(true);

        try {
            switch (operation) {
                case "confirm":
                    await confirmOrder(selectedOrder.orderId);
                    break;

                case "prepare":
                    await prepareOrder(selectedOrder.orderId);
                    break;

                case "paymentPaid":
                    await markOrderPaymentAsPaid(selectedOrder.orderId);
                    break;

                case "paymentFailed":
                    await markOrderPaymentAsFailed(selectedOrder.orderId);
                    break;

                case "ship":
                    await shipOrder(selectedOrder.orderId);
                    break;

                case "deliver":
                    await deliverOrder(selectedOrder.orderId);
                    break;

                case "complete":
                    await completeOrder(selectedOrder.orderId);
                    break;

                case "cancel":
                    await cancelOrder(selectedOrder.orderId);
                    break;

                default:
                    return false;
            }

            const response = await getOrderById(selectedOrder.orderId);

            setSelectedOrder(response.data);
            setOrderListKey((currentKey) => currentKey + 1);

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

    return (
        <AdminLayout>
            <main className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-text-primary">
                        Siparişler
                    </h1>

                    <p className="mt-1 text-sm text-text-secondary">
                        Mağazanızdaki siparişleri buradan yönetin.
                    </p>
                </div>

                <OrderList
                    key={orderListKey}
                    onSelectOrder={setSelectedOrder}
                />

                {selectedOrder && (
                    <OrderDetailModal
                        order={selectedOrder}
                        onClose={handleCloseModal}
                        onPrint={handlePrint}
                        onShowDetail={handleShowDetail}
                        onOperation={handleOperation}
                        operationLoading={operationLoading}
                    />
                )}
            </main>
        </AdminLayout>
    );
}