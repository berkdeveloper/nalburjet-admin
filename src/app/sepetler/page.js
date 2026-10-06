import AdminLayout from "@/components/layout/AdminLayout";
import CartList from "@/features/carts/components/CartList";

export default function CartsPage() {
    return (
        <AdminLayout>
            <CartList />
        </AdminLayout>
    );
}