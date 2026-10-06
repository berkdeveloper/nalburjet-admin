import AdminLayout from "@/components/layout/AdminLayout";
import ShippingMethodList from "@/features/shippingMethods/components/ShippingMethodList";

export default function ShippingMethodsPage() {
    return (
        <AdminLayout>
            <ShippingMethodList />
        </AdminLayout>
    );
}