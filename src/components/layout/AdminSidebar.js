"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Bell,
    Boxes,
    LayoutDashboard,
    Mail,
    Package,
    PanelLeftClose,
    PanelLeftOpen,
    ShieldCheck,
    ShoppingBasket,
    ShoppingCart,
    Tags,
    Truck,
    Users,
    X,
} from "lucide-react";

const navigationItems = [
    { label: "Dashboard", href: "/", icon: LayoutDashboard },
    { label: "Siparişler", href: "/siparisler", icon: ShoppingCart },
    { label: "Bildirimler", href: "/bildirimler", icon: Bell },
    { label: "Ürünler", href: "/urunler", icon: Package },
    { label: "Kategoriler", href: "/kategoriler", icon: Tags },
    { label: "Vitrin Ürünleri", href: "/vitrin-urunleri", icon: Boxes },
    { label: "Kullanıcılar", href: "/kullanicilar", icon: Users },
    { label: "Roller", href: "/roller", icon: ShieldCheck },
    { label: "Sepetler", href: "/sepetler", icon: ShoppingBasket },
    { label: "Kargo Yöntemleri", href: "/kargo-yontemleri", icon: Truck },
    { label: "Bülten Aboneleri", href: "/bulten-aboneleri", icon: Mail },
];

export default function AdminSidebar({
    isMobileOpen,
    onClose,
    isDesktopCollapsed,
    onDesktopToggle,
}) {
    const pathname = usePathname();

    return (
        <aside
            id="admin-sidebar"
            aria-label="Ana menü"
            className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-white transition-[width,transform] duration-300 ease-in-out ${
                isDesktopCollapsed ? "w-[min(18rem,85vw)] lg:w-[72px]" : "w-[min(18rem,85vw)] lg:w-64"
            } ${
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            } lg:translate-x-0`}
        >
            <div
                className={`flex h-16 shrink-0 items-center border-b border-border ${
                    isDesktopCollapsed ? "justify-between px-4 lg:justify-center lg:px-2" : "justify-between px-5 sm:px-6"
                }`}
            >
                <Link
                    href="/"
                    onClick={onClose}
                    title={isDesktopCollapsed ? "NalburJet" : undefined}
                    className={`overflow-hidden whitespace-nowrap text-xl font-bold tracking-tight text-primary ${
                        isDesktopCollapsed ? "lg:hidden" : ""
                    }`}
                >
                    NalburJet
                </Link>

                <button
                    type="button"
                    onClick={onDesktopToggle}
                    aria-label={isDesktopCollapsed ? "Menüyü genişlet" : "Menüyü daralt"}
                    aria-pressed={isDesktopCollapsed}
                    title={isDesktopCollapsed ? "Menüyü genişlet" : "Menüyü daralt"}
                    className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-soft hover:text-primary lg:flex"
                >
                    {isDesktopCollapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
                </button>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Menüyü kapat"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-soft hover:text-text-primary lg:hidden"
                >
                    <X size={22} />
                </button>
            </div>

            <nav
                className={`min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-3 ${
                    isDesktopCollapsed ? "px-2 lg:px-2" : "px-3 sm:px-4"
                }`}
            >
                <div className="space-y-1">
                    {navigationItems.map((item) => {
                        const isActive =
                            item.href === "/"
                                ? pathname === "/"
                                : pathname === item.href || pathname.startsWith(`${item.href}/`);

                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={onClose}
                                aria-current={isActive ? "page" : undefined}
                                aria-label={isDesktopCollapsed ? item.label : undefined}
                                title={isDesktopCollapsed ? item.label : undefined}
                                className={`flex min-h-11 items-center rounded-lg py-2.5 text-sm font-medium transition-colors ${
                                    isDesktopCollapsed
                                        ? "gap-2 justify-start px-3 lg:justify-center lg:gap-0 lg:px-0"
                                        : "gap-2 px-3 lg:gap-2"
                                } ${
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-text-primary hover:bg-background-soft hover:text-primary"
                                }`}
                            >
                                <Icon size={20} className="shrink-0" />

                                <span
                                    className={`overflow-hidden whitespace-nowrap ${
                                        isDesktopCollapsed ? "lg:hidden" : ""
                                    }`}
                                >
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>

            <div
                className={`shrink-0 border-t border-border py-3 ${
                    isDesktopCollapsed ? "px-2 text-center" : "px-5"
                }`}
            >
                <p
                    title={isDesktopCollapsed ? "NalburJet Yönetim Paneli" : undefined}
                    className={`text-xs text-text-secondary ${
                        isDesktopCollapsed ? "lg:hidden" : ""
                    }`}
                >
                    NalburJet Yönetim Paneli
                </p>

                {isDesktopCollapsed && (
                    <span
                        className="hidden text-xs font-bold text-primary lg:inline"
                        aria-label="NalburJet"
                    >
                        NJ
                    </span>
                )}
            </div>
        </aside>
    );
}