import AdminLayout from "@/components/layout/AdminLayout";
import RoleList from "@/features/roles/components/RoleList";

export default function RolesPage() {
    return (
        <AdminLayout>
            <RoleList />
        </AdminLayout>
    );
}