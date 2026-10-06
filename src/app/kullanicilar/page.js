import AdminLayout from "@/components/layout/AdminLayout";
import UserList from "@/features/users/components/UserList";

export default function UsersPage() {
    return (
        <AdminLayout>
            <UserList />
        </AdminLayout>
    );
}