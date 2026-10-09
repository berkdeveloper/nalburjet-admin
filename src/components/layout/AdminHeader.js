"use client";

import { useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function AdminHeader({ onMenuClick, isMobileMenuOpen }) {
    const router = useRouter();
    const { logout, isLoading } = useAuth();

    const handleLogout = async () => {
        try {
            await logout();
            router.push("/giris");
        } catch {
            // AuthContext hata durumunu yönetiyor.
        }
    };

    return (
        <header className="fixed inset-x-0 top-0 z-30 h-16 border-b border-border bg-white lg:left-64">
            <div className="flex h-full min-w-0 items-center justify-between gap-2 px-3 sm:px-4 lg:px-6">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                    <button
                        type="button"
                        onClick={onMenuClick}
                        aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
                        aria-expanded={isMobileMenuOpen}
                        aria-controls="admin-sidebar"
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-text-primary transition-colors hover:bg-background-soft lg:hidden"
                    >
                        {isMobileMenuOpen ? <X size={21} /> : <Menu size={21} />}
                    </button>

                    <h1 className="truncate text-base font-semibold text-text-primary sm:text-lg">
                        Yönetim Paneli
                    </h1>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-4">
                    <NotificationBell />

                    <div className="hidden text-right sm:block">
                        <p className="text-sm font-medium text-text-primary">
                            Admin
                        </p>
                        <p className="text-xs text-text-secondary">
                            Yönetici
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoading}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-border px-2.5 text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 sm:px-3"
                    >
                        <LogOut size={16} className="shrink-0" />
                        <span>
                            {isLoading ? "Çıkış yapılıyor..." : "Çıkış"}
                        </span>
                    </button>
                </div>
            </div>
        </header>
    );
}