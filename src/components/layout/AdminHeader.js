"use client";

import { useRouter } from "next/navigation";
import NotificationBell from "@/features/notifications/components/NotificationBell";
import { useAuth } from "@/features/auth/context/AuthContext";

export default function AdminHeader() {
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
        <header className="fixed inset-x-0 top-0 z-20 ml-64 h-16 border-b border-border bg-white">
            <div className="flex h-full items-center justify-between px-6">
                <div>
                    <h1 className="text-lg font-semibold text-text-primary">
                        Yönetim Paneli
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <NotificationBell />

                    <div className="text-right">
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
                        className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-primary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {isLoading ? "Çıkış yapılıyor..." : "Çıkış"}
                    </button>
                </div>
            </div>
        </header>
    );
}