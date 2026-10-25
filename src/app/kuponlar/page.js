import AdminLayout from "@/components/layout/AdminLayout";
import CouponList from "@/features/coupons/components/CouponList";

export default function CouponsPage() {
    return (
        <AdminLayout>
            <CouponList />
        </AdminLayout>
    );
}
