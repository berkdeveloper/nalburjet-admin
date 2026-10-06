import AdminLayout from "@/components/layout/AdminLayout";
import ProductCollectionList from "@/features/productCollections/components/ProductCollectionList";

export default function ProductCollectionsPage() {
    return (
        <AdminLayout>
            <ProductCollectionList />
        </AdminLayout>
    );
}