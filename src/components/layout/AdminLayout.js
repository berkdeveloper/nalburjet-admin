"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";
import { useAuth } from "@/features/auth/context/AuthContext";
import useOrderNotifications from "@/features/orders/hooks/useOrderNotifications";
import { NotificationProvider } from "@/features/notifications/context/NotificationContext";
import NotificationPopup from "@/features/notifications/components/NotificationPopup";

const SIDEBAR_STORAGE_KEY = "nalburjet-admin-sidebar-collapsed";
const sidebarListeners = new Set();
let sidebarCollapsedFallback = false;

function subscribeToSidebarState(callback) {
    sidebarListeners.add(callback);

    function handleStorageChange(event) {
        if (event.key === SIDEBAR_STORAGE_KEY || event.key === null) {
            callback();
        }
    }

    window.addEventListener("storage", handleStorageChange);

    return () => {
        sidebarListeners.delete(callback);
        window.removeEventListener("storage", handleStorageChange);
    };
}

function getSidebarSnapshot() {
    try {
        return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
    } catch {
        return sidebarCollapsedFallback;
    }
}

function getSidebarServerSnapshot() {
    return false;
}

function toggleSidebarState() {
    const nextValue = !getSidebarSnapshot();
    sidebarCollapsedFallback = nextValue;

    try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(nextValue));
    } catch {
        // localStorage kullanılamıyorsa tercih mevcut sayfa oturumu boyunca korunur.
    }

    sidebarListeners.forEach((listener) => listener());
}

export default function AdminLayout({ children }) {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const isDesktopSidebarCollapsed = useSyncExternalStore(
        subscribeToSidebarState,
        getSidebarSnapshot,
        getSidebarServerSnapshot
    );

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
                    isDesktopCollapsed={isDesktopSidebarCollapsed}
                    onDesktopToggle={toggleSidebarState}
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
                    isDesktopSidebarCollapsed={isDesktopSidebarCollapsed}
                />

                <main
                    className={`min-h-screen min-w-0 pt-16 transition-[margin] duration-300 ease-in-out ${
                        isDesktopSidebarCollapsed ? "lg:ml-[72px]" : "lg:ml-64"
                    }`}
                >
                    <div className="min-w-0 p-3 sm:p-4 lg:p-6">
                        {children}
                    </div>
                </main>

                <NotificationPopup />
            </div>
        </NotificationProvider>
    );
}