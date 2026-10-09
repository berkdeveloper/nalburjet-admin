"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

const navigationItems = [
    { label: "Dashboard", href: "/" },
    { label: "Siparişler", href: "/siparisler" },
    { label: "Bildirimler", href: "/bildirimler" },
    { label: "Ürünler", href: "/urunler" },
    { label: "Kategoriler", href: "/kategoriler" },
    { label: "Vitrin Ürünleri", href: "/vitrin-urunleri" },
    { label: "Kullanıcılar", href: "/kullanicilar" },
    { label: "Roller", href: "/roller" },
    { label: "Sepetler", href: "/sepetler" },
    { label: "Kargo Yöntemleri", href: "/kargo-yontemleri" },
    { label: "Bülten Aboneleri", href: "/bulten-aboneleri" },
];

export default function AdminSidebar({ isMobileOpen, onClose }) {
    const pathname = usePathname();

    return (
        <aside
            id="admin-sidebar"
            aria-label="Ana menü"
            className={`fixed inset-y-0 left-0 z-50 flex w-[min(18rem,85vw)] flex-col border-r border-border bg-white transition-transform duration-300 ease-in-out lg:w-64 lg:translate-x-0 lg:transition-none ${
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            }`}
        >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5 sm:px-6">
                <Link
                    href="/"
                    onClick={onClose}
                    className="text-xl font-bold tracking-tight text-primary"
                >
                    NalburJet
                </Link>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Menüyü kapat"
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-soft hover:text-text-primary lg:hidden"
                >
                    <X size={22} />
                </button>
            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4">
                <div className="space-y-1">
                    {navigationItems.map((item) => {
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname === item.href ||
                                  pathname.startsWith(`${item.href}/`);

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                aria-current={isActive ? "page" : undefined}
                                className={`flex min-h-11 items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-text-primary hover:bg-background-soft hover:text-primary"
                                }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div className="shrink-0 border-t border-border px-5 py-3">
                <p className="text-xs text-text-secondary">
                    NalburJet Yönetim Paneli
                </p>
            </div>
        </aside>
    );
}