import AdminLayout from "@/components/layout/AdminLayout";
import CategoryList from "@/features/categories/components/CategoryList";

export default function CategoriesPage() {
  return (
    <AdminLayout>
      <CategoryList />
    </AdminLayout>
  );
}