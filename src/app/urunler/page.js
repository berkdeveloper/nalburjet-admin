import AdminLayout from "@/components/layout/AdminLayout";
import ProductList from "@/features/products/components/ProductList";

export default function ProductsPage() {
  return (
    <AdminLayout>
      <ProductList />
    </AdminLayout>
  );
}