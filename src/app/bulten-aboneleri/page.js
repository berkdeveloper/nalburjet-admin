import AdminLayout from "@/components/layout/AdminLayout";
import NewsletterSubscriberList from "@/features/newsletterSubscribers/components/NewsletterSubscriberList";

export default function NewsletterSubscribersPage() {
    return (
        <AdminLayout>
            <NewsletterSubscriberList />
        </AdminLayout>
    );
}