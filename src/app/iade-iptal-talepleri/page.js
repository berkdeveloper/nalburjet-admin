"use client";

import AdminLayout from "@/components/layout/AdminLayout";
import OrderReturnRequestList from "@/features/orderReturnRequests/components/OrderReturnRequestList";

export default function OrderReturnRequestsPage() {
    return (
        <AdminLayout>
            <main className="min-w-0 space-y-4 sm:space-y-6">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-text-primary">İade / İptal Talepleri</h1>
                    <p className="mt-1 text-sm text-text-secondary">
                        Müşteri taleplerini inceleyin, onaylayın ve PayTR veya Havale/EFT iade işlemlerini yönetin.
                    </p>
                </div>
                <OrderReturnRequestList />
            </main>
        </AdminLayout>
    );
}
