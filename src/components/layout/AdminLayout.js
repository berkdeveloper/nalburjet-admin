"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/features/auth/context/AuthContext";
import useOrderNotifications from "@/features/orders/hooks/useOrderNotifications";
import { NotificationProvider } from "@/features/notifications/context/NotificationContext";
import NotificationPopup from "@/features/notifications/components/NotificationPopup";

export default function AdminLayout({ children }) {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useOrderNotifications(
        isAuthenticated && !isLoading,
    );

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!isAuthenticated) {
            router.replace("/giris");
        }
    }, [
        isAuthenticated,
        isLoading,
        router,
    ]);

    if (isLoading || !isAuthenticated) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background-soft">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
            </main>
        );
    }

    return (
        <NotificationProvider>
            <div className="min-h-screen bg-background-soft">
                <AdminSidebar />

                <AdminHeader />

                <main className="ml-64 min-h-screen pt-16">
                    <div className="p-6">
                        {children}
                    </div>
                </main>

                <NotificationPopup />
            </div>
        </NotificationProvider>
    );
}