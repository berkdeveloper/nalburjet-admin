import AdminLayout from "@/components/layout/AdminLayout";
import Dashboard from "@/features/dashboard/components/Dashboard";

export default function HomePage() {
    return (
        <AdminLayout>
            <Dashboard />
        </AdminLayout>
    );
}