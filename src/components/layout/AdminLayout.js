"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/features/auth/context/AuthContext";
import useOrderNotifications from "@/features/orders/hooks/useOrderNotifications";
import { NotificationProvider } from "@/features/notifications/context/NotificationContext";
import NotificationPopup from "@/features/notifications/components/NotificationPopup";

export default function AdminLayout({ children }) {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useOrderNotifications(isAuthenticated && !isLoading);

    useEffect(() => {
        if (isLoading) {
            return;
        }

        if (!isAuthenticated) {
            router.replace("/giris");
        }
    }, [isAuthenticated, isLoading, router]);

    useEffect(() => {
        if (!isMobileMenuOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;

        function handleKeyDown(event) {
            if (event.key === "Escape") {
                setIsMobileMenuOpen(false);
            }
        }

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isMobileMenuOpen]);

    if (isLoading || !isAuthenticated) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-background-soft">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
            </main>
        );
    }

    return (
        <NotificationProvider>
            <div className="min-h-screen overflow-x-clip bg-background-soft">
                <AdminSidebar
                    isMobileOpen={isMobileMenuOpen}
                    onClose={() => setIsMobileMenuOpen(false)}
                />

                {isMobileMenuOpen && (
                    <button
                        type="button"
                        aria-label="Menüyü kapat"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[1px] lg:hidden"
                    />
                )}

                <AdminHeader
                    onMenuClick={() => setIsMobileMenuOpen((open) => !open)}
                    isMobileMenuOpen={isMobileMenuOpen}
                />

                <main className="min-h-screen min-w-0 pt-16 lg:ml-64">
                    <div className="min-w-0 p-3 sm:p-4 lg:p-6">
                        {children}
                    </div>
                </main>

                <NotificationPopup />
            </div>
        </NotificationProvider>
    );
}